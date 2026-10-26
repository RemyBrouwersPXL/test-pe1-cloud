"""
Unit tests for GearBids Vehicle Inspection and VIN Valuation Microservice
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from valuation_engine import decode_vin_data, calculate_valuation_and_condition


def test_vin_decoder_honda():
    vin = "JHMAP11422T001842"
    data = decode_vin_data(vin)
    assert data["country_of_origin"] == "Japan"
    assert "Honda" in data["manufacturer"]
    assert data["model_year"] == 2002
    assert data["valid_format"] is True


def test_vin_decoder_toyota():
    vin = "JT2JA82J5V0019234"
    data = decode_vin_data(vin)
    assert data["country_of_origin"] == "Japan"
    assert "Toyota" in data["manufacturer"]


def test_vin_decoder_porsche():
    vin = "WP0AC29944S692185"
    data = decode_vin_data(vin)
    assert data["country_of_origin"] == "Germany"
    assert "Porsche" in data["manufacturer"]
    assert data["model_year"] == 2004


def test_valuation_calculation():
    val = calculate_valuation_and_condition(2004, "Porsche", "911 GT3", 24800)
    assert val["overall_condition_score"] >= 90
    assert val["estimated_low_valuation"] > 90000.0
    assert val["estimated_high_valuation"] > val["estimated_low_valuation"]
    assert val["mechanical_score"] >= 90
    assert "paint_depth_average_mils" in val["inspection_report"]


def test_valuation_depreciation_and_mileage_premium():
    low_miles = calculate_valuation_and_condition(2002, "Honda", "S2000", 15000)
    high_miles = calculate_valuation_and_condition(2002, "Honda", "S2000", 120000)
    assert low_miles["estimated_high_valuation"] > high_miles["estimated_high_valuation"]


def test_inspection_health_and_version_endpoints():
    pytest = __import__('pytest')
    fastapi = pytest.importorskip("fastapi")
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)

    health_res = client.get("/health")
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["status"] == "healthy"
    assert health_data["service"] == "gearbids-inspection-service"
    assert "version" in health_data
    assert "release_tag" in health_data
    assert "git_commit" in health_data

    ver_res = client.get("/version")
    assert ver_res.status_code == 200
    ver_data = ver_res.json()
    assert ver_data["status"] == "healthy"
    assert "version" in ver_data
    assert "release_tag" in ver_data

