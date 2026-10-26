# Notification Microservice (`notification-service`)

## Overview
The **Notification Service** is a dedicated helper microservice written in **Node.js, Express, and TypeScript**. It delivers real-time and persisted alerts to bidders and sellers when:
- A user is **outbid** on an active listing.
- An auction **closes** (notifying the winning high bidder and the seller).
- A reserve price is missed or listing expired.

It supports both HTTP polling endpoints and **Server-Sent Events (SSE)** for zero-refresh real-time updates directly in the browser.

---

## Architectural Role & API Endpoints

```
[Bidding Worker] ─── HTTP POST /events ───┐
                                          ▼
[Auction Core]   ─── HTTP POST /events ───> [notification-service: port 5001]
                                                        │
                                            ┌───────────┴───────────┐
                                            ▼                       ▼
                                   [PostgreSQL DB]     [SSE Stream: /stream]
```

### Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | ALB target group health probe |
| `POST` | `/events` | Ingest new event (`OUTBID`, `AUCTION_WON`, `AUCTION_ENDED`) |
| `GET` | `/api/notifications` | Retrieve unread/all notifications for a user (`?userId=X`) |
| `PATCH` | `/api/notifications/:id/read` | Mark individual notification as read |
| `POST` | `/api/notifications/read-all` | Mark all notifications read for user |
| `GET` | `/stream` | Server-Sent Events (SSE) live push stream |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Listening HTTP port | `5001` |
| `NODE_ENV` | Environment (`development` / `production`) | `development` |
| `DB_HOST` | PostgreSQL Hostname / RDS Endpoint | `localhost` |
| `DB_PORT` | PostgreSQL Port | `5432` |
| `DB_USER` | PostgreSQL Username | `postgres` |
| `DB_PASSWORD` | PostgreSQL Password | `postgres` |
| `DB_NAME` | Database catalog name | `gearbids` |

---

## Local Development & Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Start server
npm start
```

---

## EC2 Deployment & SSM Operations
On EC2, this service runs natively under `systemd`:

```bash
sudo systemctl status gearbids-notification
sudo journalctl -u gearbids-notification -f -n 50
sudo systemctl restart gearbids-notification
```
