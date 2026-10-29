# UK Wind Forecast Dashboard
Shows the wind power forecast that was available before the company had to buy electricity for the next day. Shows how wrong the forecasts were, by comparing them to what the wind actually produced

## What it does
Compares the wind forecast used for day-ahead purchases with the actual wind output in January 2026.

## Live app
[https://gridbricks-ocwg.vercel.app/]

## Video demo
[Add the YouTube link after recording]

## Project structure
- backend/: FastAPI API, Elexon data fetching, forecast selection and error metrics
- frontend/: React dashboard (Vite)
- docker-compose.yml: runs both services together
- notes.md: data exploration answers

## How to run locally
1. Install Docker Desktop and make sure it is running.
2. In the project root, run `docker compose up --build`.
3. Open http://localhost:8080 for the dashboard and http://localhost:8000/api/comparison for the API.

## Method
- Actuals come from FUELHH (fuelType WIND).
- Forecasts come from WINDFOR.
- Decision cutoff: 09:50 UK time on the day before delivery, the N2EX day-ahead gate closure ([Nord Pool source](https://support.nordpoolgroup.com/support/solutions/articles/8000088463-about-the-n2ex-day-ahead-auction)).
- Only forecasts with publishTime before the cutoff are used. For each slot, the latest one is chosen.
- Metrics: MAE, RMSE, MAPE. MAPE skips slots where actual generation is zero.

## Assumptions and limitations
- The WINDFOR data has fewer forecasts than expected for some slots.
- Some forecasts have a publishTime after their startTime. These are excluded by the cutoff rule.
- Some late forecasts repeat the same value, which may indicate placeholder data.
- The date filter uses UTC dates. This matches UK days in January but not in summer.

## AI tools used 
I used Claude to help with the research, writing the code, debugging errors, and drafting this README.
