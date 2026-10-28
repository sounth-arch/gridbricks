from functools import lru_cache

import httpx
import pandas as pd

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"


def _fetch(dataset: str, params: dict) -> pd.DataFrame:
    """Download one Elexon dataset and return it as a table."""
    url = f"{BASE_URL}/{dataset}/stream"
    response = httpx.get(url, params=params, timeout=120)
    response.raise_for_status()
    return pd.DataFrame(response.json())


@lru_cache(maxsize=1)
def get_actuals_raw() -> pd.DataFrame:
    """Actual wind generation (FUELHH) for January 2026."""
    return _fetch("FUELHH", {
        "settlementDateFrom": "2026-01-01",
        "settlementDateTo": "2026-01-31",
        "fuelType": "WIND",
    })


@lru_cache(maxsize=1)
def get_forecasts_raw() -> pd.DataFrame:
    """Wind forecasts (WINDFOR), including forecasts published in late December."""
    return _fetch("WINDFOR", {
        "publishDateTimeFrom": "2025-12-30T00:00:00Z",
        "publishDateTimeTo": "2026-02-01T00:00:00Z",
    })