from __future__ import annotations

from math import ceil

import numpy as np
import pandas as pd

from .schemas import ForecastRequest


# Initial Abu Dhabi planning profile. These are configurable assumptions,
# not measured ink-consumption statistics.
DEFAULT_SEASONAL_FACTORS = {
    1: 1.40, 2: 1.40, 3: 1.35, 4: 1.10,
    5: 0.55, 6: 0.50, 7: 0.50, 8: 0.55,
    9: 1.15, 10: 1.40, 11: 1.40, 12: 1.40,
}


def _confidence_label(history_months: int) -> str:
    if history_months >= 18:
        return "high"
    if history_months >= 6:
        return "medium"
    return "low"


def generate_forecast(request: ForecastRequest) -> dict:
    """Forecast monthly bottle purchases independently for each ink colour.

    The baseline is the average monthly quantity across the supplied history,
    including months with no purchase. A month-specific seasonal multiplier
    adjusts that baseline. This is an explainable starting model, not a
    consumption measurement or a trained machine-learning model.
    """
    frame = pd.DataFrame([
        {
            "purchased_at": record.purchased_at,
            "color": record.color,
            "quantity": record.quantity,
        }
        for record in request.history
    ])
    frame["month"] = pd.to_datetime(frame["purchased_at"]).dt.to_period("M")

    first_history_month = frame["month"].min()
    last_history_month = frame["month"].max()
    history_index = pd.period_range(first_history_month, last_history_month, freq="M")
    history_months = len(history_index)

    monthly_totals = frame.groupby(["color", "month"])["quantity"].sum()

    forecast_start = (
        pd.Period(request.forecast_start_month, freq="M")
        if request.forecast_start_month is not None
        else last_history_month + 1
    )
    forecast_periods = pd.period_range(
        start=forecast_start, periods=request.horizon_months, freq="M"
    )

    colour_forecasts = []
    for color in sorted(frame["color"].unique(), key=str.casefold):
        colour_history = monthly_totals.xs(color, level="color").reindex(
            history_index, fill_value=0
        )
        baseline = float(np.mean(colour_history.to_numpy(dtype=float)))

        monthly_predictions = []
        for period in forecast_periods:
            factor = DEFAULT_SEASONAL_FACTORS[period.month]
            predicted = baseline * factor
            monthly_predictions.append({
                "month": period.to_timestamp().date().isoformat(),
                "seasonal_factor": factor,
                "predicted_bottles": round(predicted, 2),
                "recommended_bottles": ceil(predicted),
            })

        colour_forecasts.append({
            "color": color,
            "average_monthly_bottles": round(baseline, 2),
            "forecast": monthly_predictions,
            "total_predicted_bottles": round(
                sum(item["predicted_bottles"] for item in monthly_predictions), 2
            ),
            "total_recommended_bottles": sum(
                item["recommended_bottles"] for item in monthly_predictions
            ),
        })

    return {
        "client_id": request.client_id,
        "machine_model": request.machine_model,
        "ink_model": request.ink_model,
        "history_months": history_months,
        "confidence": _confidence_label(history_months),
        "forecast_start_month": forecast_periods[0].to_timestamp().date().isoformat(),
        "horizon_months": request.horizon_months,
        "method": "historical_monthly_average_with_seasonal_factors",
        "seasonality_note": (
            "Seasonal factors are initial planning assumptions for Abu Dhabi. "
            "They should be calibrated using actual client purchase and usage data."
        ),
        "colours": colour_forecasts,
    }
