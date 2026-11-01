from datetime import date

import pytest

from forecasting.app.backtesting import run_backtest
from forecasting.app.schemas import ForecastRequest, PurchaseRecord


def make_history(start_year=2023, start_month=1, months=24):
    records = []
    for offset in range(months):
        year = start_year + (start_month - 1 + offset) // 12
        month = (start_month - 1 + offset) % 12 + 1
        records.append(PurchaseRecord(
            purchased_at=date(year, month, 10),
            color="Black",
            quantity=2 + (month % 3),
        ))
        records.append(PurchaseRecord(
            purchased_at=date(year, month, 20),
            color="Cyan",
            quantity=1 + (month % 2),
        ))
    return records


def make_request(history):
    return ForecastRequest(
        client_id="Test Customer",
        machine_model="Test Machine",
        ink_model="Test Ink",
        history=history,
        horizon_months=3,
    )


def test_backtest_evaluates_trailing_window_at_every_lead_time():
    request = make_request(make_history(months=24))

    result = run_backtest(
        request,
        evaluation_months=12,
        horizon_months=3,
        min_training_months=12,
    )

    assert result["evaluation_start_month"] == "2024-01-01"
    assert result["evaluation_end_month"] == "2024-12-01"
    assert result["evaluation_months"] == 12
    assert result["horizon_months"] == 3
    assert result["forecast_origins"] == 14
    assert result["training_months_at_first_origin"] == 10 + 2
    assert result["metrics"]["sample_count"] == 12 * 2 * 3
    assert set(result["metrics_by_lead_month"]) == {"1", "2", "3"}
    assert all(
        result["metrics_by_lead_month"][str(lead)]["sample_count"] == 24
        for lead in (1, 2, 3)
    )


def test_backtest_uses_only_records_before_each_forecast_origin():
    history = make_history(months=24)
    request = make_request(history)

    result = run_backtest(request, evaluation_months=3, horizon_months=2)

    # The first evaluation month is October 2024. The first origin is
    # September 2024, so its training set must end in August 2024.
    assert result["evaluation_start_month"] == "2024-10-01"
    assert result["training_months_at_first_origin"] == 20


def test_backtest_counts_a_colour_first_seen_in_evaluation_as_zero_forecast():
    history = make_history(months=24)
    history.append(PurchaseRecord(
        purchased_at=date(2024, 12, 5),
        color="Magenta",
        quantity=4,
    ))
    result = run_backtest(
        make_request(history),
        evaluation_months=1,
        horizon_months=1,
    )

    magenta = next(
        item for item in result["observations"] if item["color"] == "Magenta"
    )
    assert magenta["predicted_bottles"] == 0
    assert magenta["actual_bottles"] == 4


def test_backtest_rejects_insufficient_training_history():
    request = make_request(make_history(months=14))

    with pytest.raises(ValueError, match="Not enough history"):
        run_backtest(
            request,
            evaluation_months=12,
            horizon_months=3,
            min_training_months=12,
        )


def test_percentage_metrics_handle_zero_actuals():
    request = make_request(make_history(months=24))
    result = run_backtest(request, evaluation_months=1, horizon_months=1)

    assert result["metrics"]["mae"] is not None
    assert result["metrics"]["mape_percent"] is not None
    assert result["metrics"]["wape_percent"] is not None
