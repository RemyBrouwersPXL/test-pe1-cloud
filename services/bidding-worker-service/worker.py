#!/usr/bin/env python3
"""
GearBids Bidding & Auction Lifecycle Worker Microservice
Monitors active auctions, finalizes expired listings, resolves reserve pricing,
and dispatches completion events to the notification service.
"""

import os
import sys
import time
import json
import logging
import signal
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [BiddingWorker] %(message)s"
)
logger = logging.getLogger("BiddingWorker")

# Configuration
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = int(os.environ.get("DB_PORT", "5432"))
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "postgres")
DB_NAME = os.environ.get("DB_NAME", "gearbids")
NOTIFICATIONS_URL = os.environ.get("NOTIFICATIONS_SERVICE_URL", "http://localhost:5001")
WORKER_PORT = int(os.environ.get("WORKER_PORT", "5003"))
CHECK_INTERVAL_SECONDS = int(os.environ.get("CHECK_INTERVAL_SECONDS", "3"))

INTERNAL_SERVICE_TOKEN = os.environ.get("INTERNAL_SERVICE_TOKEN", "gearbids-internal-service-token-dev")
APP_VERSION = os.environ.get("APP_VERSION", "1.0.0")
RELEASE_TAG = os.environ.get("RELEASE_TAG", f"v{APP_VERSION}")
GIT_COMMIT = os.environ.get("GIT_COMMIT", "unknown")

metrics = {
    "status": "running",
    "auctions_closed_total": 0,
    "auctions_sold_total": 0,
    "auctions_reserve_not_met_total": 0,
    "auctions_no_bids_total": 0,
    "last_cycle_timestamp": None,
    "uptime_start": time.time(),
    "db_connected": False,
}

running = True


def get_db_connection():
    """Establish and return connection to PostgreSQL."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME,
        cursor_factory=RealDictCursor,
        connect_timeout=5,
    )


def notify_service(event_type, payload):
    """Dispatch event to the notification microservice with internal service authentication (SEC-03)."""
    try:
        url = f"{NOTIFICATIONS_URL}/internal/events"
        headers = {
            "Content-Type": "application/json",
            "X-Service-Token": INTERNAL_SERVICE_TOKEN,
        }
        res = requests.post(url, json={"type": event_type, **payload}, headers=headers, timeout=3)
        if res.status_code in [200, 201]:
            logger.info(f"Dispatched {event_type} notification successfully.")
        else:
            logger.warning(f"Notification service returned {res.status_code}: {res.text}")
    except Exception as e:
        logger.warning(f"Failed to deliver notification to {NOTIFICATIONS_URL}: {e}")


def process_expired_auctions(conn):
    """Find and transition auctions whose end_time has passed."""
    with conn.cursor() as cur:
        # Fetch active auctions that have expired
        cur.execute(
            """
            SELECT id, title, vehicle_id, seller_id, high_bidder_id,
                   current_bid, reserve_price, is_no_reserve, reserve_met, total_bids, end_time
            FROM auctions
            WHERE status = 'ACTIVE' AND end_time <= CURRENT_TIMESTAMP
            FOR UPDATE SKIP LOCKED
            """
        )
        expired = cur.fetchall()

        if not expired:
            return

        logger.info(f"Found {len(expired)} expired active auction(s) to finalize.")

        for auction in expired:
            auction_id = auction["id"]
            title = auction["title"]
            total_bids = auction["total_bids"]
            high_bidder_id = auction["high_bidder_id"]
            current_bid = float(auction["current_bid"])
            is_no_reserve = auction["is_no_reserve"]
            reserve_price = float(auction["reserve_price"]) if auction["reserve_price"] is not None else None
            seller_id = auction["seller_id"]

            new_status = "ENDED"
            if total_bids == 0:
                new_status = "ENDED"
                metrics["auctions_no_bids_total"] += 1
                logger.info(f"Auction #{auction_id} ('{title}') ended with 0 bids.")
            elif is_no_reserve or (reserve_price is not None and current_bid >= reserve_price):
                new_status = "SOLD"
                metrics["auctions_sold_total"] += 1
                logger.info(f"Auction #{auction_id} ('{title}') SOLD to User #{high_bidder_id} for ${current_bid:,.2f}!")

                # Create winner notification
                cur.execute(
                    """
                    INSERT INTO notifications (user_id, auction_id, type, title, message, metadata)
                    VALUES (%s, %s, 'AUCTION_WON', %s, %s, %s)
                    """,
                    (
                        high_bidder_id,
                        auction_id,
                        f"Auction Won: {title}!",
                        f"Congratulations! You won the auction with a high bid of ${current_bid:,.2f}.",
                        json.dumps({"auction_id": auction_id, "amount": current_bid}),
                    ),
                )

                # Send async event to Notification microservice
                notify_service("AUCTION_WON", {
                    "recipient_user_id": high_bidder_id,
                    "auction_id": auction_id,
                    "auction_title": title,
                    "winning_bid": current_bid,
                })

            else:
                new_status = "RESERVE_NOT_MET"
                metrics["auctions_reserve_not_met_total"] += 1
                logger.info(f"Auction #{auction_id} ('{title}') ended RESERVE NOT MET (High bid: ${current_bid:,.2f}, Reserve: ${reserve_price:,.2f}).")

                # Notify seller
                cur.execute(
                    """
                    INSERT INTO notifications (user_id, auction_id, type, title, message, metadata)
                    VALUES (%s, %s, 'AUCTION_ENDED', %s, %s, %s)
                    """,
                    (
                        seller_id,
                        auction_id,
                        f"Auction Ended: {title}",
                        f"Your auction concluded at ${current_bid:,.2f} but did not reach the reserve price.",
                        json.dumps({"auction_id": auction_id, "high_bid": current_bid}),
                    ),
                )

            # Update auction status
            cur.execute(
                """
                UPDATE auctions
                SET status = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (new_status, auction_id),
            )
            conn.commit()
            metrics["auctions_closed_total"] += 1


