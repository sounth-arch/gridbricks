import numpy as np
import pandas as pd


def prepare_actuals(raw: pd.DataFrame) -> pd.DataFrame:
    """Clean the actuals and add the decision cutoff for each slot."""
    df = raw[["startTime", "generation"]].copy()
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df = df.rename(columns={"generation": "actual"})
    df = df.drop_duplicates("startTime").sort_values("startTime")

    # Decision cutoff: 11:00 UK time on the day before delivery.
    # Confirm this against the official gate closure and state it in the README.
    local = df["startTime"].dt.tz_convert("Europe/London")
    cutoff_local = local.dt.normalize() - pd.Timedelta(days=1) + pd.Timedelta(hours=11)
    df["cutoff"] = cutoff_local.dt.tz_convert("UTC")
    return df


def latest_forecasts(raw: pd.DataFrame, actuals: pd.DataFrame) -> pd.DataFrame:
    """For each slot, keep the most recent forecast published before the cutoff."""
    fc = raw[["startTime", "publishTime", "generation"]].copy()
    fc["startTime"] = pd.to_datetime(fc["startTime"], utc=True)
    fc["publishTime"] = pd.to_datetime(fc["publishTime"], utc=True)
    fc = fc.rename(columns={"generation": "forecast"})

    fc = fc.merge(actuals[["startTime", "cutoff"]], on="startTime")
    fc = fc[fc["publishTime"] <= fc["cutoff"]]   # the key rule
    fc = fc.sort_values("publishTime").groupby("startTime").tail(1)
    return fc[["startTime", "publishTime", "forecast"]]


def build_table(actuals: pd.DataFrame, latest: pd.DataFrame) -> pd.DataFrame:
    """Join the chosen forecast with the actual value and compute the error."""
    table = actuals.merge(latest, on="startTime", how="inner")
    table["error"] = table["forecast"] - table["actual"]
    return table


def metrics(table: pd.DataFrame) -> dict:
    """Calculate MAE, RMSE and MAPE."""
    if table.empty:
        return {"MAE": None, "RMSE": None, "MAPE": None, "slots": 0}

    err = table["error"]
    nonzero = table[table["actual"] != 0]   # MAPE divides by actual, so skip zeros
    mape = (nonzero["error"].abs() / nonzero["actual"]).mean() * 100

    return {
        "MAE": round(float(err.abs().mean()), 1),
        "RMSE": round(float(np.sqrt((err ** 2).mean())), 1),
        "MAPE": round(float(mape), 1),
        "slots": int(len(table)),
    }