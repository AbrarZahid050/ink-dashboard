from datetime import date

from fastapi.testclient import TestClient

from forecasting.app.forecasting import generate_forecast
from forecasting.app.main import app
from forecasting.app.schemas import ForecastRequest, PurchaseRecord

client = TestClient(app)


def make_request(history, **overrides):
    values = {
        "client_id": "ABC Printing LLC",
        "machine_model": "Mimaki JV100-160",
        "ink_model": "LUS-120",
        "history": history,
        "horizon_months": 3,
    }
    values.update(overrides)
    return ForecastRequest(**values)


def test_health_endpoint_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_forecast_aggregates_purchase_lines_and_returns_colours():
    request = make_request(
        [
            PurchaseRecord(purchased_at=date(2025, 1, 10), color="cyan", quantity=2),
            PurchaseRecord(purchased_at=date(2025, 1, 20), color="Cyan", quantity=1),
            PurchaseRecord(purchased_at=date(2025, 2, 10), color="Black", quantity=2),
        ],
        forecast_start_month=date(2025, 3, 1),
    )
    result = generate_forecast(request)
    assert [item["color"] for item in result["colours"]] == ["Black", "Cyan"]
    cyan = next(item for item in result["colours"] if item["color"] == "Cyan")
    assert cyan["average_monthly_bottles"] == 1.5
    assert len(cyan["forecast"]) == 3


def test_missing_purchase_months_are_counted_as_zero():
    request = make_request([
        PurchaseRecord(purchased_at=date(2025, 1, 10), color="Cyan", quantity=2),
        PurchaseRecord(purchased_at=date(2025, 3, 10), color="Cyan", quantity=4),
    ])
    result = generate_forecast(request)
    assert result["history_months"] == 3
    assert result["colours"][0]["average_monthly_bottles"] == 2.0


def test_peak_and_off_season_use_different_factors():
    request = make_request(
        [PurchaseRecord(purchased_at=date(2025, 1, 10), color="Black", quantity=12)],
        horizon_months=2,
        forecast_start_month=date(2025, 5, 1),
    )
    monthly = generate_forecast(request)["colours"][0]["forecast"]
    assert monthly[0]["seasonal_factor"] == 0.55
    assert monthly[1]["seasonal_factor"] == 0.50
    assert monthly[0]["predicted_bottles"] > monthly[1]["predicted_bottles"]


def test_default_forecast_starts_after_latest_purchase_month():
    request = make_request([
        PurchaseRecord(purchased_at=date(2026, 10, 14), color="Yellow", quantity=2)
    ])
    result = generate_forecast(request)
    assert result["forecast_start_month"] == "2026-11-01"


def test_api_returns_forecast_for_valid_request():
    response = client.post("/forecast", json={
        "client_id": "ABC Printing LLC",
        "machine_model": "Mimaki JV100-160",
        "ink_model": "LUS-120",
        "history": [{
            "purchased_at": "2026-10-14",
            "color": "Yellow",
            "quantity": 2,
        }],
        "horizon_months": 2,
    })
    assert response.status_code == 200
    assert response.json()["colours"][0]["color"] == "Yellow"
    assert len(response.json()["colours"][0]["forecast"]) == 2


def test_api_rejects_empty_history():
    response = client.post("/forecast", json={
        "client_id": "ABC Printing LLC",
        "machine_model": "Mimaki JV100-160",
        "ink_model": "LUS-120",
        "history": [],
    })
    assert response.status_code == 422


def test_api_rejects_zero_or_negative_purchase_quantity():
    response = client.post("/forecast", json={
        "client_id": "ABC Printing LLC",
        "machine_model": "Mimaki JV100-160",
        "ink_model": "LUS-120",
        "history": [{
            "purchased_at": "2026-10-14",
            "color": "Yellow",
            "quantity": 0,
        }],
    })
    assert response.status_code == 422
