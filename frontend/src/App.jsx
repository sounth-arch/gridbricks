import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from "recharts";

const API = import.meta.env.VITE_API_URL;
const TOTAL_SLOTS_JAN = 1488; // 31 days x 48 half-hours

function MetricCard({ label, value, unit }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, flex: 1 }}>
      <div style={{ color: "#666", fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: "bold" }}>
        {value ?? "-"} {value != null && unit}
      </div>
    </div>
  );
}

function formatTime(iso) {
  return iso.slice(0, 16).replace("T", " ") + " UTC";
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const r = payload[0].payload;
  return (
    <div style={{ background: "#fff", border: "1px solid #ccc", padding: 8, fontSize: 13 }}>
      <div><strong>Slot:</strong> {formatTime(r.startTime)}</div>
      <div><strong>Forecast published:</strong> {formatTime(r.publishTime)}</div>
      <div><strong>Forecast:</strong> {Math.round(r.forecast)} MW</div>
      <div><strong>Actual:</strong> {Math.round(r.actual)} MW</div>
      <div><strong>Error:</strong> {Math.round(r.error)} MW</div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [day, setDay] = useState("2026-01-01");

  useEffect(() => {
    fetch(`${API}/api/comparison`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p>Could not load data: {error}</p>;
  if (!data) return <p>Loading forecasts from Elexon...</p>;

  // startTime is in UTC. In January, UTC and UK time are the same, so this matches UK days.
  const rows = data.rows
    .filter((r) => r.startTime.startsWith(day))
    .map((r) => ({ ...r, time: r.startTime.slice(11, 16) }));

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>UK Wind Forecast vs Actual</h1>
      <p>
        For each half-hour, the forecast used is the latest one published before the
        09:50 decision cutoff (N2EX gate closure) on the day before delivery.
      </p>

      <label>
        Day:{" "}
        <input
          type="date"
          min="2026-01-01"
          max="2026-01-31"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
      </label>

      <h2 style={{ marginTop: 24, fontSize: 18 }}>January 2026 overall</h2>
      <div style={{ display: "flex", gap: 16, margin: "12px 0" }}>
        <MetricCard label="MAE, all January (avg error)" value={data.metrics.MAE} unit="MW" />
        <MetricCard label="RMSE, all January (penalises big misses)" value={data.metrics.RMSE} unit="MW" />
        <MetricCard label="MAPE, all January (error in %)" value={data.metrics.MAPE} unit="%" />
      </div>
      <p style={{ color: "#444" }}>
        Slots with a usable forecast: <strong>{data.metrics.slots}</strong> of {TOTAL_SLOTS_JAN} half-hours in January.
      </p>

      <h2 style={{ marginTop: 24, fontSize: 18 }}>Selected day: {day}</h2>
      {rows.length === 0 ? (
        <p>No usable forecasts for this day in the data.</p>
      ) : (
        <>
          <p style={{ color: "#444" }}>Slots with a forecast on this day: {rows.length} of 48.</p>
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis label={{ value: "MW", angle: -90, position: "insideLeft" }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="actual" name="Actual wind" stroke="#2563eb" dot={false} />
                <Line type="monotone" dataKey="forecast" name="Forecast used" stroke="#f97316" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto", marginTop: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
                  <th>Time (UTC)</th>
                  <th>Forecast published (UTC)</th>
                  <th>Forecast (MW)</th>
                  <th>Actual (MW)</th>
                  <th>Error (MW)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.startTime} style={{ borderBottom: "1px solid #eee" }}>
                    <td>{r.time}</td>
                    <td>{formatTime(r.publishTime)}</td>
                    <td>{Math.round(r.forecast)}</td>
                    <td>{Math.round(r.actual)}</td>
                    <td>{Math.round(r.error)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}