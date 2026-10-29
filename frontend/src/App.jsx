import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
} from "recharts";

const API = import.meta.env.VITE_API_URL;

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
        Forecasts shown are the latest ones published before the 9:50 decision cutoff
        on the day before delivery.
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

      <div style={{ display: "flex", gap: 16, margin: "24px 0" }}>
        <MetricCard label="MAE (average error)" value={data.metrics.MAE} unit="MW" />
        <MetricCard label="RMSE (penalises big misses)" value={data.metrics.RMSE} unit="MW" />
        <MetricCard label="MAPE (error in %)" value={data.metrics.MAPE} unit="%" />
      </div>

      <div style={{ height: 380 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis label={{ value: "MW", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="actual" name="Actual wind" stroke="#2563eb" dot={false} />
            <Line type="monotone" dataKey="forecast" name="Forecast used" stroke="#f97316" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}