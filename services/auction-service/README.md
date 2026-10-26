# Auction Core Microservice (`auction-service`)

## Overview
The **Auction Service** is the core backend microservice for the GearBids platform. Refactored into an enterprise **Spring Boot 4 Java backend** (Spring Boot `4.0.0-RC2`, Java 17 LTS), it manages vehicle listings, stateful session-cookie user authentication, pessimistic concurrency-controlled bidding, anti-sniping countdown extensions, community comments, and asynchronous helper service dispatch.

---

## Architectural Role & API Endpoints

```
[Web Browser] ──── HTTP Session Cookie (gearbids.sid) ────> [ALB: /api/auctions, /api/auth]
                                                                        │
                                                                        ▼
                                                   [auction-service: port 5000]
                                                    ├── PostgreSQL (HikariCP / JdbcTemplate)
                                                    ├── Notification Service (:5001) [X-Service-Token]
                                                    └── Inspection Service (:5002) [X-Service-Token]
```

### Endpoints Catalog

| Method | Path | Description | Auth Required? | Rate Limited? |
|---|---|---|---|---|
| `GET` | `/health`, `/api/health` | Service health status probe | No | No |
| `GET` | `/actuator/health` | Spring Boot Actuator health probe | No | No |
| `POST` | `/api/auth/register` | Register new user account | No | Yes (60 req/15 min) |
| `POST` | `/api/auth/login` | Authenticate and issue `gearbids.sid` session cookie | No | Yes (60 req/15 min) |
| `POST` | `/api/auth/logout` | Terminate session and invalidate cookie | Yes | No |
| `GET` | `/api/auth/me` | Return active authenticated user profile | Yes | No |
| `GET` | `/api/auctions` | List auction listings with filters, search, and pagination | No | No |
| `GET` | `/api/auctions/stats` | Platform auction overview statistics | No | No |
| `GET` | `/api/auctions/{idOrSlug}` | Full auction details, bids, comments, and inspection report | No | No |
| `POST` | `/api/auctions` | Create new vehicle specification and auction listing | Yes | No |
| `POST` | `/api/auctions/{id}/bid` | Place bid with pessimistic row-locking & anti-sniping | Yes | Yes (30 req/min) |
| `POST` | `/api/auctions/{id}/comments` | Post public comment or question to the listing seller | Yes | No |

---

## Core Domain Logic & Security Architecture

### 1. Stateful Session Cookie Authentication
- Built on Jakarta Servlet sessions with secure HTTP-only cookies (`gearbids.sid`).
- **Session Fixation Defense (SEC-06)**: Calls `request.changeSessionId()` upon login to prevent session hijacking.
- **Strict BCrypt Hashing (SEC-01)**: User passwords are verified solely via Spring Security's `BCrypt.checkpw()`.
- **Defense-in-Depth Entity Protection (SEC-18)**: `User.passwordHash` is protected with `@JsonIgnore` and `WRITE_ONLY` access to prevent exposure in responses.

### 2. Concurrency-Safe Bidding & Anti-Sniping Engine
When `POST /api/auctions/{id}/bid` is invoked:
1. **Transactional Boundary**: Executes within a `@Transactional` boundary.
2. **Pessimistic Row Lock**: Issues `SELECT * FROM auctions WHERE id = ? FOR UPDATE`, preventing race conditions and double-spending across concurrent bids.
3. **Anti-Shill & Self-Outbidding Rules**: Sellers cannot bid on their own listings, and active high bidders cannot bid against themselves.
4. **Anti-Sniping Rule**: If `auction.end_time - NOW() <= 120 seconds`, the auction closing time is dynamically extended by 120 seconds.
5. **Reserve Price Confidentiality (SEC-13)**: The secret `reserve_price` is redacted (`null`) in public API responses until `reserve_met` evaluates to `true`.
6. **Asynchronous Webhook Dispatch (SEC-17)**: Dispatches non-blocking notifications to `notification-service` using `X-Service-Token` with configured connect (3s) and read (5s) timeouts.

### 3. Rate Limiting & DoS Protection (SEC-14)
- Sliding-window in-memory rate limiting with bounded capacity (`MAX_ENTRIES = 10,000`) and automatic expired-window eviction.
- Enforces 60 requests/15 minutes on auth endpoints and 30 requests/minute on bidding.
- Validates trusted upstream reverse proxies before reading `X-Forwarded-For`.

---

## 12-Factor Environment Variables

Fully parameterized adhering to the **"Build once, deploy anywhere"** principle:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Listening HTTP port | `5000` |
| `DB_HOST` | PostgreSQL Hostname or Amazon RDS endpoint | `localhost` |
| `DB_PORT` | PostgreSQL Port | `5432` |
| `DB_USER` | PostgreSQL Username | `postgres` |
| `DB_PASSWORD` | PostgreSQL Password | `postgres` |
| `DB_NAME` | PostgreSQL Database name | `gearbids` |
| `DB_SSL_MODE` | PostgreSQL TLS mode (`require` in prod / `prefer` in dev) | `prefer` |
| `SESSION_SECRET` | Secret key for signing session cookie | `gearbids-secret-session-key` |
| `COOKIE_SECURE` | Set `true` when deployed on HTTPS behind ALB | `false` |
| `COOKIE_MAX_AGE` | Cookie lifetime duration | `86400s` (24h) |
| `ALLOWED_ORIGINS` | Comma-delimited list of permitted CORS origins | `http://localhost:3000,http://localhost:80` |
| `INTERNAL_SERVICE_TOKEN` | Shared secret token for inter-service communication | `gearbids-internal-service-token-dev` |
| `NOTIFICATIONS_SERVICE_URL` | Upstream Notification Microservice URL | `http://localhost:5001` |
| `INSPECTIONS_SERVICE_URL` | Upstream VIN Decoder & Inspection Service URL | `http://localhost:5002` |

---

## Local Build & Test

The service includes the standard Maven Wrapper (`mvnw`):

```bash
# Execute unit and MockMvc integration tests (using in-memory H2 PostgreSQL mode)
./mvnw clean test

# Build executable fat JAR (gearbids-auction-service.jar)
./mvnw clean package -DskipTests

# Run standalone application locally
java -jar target/gearbids-auction-service.jar
```

---

## Production EC2 Deployment

Managed as a native Linux systemd daemon (`gearbids-auction.service`):

```bash
# Inspect service status
sudo systemctl status gearbids-auction

# Stream application logs via journalctl
sudo journalctl -u gearbids-auction -f -n 50

# Restart service after SSM deployment
sudo systemctl restart gearbids-auction
```

For complete manual step-by-step enterprise production setup, consult the [Enterprise Manual Installation Guide](../../docs/MANUAL_ENTERPRISE_INSTALLATION_GUIDE.md).
