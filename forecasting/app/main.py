from fastapi import FastAPI

from .forecasting import generate_forecast
from .schemas import ForecastRequest

app = FastAPI(
    title="Ink Forecasting Service",
    description="Forecasts client ink-bottle purchases by colour and season.",
    version="0.1.0",
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "ink-forecasting"}


@app.post("/forecast")
def create_forecast(request: ForecastRequest) -> dict:
    return generate_forecast(request)