def worker_loop():
    """Main worker monitoring loop."""
    global running, metrics
    logger.info("Starting Bidding Worker polling loop...")

    while running:
        conn = None
        try:
            conn = get_db_connection()
            metrics["db_connected"] = True
            process_expired_auctions(conn)
            metrics["last_cycle_timestamp"] = time.time()
        except psycopg2.OperationalError as e:
            metrics["db_connected"] = False
            logger.warning(f"Database connection error: {e}. Retrying in {CHECK_INTERVAL_SECONDS}s...")
        except Exception as e:
            logger.error(f"Unexpected worker error: {e}", exc_info=True)
            if conn:
                conn.rollback()
        finally:
            if conn:
                conn.close()

        time.sleep(CHECK_INTERVAL_SECONDS)

    logger.info("Worker loop terminated.")


class HealthHandler(BaseHTTPRequestHandler):
    """HTTP handler for ALB health check and Prometheus/DevOps metrics."""

    def do_GET(self):
        if self.path in ("/health", "/healthz", "/api/health"):
            is_healthy = metrics["db_connected"] or (time.time() - metrics["uptime_start"] < 30)
            status_code = 200 if is_healthy else 503
            self.send_response(status_code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {
                "status": "healthy" if is_healthy else "unhealthy",
                "service": "gearbids-bidding-worker",
                "version": APP_VERSION,
                "release_tag": RELEASE_TAG,
                "git_commit": GIT_COMMIT,
                "db_connected": metrics["db_connected"],
                "uptime_seconds": time.time() - metrics["uptime_start"],
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))

        elif self.path in ("/metrics", "/api/metrics"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {
                **metrics,
                "uptime_seconds": time.time() - metrics["uptime_start"],
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))

        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Suppress routine health check request logs
        return


def start_http_server():
    server = HTTPServer(("0.0.0.0", WORKER_PORT), HealthHandler)
    logger.info(f"Bidding Worker Health & Metrics HTTP server running on port {WORKER_PORT}")
    server.serve_forever()


def handle_shutdown(signum, frame):
    global running
    logger.info("Shutdown signal received. Stopping worker...")
    running = False
    sys.exit(0)


if __name__ == "__main__":
    signal.signal(signal.SIGINT, handle_shutdown)
    signal.signal(signal.SIGTERM, handle_shutdown)

    # Start health HTTP server in daemon thread
    server_thread = threading.Thread(target=start_http_server, daemon=True)
    server_thread.start()

    # Run worker loop in main thread
    worker_loop()
