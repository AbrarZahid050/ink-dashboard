# Ink Forecasting Service

A separate Python service for forecasting client ink-bottle purchases. The first version uses an explainable monthly-average baseline adjusted by seasonal factors.

## Requirements

- Python 3.12 or newer
- pip

## Windows PowerShell setup

Run these commands from the repository root:

```powershell
py -3.12 -m venv forecasting/.venv
.\forecasting\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r forecasting/requirements.txt
```

If PowerShell blocks virtual-environment activation, use the environment's Python executable directly:

```powershell
.\forecasting\.venv\Scripts\python.exe -m pip install -r forecasting/requirements.txt
```

## Run the service

From the repository root:

```powershell
python -m uvicorn forecasting.app.main:app --reload --app-dir .
```

The service runs at http://127.0.0.1:8000.

- Health check: GET /health
- Forecast: POST /forecast
- Interactive API documentation: http://127.0.0.1:8000/docs

## Example request

```json
{
  "client_id": "ABC Printing LLC",
  "machine_model": "Mimaki JV100-160",
  "ink_model": "LUS-120",
  "horizon_months": 3,
  "history": [
    {"purchased_at": "2026-09-09", "color": "Cyan", "quantity": 3},
    {"purchased_at": "2026-10-05", "color": "Black", "quantity": 2},
    {"purchased_at": "2026-10-19", "color": "Yellow", "quantity": 3}
  ]
}
```

Each history quantity represents one-litre bottles purchased on that date. If forecast_start_month is omitted, forecasting begins in the month after the latest purchase in the supplied history. If supplied, it must be the first day of a month.

## Initial forecasting method

1. Group purchase quantities by colour and calendar month.
2. Include months with no purchases as zero.
3. Calculate each colour's average monthly purchase quantity across the supplied history.
4. Apply a month-specific seasonal factor to that average.
5. Return predicted bottle quantities and a rounded-up recommended bottle quantity.

The initial Abu Dhabi planning profile treats October–March as peak season, September and April as active transition months, and May–August as off-season. These factors are assumptions to validate against real client data. Purchase history is a proxy for demand; it does not directly measure ink consumption.

## Run tests

From the repository root:

```powershell
python -m pytest forecasting/tests -v
```

## Scope

This service does not connect directly to PostgreSQL. The existing Node.js backend remains responsible for retrieving application data and can call this service over HTTP in a later integration step.
