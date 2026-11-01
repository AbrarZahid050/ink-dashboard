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


def find_observation(observations, month, color, lead_month):
    return next(
        item for item in observations
        if item["month"] == month
        and item["color"] == color
        and item["lead_month"] == lead_month
    )


def test_backtest_evaluates_trailing_window_at_every_lead_time():
    request = make_request(make_history(months=26))

    result = run_backtest(
        request,
        evaluation_months=12,
        horizon_months=3,
        min_training_months=12,
    )

    assert result["evaluation_start_month"] == "2024-03-01"
    assert result["evaluation_end_month"] == "2025-02-01"
    assert result["evaluation_months"] == 12
    assert result["horizon_months"] == 3
    assert result["forecast_origins"] == 14
    assert result["training_months_at_first_origin"] == 12
    assert result["metrics"]["sample_count"] == 12 * 2 * 3
    assert result["baseline"]["metrics"]["sample_count"] == 12 * 2 * 3
    assert set(result["metrics_by_lead_month"]) == {"1", "2", "3"}
    assert all(
        result["metrics_by_lead_month"][str(lead)]["sample_count"] == 24
        for lead in (1, 2, 3)
    )
    assert all(
        result["baseline"]["metrics_by_lead_month"][str(lead)]["sample_count"] == 24
        for lead in (1, 2, 3)
    )


def test_both_models_use_identical_evaluation_observations_and_training_windows():
    request = make_request(make_history(months=26))
    result = run_backtest(request, evaluation_months=12, horizon_months=3)

    seasonal_keys = [
        (item["month"], item["color"], item["lead_month"], item["actual_bottles"])
        for item in result["seasonal"]["observations"]
    ]
    baseline_keys = [
        (item["month"], item["color"], item["lead_month"], item["actual_bottles"])
        for item in result["baseline"]["observations"]
    ]

    assert seasonal_keys == baseline_keys
    assert result["forecast_origin_details"] == [
        {
            "origin_month": "2024-01-01",
            "training_months": 12,
            "training_end_month": "2023-12-01",
        },
        *[
            {
                "origin_month": f"{year}-{month:02d}-01",
                "training_months": index + 13,
                "training_end_month": (
                    date(year, month, 1).replace(day=1)
                ).isoformat().replace(
                    f"-{month:02d}-01",
                    f"-{(month - 1 or 12):02d}-01"
                ) if month != 1 else f"{year - 1}-12-01",
            }
            for index, (year, month) in enumerate([
                (2024, 2), (2024, 3), (2024, 4), (2024, 5),
                (2024, 6), (2024, 7), (2024, 8), (2024, 9),
                (2024, 10), (2024, 11), (2024, 12), (2025, 1),
                (2025, 2),
            ])
        ],
    ]


def test_baseline_uses_historical_average_without_seasonal_multiplier():
    history = make_history(months=24)
    result = run_backtest(
        make_request(history),
        evaluation_months=1,
        horizon_months=1,
    )

    # The last month is December 2024. Training includes January 2023
    # through November 2024, so the baseline is their unadjusted average.
    black_training_quantities = [
        record.quantity
        for record in history
        if record.color == "Black"
        and record.purchased_at < date(2024, 12, 1)
    ]
    expected_average = sum(black_training_quantities) / 23

    baseline = find_observation(
        result["baseline"]["observations"],
        "2024-12-01",
        "Black",
        1,
    )
    seasonal = find_observation(
        result["seasonal"]["observations"],
        "2024-12-01",
        "Black",
        1,
    )

    assert baseline["predicted_bottles"] == round(expected_average, 2)
    assert seasonal["predicted_bottles"] == round(expected_average * 1.4, 2)


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

    for model in ("seasonal", "baseline"):
        magenta = next(
            item for item in result[model]["observations"]
            if item["color"] == "Magenta"
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
    assert result["baseline"]["metrics"]["mae"] is not None
    assert result["baseline"]["metrics"]["mape_percent"] is not None
    assert result["baseline"]["metrics"]["wape_percent"] is not None
