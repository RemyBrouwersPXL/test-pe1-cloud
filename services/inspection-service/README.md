# Vehicle Inspection & Valuation Microservice (`inspection-service`)

## Overview
The **Inspection & Valuation Service** is an analytical microservice built with **Python 3, FastAPI, and Uvicorn**. It automates:
1. **VIN Decoding**: Validates and decomposes 17-character VIN strings according to ISO 3779 standards (Country of Origin, Manufacturer, Model Year, Assembly Facility).
2. **Algorithmic Vehicle Valuation**: Estimates low and high realistic enthusiast market values based on vehicle age, mileage, model rarity, and condition scores.
3. **Condition Scoring & Mechanical Telemetry**: Produces an Overall Condition Score (1–100), Mechanical Score, Cosmetic Score, and pre-purchase inspection telemetry (chassis integrity, paint depth readings in mils, compression test variance).

---

## Architectural Role & API Endpoints

```
[Auction Core] ─── HTTP POST /inspect ───> [inspection-service: port 5002]
                                                   │
                                            ┌──────┴──────┐
                                            ▼             ▼
                                     [PostgreSQL]    [Valuation Engine]
```

### Endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | ALB target group health probe |
| `GET` | `/decode/{vin}` | Decode VIN attributes without saving |
| `POST` | `/inspect` | Perform full valuation inspection and persist report |
| `GET` | `/reports/{vin}` | Fetch latest inspection report for vehicle VIN |

---

## Configuration & Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Listening HTTP port | `5002` |
| `DB_HOST` | PostgreSQL Hostname / RDS Endpoint | `localhost` |
| `DB_PORT` | PostgreSQL Port | `5432` |
| `DB_USER` | PostgreSQL Username | `postgres` |
| `DB_PASSWORD` | PostgreSQL Password | `postgres` |
| `DB_NAME` | Database catalog name | `gearbids` |

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

# Start server locally
uvicorn main:app --host 0.0.0.0 --port 5002 --reload
```

---

## EC2 Deployment & SSM Operations
In production/test AWS deployments, this service runs on its own **dedicated EC2 instance** (`InspectionInstance`) isolated from other backend workloads.

### Dedicated Host Details:
- **Service Name**: `gearbids-inspection.service`
- **Virtual Environment**: `/opt/gearbids/venv` (protects against AL2023 system RPM collisions)
- **ALB Routing**: Routed directly by ALB Path Rule `/api/inspections*` to port 5002
- **Internal VPC Communication**: Discovered by `auction-service` via SSM parameter `/gearbids/${EnvironmentName}/inspection_service_url`
- **Database Egress**: Ingress authorized to RDS PostgreSQL on port 5432 via `InspectionSecurityGroup`

### Operations via AWS SSM Session Manager:
```bash
# Connect to the dedicated VIN decoder instance
aws ssm start-session --target "<INSPECTION_INSTANCE_ID>"

# Check service status
sudo systemctl status gearbids-inspection

# View real-time service logs
sudo journalctl -u gearbids-inspection -f -n 50

# Restart service
sudo systemctl restart gearbids-inspection
```
