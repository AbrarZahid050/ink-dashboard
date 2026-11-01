from __future__ import annotations

from datetime import date

import numpy as np
import pandas as pd

from .forecasting import generate_forecast
from .schemas import ForecastRequest


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


def _metrics_by_lead(observations: list[dict], horizon_months: int) -> dict:
    return {
        str(lead): _metrics([
            item for item in observations if item["lead_month"] == lead
        ])
        for lead in range(1, horizon_months + 1)
    }


def _metrics_by_color(observations: list[dict], colours: list[str]) -> dict:
    return {
        color: _metrics([
            item for item in observations if item["color"] == color
        ])
        for color in colours
    }


def _generate_unseasonal_predictions(
    training_request: ForecastRequest,
    colours: list[str],
) -> dict:
    """Calculate monthly-average predictions without seasonal multipliers."""
    frame = pd.DataFrame([
        {
            "purchased_at": record.purchased_at,
            "color": record.color,
            "quantity": record.quantity,
        }
        for record in training_request.history
    ])
    frame["month"] = pd.to_datetime(
        frame["purchased_at"]
    ).dt.to_period("M")

    first_history_month = frame["month"].min()
    last_history_month = frame["month"].max()
    history_index = pd.period_range(
        first_history_month, last_history_month, freq="M"
    )
    monthly_totals = frame.groupby(["color", "month"])["quantity"].sum()

    forecast_start = pd.Period(
        training_request.forecast_start_month, freq="M"
    )
    forecast_periods = pd.period_range(
        start=forecast_start,
        periods=training_request.horizon_months,
        freq="M",
    )

    predictions = {}
    for color in colours:
        if color in monthly_totals.index.get_level_values("color"):
            colour_history = monthly_totals.xs(
                color, level="color"
            ).reindex(history_index, fill_value=0)
            average = float(np.mean(colour_history.to_numpy(dtype=float)))
        else:
            average = 0.0

        for period in forecast_periods:
            predictions[(period, color)] = average

    return predictions


def _build_model_result(
    observations: list[dict],
    colours: list[str],
    horizon_months: int,
) -> dict:
    return {
        "metrics": _metrics(observations),
        "metrics_by_lead_month": _metrics_by_lead(
            observations, horizon_months
        ),
        "metrics_by_color": _metrics_by_color(observations, colours),
        "observations": observations,
    }


def run_backtest(
    request: ForecastRequest,
    evaluation_months: int = 12,
    horizon_months: int = 3,
    min_training_months: int = 12,
) -> dict:
    """Compare seasonal and unseasonal rolling forecasts on identical data.

    Each evaluation month receives one-, two-, and three-month-ahead
    predictions. Forecast origins begin horizon_months - 1 months before
    the evaluation window so every evaluation month has every lead time.
    Only purchase records dated before a forecast origin are used to train
    that origin's forecasts. Both models receive the exact same records.
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
    available_training_months = (first_origin - first_history_month).n

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

    seasonal_observations = []
    baseline_observations = []
    origin_details = []
    forecast_origins = pd.period_range(
        start=first_origin, end=last_history_month, freq="M"
    )

    for origin in forecast_origins:
        training_records = [
            record
            for record in request.history
            if pd.Period(record.purchased_at, freq="M") < origin
        ]
        training_months = (origin - first_history_month).n

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

        # Seasonal model: use the existing production forecasting function.
        seasonal_forecast = generate_forecast(training_request)
        seasonal_predictions = {}
        for colour_result in seasonal_forecast["colours"]:
            for month_result in colour_result["forecast"]:
                seasonal_predictions[
                    (
                        pd.Period(month_result["month"], freq="M"),
                        colour_result["color"],
                    )
                ] = month_result["predicted_bottles"]

        # Baseline model: same training records, without seasonal factors.
        baseline_predictions = _generate_unseasonal_predictions(
            training_request, colours
        )

        origin_details.append({
            "origin_month": origin.to_timestamp().date().isoformat(),
            "training_months": training_months,
            "training_end_month": (origin - 1).to_timestamp().date().isoformat(),
        })

        for lead_month in range(1, horizon_months + 1):
            target_month = origin + (lead_month - 1)
            if not evaluation_start <= target_month <= last_history_month:
                continue

            for color in colours:
                actual = monthly_actuals.get((target_month, color), 0)

                for observations, predictions in (
                    (seasonal_observations, seasonal_predictions),
                    (baseline_observations, baseline_predictions),
                ):
                    predicted = predictions.get((target_month, color), 0.0)
                    observations.append({
                        "month": target_month.to_timestamp().date().isoformat(),
                        "color": color,
                        "lead_month": lead_month,
                        "predicted_bottles": round(float(predicted), 2),
                        "actual_bottles": int(actual),
                        "error_bottles": round(float(predicted) - actual, 2),
                    })

    seasonal_result = _build_model_result(
        seasonal_observations, colours, horizon_months
    )
    baseline_result = _build_model_result(
        baseline_observations, colours, horizon_months
    )

    seasonal_wape = seasonal_result["metrics"]["wape_percent"]
    baseline_wape = baseline_result["metrics"]["wape_percent"]
    if seasonal_wape is None or baseline_wape is None:
        lower_wape_model = None
        wape_difference = None
    else:
        wape_difference = round(baseline_wape - seasonal_wape, 2)
        lower_wape_model = (
            "seasonal"
            if seasonal_wape < baseline_wape
            else "baseline"
            if baseline_wape < seasonal_wape
            else "tie"
        )

    # Keep the original top-level seasonal metric keys for compatibility
    # with scripts that used the first version of this backtesting tool.
    return {
        "method": "rolling_origin_model_comparison",
        "evaluation_start_month": evaluation_start.to_timestamp().date().isoformat(),
        "evaluation_end_month": last_history_month.to_timestamp().date().isoformat(),
        "evaluation_months": evaluation_months,
        "horizon_months": horizon_months,
        "forecast_origins": len(forecast_origins),
        "training_months_at_first_origin": available_training_months,
        "forecast_origin_details": origin_details,
        "seasonal": seasonal_result,
        "baseline": baseline_result,
        "comparison": {
            "wape_difference_percentage_points": wape_difference,
            "lower_wape_model": lower_wape_model,
        },
        "metrics": seasonal_result["metrics"],
        "metrics_by_lead_month": seasonal_result["metrics_by_lead_month"],
        "metrics_by_color": seasonal_result["metrics_by_color"],
        "observations": seasonal_result["observations"],
    }
