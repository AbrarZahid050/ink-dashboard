from datetime import date
from typing import Annotated

from pydantic import BaseModel, Field, field_validator


class PurchaseRecord(BaseModel):
    """One client purchase line, expressed as bottles."""

    purchased_at: date
    color: Annotated[str, Field(min_length=1, max_length=40)]
    quantity: Annotated[int, Field(gt=0)]

    @field_validator("color")
    @classmethod
    def normalize_color(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Color cannot be blank.")
        return cleaned.title()


class ForecastRequest(BaseModel):
    client_id: Annotated[str, Field(min_length=1, max_length=100)]
    machine_model: Annotated[str, Field(min_length=1, max_length=100)]
    ink_model: Annotated[str, Field(min_length=1, max_length=100)]
    history: Annotated[list[PurchaseRecord], Field(min_length=1)]
    horizon_months: Annotated[int, Field(ge=1, le=12)] = 3
    forecast_start_month: date | None = None

    @field_validator("client_id", "machine_model", "ink_model")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field cannot be blank.")
        return cleaned

    @field_validator("forecast_start_month")
    @classmethod
    def require_first_day_of_month(cls, value: date | None) -> date | None:
        if value is not None and value.day != 1:
            raise ValueError("forecast_start_month must be the first day of a month.")
        return value
