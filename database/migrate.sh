#!/usr/bin/env bash
# ==============================================================================
# Database Migration and Seeding Script for GearBids
# Usable in local environments, EC2 UserData bootstrap, and CI/CD pipelines
# ==============================================================================
set -euo pipefail

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-gearbids}"
RUN_SEED="${1:-seed}"

echo "=========================================="
echo " GearBids Database Migration Tool"
echo " Target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo " Mode: schema + ${RUN_SEED}"
echo "=========================================="

export PGPASSWORD="${DB_PASSWORD}"

# Wait for database availability
MAX_RETRIES=30
RETRY_COUNT=0
echo "Waiting for PostgreSQL database to be reachable..."
until PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -c '\q' 2>/dev/null || [ ${RETRY_COUNT} -eq ${MAX_RETRIES} ]; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "Database not ready yet... attempt ${RETRY_COUNT}/${MAX_RETRIES}"
  sleep 2
done

if [ ${RETRY_COUNT} -eq ${MAX_RETRIES} ]; then
  echo "Error: Database timed out after ${MAX_RETRIES} attempts."
  exit 1
fi

# Ensure database exists
echo "Checking if database '${DB_NAME}' exists..."
DB_EXISTS=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" || true)

if [ "${DB_EXISTS}" != "1" ]; then
  echo "Database '${DB_NAME}' does not exist. Creating..."
  PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "postgres" -c "CREATE DATABASE ${DB_NAME};"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run Schema
echo "Applying schema (schema.sql)..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${SCRIPT_DIR}/schema.sql"

# Run Seed if requested
if [ "${RUN_SEED}" = "seed" ] || [ "${RUN_SEED}" = "--seed" ]; then
  echo "Seeding sample Cars & Bids auction data (seed.sql)..."
  psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${SCRIPT_DIR}/seed.sql"
fi

echo "Migration and seeding completed successfully!"
