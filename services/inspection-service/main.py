#!/usr/bin/env python3
"""
GearBids Vehicle Inspection, VIN Decoding & Valuation Microservice
Provides automated VIN decoding, algorithmic market valuation, and
pre-purchase mechanical/cosmetic condition scoring.
"""

import os
import re
import json
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import psycopg2
from psycopg2.extras import RealDictCursor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [InspectionService] %(message)s")
logger = logging.getLogger("InspectionService")

# Configuration
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = int(os.environ.get("DB_PORT", "5432"))
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "postgres")
DB_NAME = os.environ.get("DB_NAME", "gearbids")
PORT = int(os.environ.get("PORT", "5002"))
INTERNAL_SERVICE_TOKEN = os.environ.get("INTERNAL_SERVICE_TOKEN", "gearbids-internal-service-token-dev")
APP_VERSION = os.environ.get("APP_VERSION", "1.0.0")
RELEASE_TAG = os.environ.get("RELEASE_TAG", f"v{APP_VERSION}")
GIT_COMMIT = os.environ.get("GIT_COMMIT", "unknown")

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:80,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app = FastAPI(
    title="GearBids Inspection & Valuation API",
    description="Automated VIN decoding, condition grading, and market value estimation",
    version=APP_VERSION
)

# SEC-05: Strict CORS configuration without wildcards
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def verify_service_token(x_service_token: Optional[str] = Header(None)):
    """Enforce service-to-service authentication (SEC-07)."""
    if os.environ.get("TESTING") == "1":
        return True
    if not x_service_token or x_service_token != INTERNAL_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Valid X-Service-Token required for vehicle inspection generation"
        )
    return True



def get_db_connection():
    try:
        return psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME,
            cursor_factory=RealDictCursor,
            connect_timeout=3,
        )
    except Exception as e:
        logger.warning(f"Database connection unavailable: {e}")
        return None


# -----------------------------------------------------------------------------
# Data Models
# -----------------------------------------------------------------------------
class InspectionRequest(BaseModel):
    vehicle_id: int
    vin: str = Field(..., min_length=10, max_length=17)
    year: int
    make: str
    model: str
    mileage: int


class VinDecodeResponse(BaseModel):
    vin: str
    valid_format: bool
    country_of_origin: str
    manufacturer: str
    model_year: Optional[int]
    vehicle_type: str
    assembly_plant: str


# -----------------------------------------------------------------------------
# VIN Decoder & Valuation Logic
# -----------------------------------------------------------------------------
from valuation_engine import decode_vin_data, calculate_valuation_and_condition



# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------
@app.get("/health")
@app.get("/api/inspections/health")
def health_check():
    return {
        "status": "healthy",
        "service": "gearbids-inspection-service",
        "engine": "FastAPI / Python 3",
        "version": APP_VERSION,
        "release_tag": RELEASE_TAG,
        "git_commit": GIT_COMMIT,
    }


@app.get("/version")
@app.get("/api/inspections/version")
def version_info():
    return {
        "status": "healthy",
        "service": "gearbids-inspection-service",
        "engine": "FastAPI / Python 3",
        "version": APP_VERSION,
        "release_tag": RELEASE_TAG,
        "git_commit": GIT_COMMIT,
    }


@app.get("/decode/{vin}", response_model=VinDecodeResponse)
@app.get("/api/inspections/decode/{vin}", response_model=VinDecodeResponse)
def decode_vin(vin: str):
    data = decode_vin_data(vin)
    return VinDecodeResponse(**data)


@app.post("/internal/inspect")
@app.post("/inspect")
def inspect_vehicle(req: InspectionRequest, x_service_token: Optional[str] = Header(None)):
    verify_service_token(x_service_token)
    logger.info(f"Generating inspection for {req.year} {req.make} {req.model} (VIN: {req.vin})")
    vin_info = decode_vin_data(req.vin)
    valuation = calculate_valuation_and_condition(req.year, req.make, req.model, req.mileage)

    # Persist in DB if reachable
    conn = get_db_connection()
    inspection_id = None
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO inspections (
                        vehicle_id, vin, overall_condition_score, mechanical_score,
                        cosmetic_score, estimated_low_valuation, estimated_high_valuation,
                        accident_reported, owner_count, recalls_count, inspection_report
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        req.vehicle_id,
                        req.vin.upper().strip(),
                        valuation["overall_condition_score"],
                        valuation["mechanical_score"],
                        valuation["cosmetic_score"],
                        valuation["estimated_low_valuation"],
                        valuation["estimated_high_valuation"],
                        valuation["accident_reported"],
                        valuation["owner_count"],
                        valuation["recalls_count"],
                        json.dumps(valuation["inspection_report"]),
                    ),
                )
                inspection_id = cur.fetchone()["id"]
                conn.commit()
        except Exception as e:
            logger.error(f"Error persisting inspection to DB: {e}")
            conn.rollback()
        finally:
            conn.close()

    return {
        "inspection_id": inspection_id,
        "vehicle_id": req.vehicle_id,
        "vin_info": vin_info,
        **valuation,
    }


@app.get("/reports/{vin}")
@app.get("/api/inspections/reports/{vin}")
def get_report_by_vin(vin: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=503, detail="Database temporarily unavailable")

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM inspections WHERE UPPER(vin) = %s ORDER BY created_at DESC LIMIT 1",
                (vin.upper().strip(),),
            )
            report = cur.fetchone()
            if not report:
                raise HTTPException(status_code=404, detail="No inspection report found for this VIN")
            return {"report": report}
    finally:
        conn.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
