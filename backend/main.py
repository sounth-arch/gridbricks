from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from elexon import get_actuals_raw, get_forecasts_raw
from analysis import prepare_actuals, latest_forecasts, build_table, metrics

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # lets the React frontend call this API from another address
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/comparison")
def comparison():
    actuals = prepare_actuals(get_actuals_raw())
    latest = latest_forecasts(get_forecasts_raw(), actuals)
    table = build_table(actuals, latest)

    rows = [
        {
            "startTime": r.startTime.isoformat(),
            "publishTime": r.publishTime.isoformat(),
            "actual": float(r.actual),
            "forecast": float(r.forecast),
            "error": float(r.error),
        }
        for r in table.itertuples()
    ]
    return {"rows": rows, "metrics": metrics(table)}