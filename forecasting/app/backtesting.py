from __future__ import annotations

from collections import defaultdict
from datetime import date

import pandas as pd

from .forecasting import generate_forecast
from .schemas import ForecastRequest, PurchaseRecord


def _metrics(observations: list[dict]) -> dict:
    """Calculate error metrics for a collection of forecast observations."""
    if not observations:
        return {
            "sample_count": 0,
            "actual_total": 0,
            "predicted_total": 0,
            "mae": None,
            "mape_percent": None,
            "wape_percent": None,
            "bias": None,
        }

    errors = [
        item["predicted_bottles"] - item["actual_bottles"]
        for item in observations
    ]
    absolute_errors = [abs(error) for error in errors]
    actual_total = sum(item["actual_bottles"] for item in observations)
    predicted_total = sum(item["predicted_bottles"] for item in observations)
    nonzero_actuals = [
        item for item in observations if item["actual_bottles"] != 0
    ]

    mape = (
        sum(
            abs(item["predicted_bottles"] - item["actual_bottles"])
            / item["actual_bottles"]
            for item in nonzero_actuals
        )
        / len(nonzero_actuals)
        * 100
        if nonzero_actuals
        else None
    )
    wape = (
        sum(absolute_errors) / actual_total * 100
        if actual_total
        else None
    )

    return {
        "sample_count": len(observations),
        "actual_total": round(actual_total, 2),
        "predicted_total": round(predicted_total, 2),
        "mae": round(sum(absolute_errors) / len(absolute_errors), 2),
        "mape_percent": round(mape, 2) if mape is not None else None,
        "wape_percent": round(wape, 2) if wape is not None else None,
        "bias": round(sum(errors) / len(errors), 2),
    }


def run_backtest(
    request: ForecastRequest,
    evaluation_months: int = 12,
    horizon_months: int = 3,
    min_training_months: int = 12,
) -> dict:
    """Evaluate rolling forecasts against a trailing window of actual purchases.

    Each evaluation month receives one-, two-, and three-month-ahead
    predictions. Forecast origins begin horizon_months - 1 months before
    the evaluation window so every evaluation month has every lead time.
    Only purchase records dated before a forecast origin are used to train
    that origin's forecast.
    """
    if evaluation_months < 1:
        raise ValueError("evaluation_months must be at least 1.")
    if not 1 <= horizon_months <= 12:
        raise ValueError("horizon_months must be between 1 and 12.")
    if min_training_months < 1:
        raise ValueError("min_training_months must be at least 1.")

    history_frame = pd.DataFrame([
        {
            "purchased_at": record.purchased_at,
            "color": record.color,
            "quantity": record.quantity,
        }
        for record in request.history
    ])
    history_frame["month"] = pd.to_datetime(
        history_frame["purchased_at"]
    ).dt.to_period("M")

    first_history_month = history_frame["month"].min()
    last_history_month = history_frame["month"].max()
    evaluation_start = last_history_month - (evaluation_months - 1)
    first_origin = evaluation_start - (horizon_months - 1)
    available_training_months = (first_origin - first_history_month).n + 0

    if available_training_months < min_training_months:
        raise ValueError(
            "Not enough history before the evaluation window: "
            f"need at least {min_training_months} training months, "
            f"but only {available_training_months} are available."
        )

    colours = sorted(history_frame["color"].unique(), key=str.casefold)
    monthly_actuals = (
        history_frame.groupby(["month", "color"])["quantity"].sum().to_dict()
    )

    observations = []
    forecast_origins = pd.period_range(
        start=first_origin, end=last_history_month, freq="M"
    )

    for origin in forecast_origins:
        training_records = [
            record
            for record in request.history
            if pd.Period(record.purchased_at, freq="M") < origin
        ]
        training_months = (
            origin - first_history_month
        ).n

        if training_months < min_training_months:
            raise ValueError(
                f"Forecast origin {origin} has only {training_months} "
                f"training months; at least {min_training_months} are required."
            )

        training_request = request.model_copy(update={
            "history": training_records,
            "horizon_months": horizon_months,
            "forecast_start_month": date(origin.year, origin.month, 1),
        })
        forecast = generate_forecast(training_request)

        predictions = {}
        for colour_result in forecast["colours"]:
            for month_result in colour_result["forecast"]:
                predictions[
                    (pd.Period(month_result["month"], freq="M"),
                     colour_result["color"])
                ] = month_result["predicted_bottles"]

        for lead_month in range(1, horizon_months + 1):
            target_month = origin + (lead_month - 1)
            if not evaluation_start <= target_month <= last_history_month:
                continue

            for color in colours:
                actual = monthly_actuals.get((target_month, color), 0)
                predicted = predictions.get((target_month, color), 0.0)
                observations.append({
                    "month": target_month.to_timestamp().date().isoformat(),
                    "color": color,
                    "lead_month": lead_month,
                    "predicted_bottles": round(float(predicted), 2),
                    "actual_bottles": int(actual),
                    "error_bottles": round(float(predicted) - actual, 2),
                })

    by_lead = {
        str(lead): _metrics([
            item for item in observations if item["lead_month"] == lead
        ])
        for lead in range(1, horizon_months + 1)
    }
    by_color = {
        color: _metrics([
            item for item in observations if item["color"] == color
        ])
        for color in colours
    }

    return {
        "method": "rolling_origin_backtest",
        "evaluation_start_month": evaluation_start.to_timestamp().date().isoformat(),
        "evaluation_end_month": last_history_month.to_timestamp().date().isoformat(),
        "evaluation_months": evaluation_months,
        "horizon_months": horizon_months,
        "forecast_origins": len(forecast_origins),
        "training_months_at_first_origin": available_training_months,
        "metrics": _metrics(observations),
        "metrics_by_lead_month": by_lead,
        "metrics_by_color": by_color,
        "observations": observations,
    }
