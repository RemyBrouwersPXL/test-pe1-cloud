# Bidding & Auction Lifecycle Worker Microservice (`bidding-worker-service`)

## Overview
The **Bidding Worker Service** is an asynchronous helper microservice developed in **Python 3**. It acts as the autonomous watchdog for all live car auctions on GearBids.

It operates continuously on an EC2 instance as a `systemd` daemon, scanning for expired listings, enforcing reserve price criteria, finalizing sales, and dispatching outbid/winner events to the **Notification Service**.

---

## Architecture & Lifecycle State Machine

```
      [ACTIVE]
         │
         ▼  (end_time <= NOW())
   ┌─────┴─────────────────────────┐
   │ Check bids & reserve price    │
   └─────┬──────────────┬──────────┘
         │              │
    Reserve Met      Reserve Not Met / No Bids
         │              │
         ▼              ▼
      [SOLD]      [RESERVE_NOT_MET] or [ENDED]
         │              │
         └───────┬──────┘
                 ▼
     [Dispatch notification events]
```

### Worker Key Responsibilities:
1. **Automated Auction Closing**: Eliminates reliance on synchronous user page reloads. Transitions auctions from `ACTIVE` to `SOLD`, `RESERVE_NOT_MET`, or `ENDED`.
2. **Notification Dispatch**: Sends `AUCTION_WON` and `AUCTION_ENDED` payloads via REST to the Notification Microservice.
3. **Health & Metrics Telemetry**: Embedded HTTP listener on port `5003` serving `/health` (for AWS ALB/monitoring) and `/metrics` (auctions processed, active count, DB connection state).

---

## Configuration & Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DB_HOST` | PostgreSQL Hostname / RDS Endpoint | `localhost` |
| `DB_PORT` | PostgreSQL Port | `5432` |
| `DB_USER` | PostgreSQL Username | `postgres` |
| `DB_PASSWORD` | PostgreSQL Password | `postgres` |
| `DB_NAME` | Database catalog name | `gearbids` |
| `NOTIFICATIONS_SERVICE_URL` | Notification Microservice endpoint | `http://localhost:5001` |
| `WORKER_PORT` | Health and metrics HTTP port | `5003` |
| `CHECK_INTERVAL_SECONDS` | Poll frequency for auction sweeps | `3` |

---

## Local Development & Testing

```bash
# Set up virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run unit tests
pytest tests/

# Run worker locally
python3 worker.py
```

Test the embedded HTTP health check:
```bash
curl http://localhost:5003/health
curl http://localhost:5003/metrics
```

---

## EC2 Deployment & SSM Operations
Managed on the Backend/Worker EC2 instance via `systemd`:

```bash
# Service status
sudo systemctl status gearbids-bidding-worker

# Live logs
sudo journalctl -u gearbids-bidding-worker -f -n 50

# Restart worker
sudo systemctl restart gearbids-bidding-worker
```

### AWS Systems Manager (SSM) Inspection
```bash
aws ssm send-command \
  --instance-ids "<WORKER_EC2_ID>" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["curl -s http://localhost:5003/metrics"]'
```
