import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { COLORS } from "../constants/index.js";
import { formatCurrency, formatNum } from "../utils/formatters.js";
import { getStyles } from "../styles/getStyles.js";
import { analyticsAPI, distributorAPI } from "../utils/api.js";
import SectionHeader from "../components/ui/SectionHeader.jsx";

// ─── Loading spinner ──────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", padding: 60, gap: 16 }}>
      <div style={{
        width: 40, height: 40,
        border: `3px solid ${COLORS.primary}20`,
        borderTop: `3px solid ${COLORS.primary}`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>Loading analytics data…</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage({ dark }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Real data from backend
  const [monthly, setMonthly]           = useState([]);
  const [daily, setDaily]               = useState([]);
  const [distributors, setDistributors] = useState([]);

  useEffect(() => {
    const h = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const s = getStyles(dark, isMobile, isTablet);

  // ── Fetch all three endpoints in parallel ─────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      analyticsAPI.monthly(),       // { data: [{ month, revenue, expenses, profit, milkLiters }] }
      analyticsAPI.daily(),         // { data: [{ date, label, milkCollected, milkRevenue, salesRevenue }] }
      distributorAPI.getAll(),      // { data: [{ _id, name, village, totalLiters, totalAmount, status }] }
    ])
      .then(([monthlyRes, dailyRes, distRes]) => {
        setMonthly(monthlyRes.data || []);
        // Show last 14 days only
        const days = dailyRes.data || [];
        setDaily(days.slice(-14));
        setDistributors(distRes.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (error) return (
    <div style={{
      padding: 40, textAlign: "center", borderRadius: 16,
      background: dark ? "rgba(239,68,68,0.08)" : "#fef2f2",
      border: `1px solid ${COLORS.danger}30`,
    }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.danger, marginBottom: 8 }}>
        Failed to load analytics
      </div>
      <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 6 }}>{error}</div>
      <div style={{ color: "#94a3b8", fontSize: 12 }}>
        Make sure the backend server is running (port 5000)
      </div>
    </div>
  );

  // ── Prepare distributor chart data ────────────────────────────────────────
  // Filter active only, sort by total liters descending
  const activeDistributors = distributors
    .filter((d) => d.status === "Active")
    .sort((a, b) => (b.totalLiters || 0) - (a.totalLiters || 0));

  // Bar chart: top 8 by liters
  // Backend field: totalLiters → chart key: liters
  const distPerformance = activeDistributors.slice(0, 8).map((d) => ({
    name:   (d.name || "Unknown").split(" ")[0],
    liters: d.totalLiters || 0,
    amount: d.totalAmount || 0,
  }));

  return (
    <div>
      {/* Row 1 ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Distributor Performance */}
        <div style={s.card}>
          <SectionHeader title="Distributor Performance (Liters)" dark={dark} />
          {distPerformance.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>
              No active distributor data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }}
                  tickFormatter={(v) => `${formatNum(v)} L`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={72}
                  tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }}
                />
                <Tooltip
                  formatter={(v, name) => [
                    name === "liters" ? `${formatNum(v)} L` : formatCurrency(v),
                    name === "liters" ? "Liters" : "Amount",
                  ]}
                  contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
                />
                <Bar dataKey="liters" name="Liters" fill={COLORS.primary} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Growth Trend */}
        <div style={s.card}>
          <SectionHeader title="Revenue & Profit Trend (12 Months)" dark={dark} />
          {monthly.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>
              No monthly data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              {/* monthly API returns: { month, revenue, expenses, profit, milkLiters } */}
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.accent}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS.accent, r: 4 }}
                  name="Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke={COLORS.primary}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS.primary, r: 4 }}
                  name="Profit"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke={COLORS.danger}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2 ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr",
        gap: 16,
      }}>
        {/* Daily Collection Pattern */}
        <div style={s.card}>
          <SectionHeader title="Daily Revenue Pattern (Last 14 Days)" dark={dark} />
          {daily.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 14 }}>
              No daily data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              {/*
                daily API returns: { date, label, milkCollected, milkRevenue, salesRevenue }
                NOTE: backend has no morning/evening split — we show Milk Revenue vs Sales Revenue
              */}
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="gMilk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.warning} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.accent} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(v), name]}
                  contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="milkRevenue"
                  name="Milk Revenue"
                  stroke={COLORS.warning}
                  fill="url(#gMilk)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="salesRevenue"
                  name="Sales Revenue"
                  stroke={COLORS.accent}
                  fill="url(#gSales)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Best Distributors */}
        <div style={s.card}>
          <SectionHeader title="🏆 Best Distributors" dark={dark} />
          {activeDistributors.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", fontSize: 14 }}>
              No active distributors
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeDistributors.slice(0, 5).map((d, i) => {
                const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                return (
                  <div
                    key={d._id || d.id || i}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 12px",
                      background: i < 3 ? (COLORS.primary + "10") : "transparent",
                      borderRadius: 10,
                      border: i < 3 ? `1px solid ${COLORS.primary}20` : "none",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{medals[i]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {d.name || "Unknown"}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {d.village || d.location || "—"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: COLORS.primary, fontSize: 14 }}>
                        {formatNum(d.totalLiters || 0)} L
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {formatCurrency(d.totalAmount || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
