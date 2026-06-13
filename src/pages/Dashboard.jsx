/**
 * Dashboard — Real data from /api/analytics/dashboard, /api/analytics/monthly,
 * /api/analytics/daily, /api/milk-collections
 */
import { useEffect, useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { COLORS } from "../constants/index.js";
import { formatCurrency, formatNum } from "../utils/formatters.js";
import { getStyles } from "../styles/getStyles.js";
import StatCard from "../components/ui/StatCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import { analyticsAPI, milkCollectionAPI } from "../utils/api.js";

/* ── Skeleton ── */
function Skeleton({ width = "100%", height = 14, radius = 8, dark, style }) {
  return (
    <div style={{ width, height, borderRadius: radius,
      background: dark
        ? "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%)"
        : "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s ease-in-out infinite",
      ...style }} />
  );
}

export default function Dashboard({ dark }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [recentCollections, setRecentCollections] = useState([]);

  useEffect(() => {
    const h = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true); setError(null);
      try {
        const [dashRes, monthlyRes, dailyRes, collectRes] = await Promise.all([
          analyticsAPI.dashboard(),
          analyticsAPI.monthly(),
          analyticsAPI.daily(),
          milkCollectionAPI.getAll({ limit: 5 }),
        ]);
        setDashboardStats(dashRes.data);
        setMonthlyData((monthlyRes.data || []).slice(-6));
        setDailyData((dailyRes.data || []).slice(-14));
        setRecentCollections((collectRes.data || []).slice(0, 5));
      } catch (e) {
        setError(e.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const s = getStyles(dark, isMobile, isTablet);

  // Normalize MongoDB Decimal128 or nested value objects
  const n = (v) => Number(typeof v === "object" && v !== null ? (v.raw ?? v.value ?? v.$numberDecimal ?? 0) : v) || 0;

  const stats = dashboardStats ? [
    { icon: "🥛", label: "Today's Collection", value: `${n(dashboardStats.todayCollection)} L`, delta: "Today", positive: true, color: COLORS.primary },
    { icon: "💰", label: "Today's Revenue", value: formatCurrency(n(dashboardStats.todayRevenue)), delta: "Today", positive: true, color: COLORS.accent },
    { icon: "👨‍🌾", label: "Active Distributors", value: n(dashboardStats.activeDistributors), delta: "Registered", positive: true, color: COLORS.purple },
    { icon: "🏪", label: "Active Clients", value: n(dashboardStats.activeClients), delta: "Buyers", positive: true, color: "#06b6d4" },
    { icon: "⏳", label: "Pending Payments", value: formatCurrency(n(dashboardStats.pendingDistPayments ?? dashboardStats.pendingPayments)), delta: "Distributors", positive: false, color: COLORS.warning },
    { icon: "📈", label: "Monthly Revenue", value: formatCurrency(n(dashboardStats.monthlyRevenue)), delta: "This Month", positive: true, color: "#6366f1" },
    { icon: "📉", label: "Net Profit", value: formatCurrency(n(dashboardStats.netProfit)), delta: "This Month", positive: n(dashboardStats.netProfit) >= 0, color: COLORS.accent },
    { icon: "🚛", label: "Monthly Expenses", value: formatCurrency(n(dashboardStats.monthlyExpenses)), delta: "This Month", positive: true, color: "#8b5cf6" },
  ] : [];

  const expensePie = dashboardStats ? [
    { name: "Transportation", value: n(dashboardStats.monthlyExpenses) * 0.20, color: "#3b82f6" },
    { name: "Storage",        value: n(dashboardStats.monthlyExpenses) * 0.13, color: "#10b981" },
    { name: "Electricity",    value: n(dashboardStats.monthlyExpenses) * 0.07, color: "#f59e0b" },
    { name: "Staff Salary",   value: n(dashboardStats.monthlyExpenses) * 0.55, color: "#8b5cf6" },
    { name: "Maintenance",    value: n(dashboardStats.monthlyExpenses) * 0.05, color: "#ef4444" },
  ] : [];

  const cardBg = dark ? "rgba(255,255,255,0.04)" : "#fff";
  const border = dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0";
  const textSec = dark ? "#94a3b8" : "#64748b";
  const textPrimary = dark ? "#f1f5f9" : "#1e293b";

  return (
    <div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: COLORS.primary, fontSize: 16 }}>
          ⏳ Loading dashboard data…
        </div>
      )}
      {error && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
          <p style={{ color: COLORS.danger, fontWeight: 600 }}>{error}</p>
          <button onClick={() => window.location.reload()}
            style={{ marginTop: 12, padding: "10px 24px", background: COLORS.primary, color: "#fff",
              border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats Grid */}
          <div style={s.grid(isMobile ? 2 : isTablet ? 4 : 4)}>
            {stats.map(stat => <StatCard key={stat.label} {...stat} dark={dark} />)}
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 16, marginTop: 20 }}>
            {/* Revenue + Expenses Chart */}
            <div style={{ background: cardBg, border, borderRadius: 16, padding: 20 }}>
              <SectionHeader title="📊 Monthly Revenue & Expenses" dark={dark} />
              {monthlyData.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: textSec }}>No monthly data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: textSec }} />
                    <YAxis tick={{ fontSize: 11, fill: textSec }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v, n) => [formatCurrency(v), n]} contentStyle={{ background: dark ? "#1e293b" : "#fff", border: `1px solid ${dark ? "#334155" : "#e2e8f0"}` }} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill={COLORS.primary} radius={[6,6,0,0]} />
                    <Bar dataKey="expenses" name="Expenses" fill={COLORS.danger} radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Expense Breakdown Pie */}
            <div style={{ background: cardBg, border, borderRadius: 16, padding: 20 }}>
              <SectionHeader title="💸 Expense Breakdown" dark={dark} />
              {expensePie.every(e => e.value === 0) ? (
                <div style={{ textAlign: "center", padding: 40, color: textSec }}>No expense data</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={expensePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {expensePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ marginTop: 8 }}>
                    {expensePie.map(e => (
                      <div key={e.name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, color: textSec }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, display: "inline-block" }} />
                          {e.name}
                        </span>
                        <span style={{ color: textPrimary, fontWeight: 600 }}>{formatCurrency(e.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Daily Collection Trend */}
          <div style={{ background: cardBg, border, borderRadius: 16, padding: 20, marginTop: 20 }}>
            <SectionHeader title="🥛 Daily Milk Collection (Last 14 Days)" dark={dark} />
            {dailyData.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: textSec }}>No daily data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: textSec }} />
                  <YAxis tick={{ fontSize: 10, fill: textSec }} tickFormatter={v => `${v}L`} />
                  <Tooltip formatter={(v, n) => [n.includes("Revenue") ? formatCurrency(v) : `${v} L`, n]} contentStyle={{ background: dark ? "#1e293b" : "#fff", border: `1px solid ${dark ? "#334155" : "#e2e8f0"}` }} />
                  <Legend />
                  <Area type="monotone" dataKey="milkCollected" name="Milk (L)" stroke={COLORS.primary} fill="url(#milkGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recent Collections Table */}
          <div style={{ background: cardBg, border, borderRadius: 16, padding: 20, marginTop: 20 }}>
            <SectionHeader title="📋 Recent Milk Collections" dark={dark} />
            {recentCollections.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: textSec }}>No recent collections</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Distributor","Date","Shift","Qty (L)","Fat %","Total"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11,
                          fontWeight: 700, color: textSec, textTransform: "uppercase",
                          borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentCollections.map(c => (
                      <tr key={c._id}>
                        <td style={{ padding: "12px 12px", fontSize: 13, color: textPrimary, fontWeight: 600 }}>{c.distributorName || "—"}</td>
                        <td style={{ padding: "12px 12px", fontSize: 13, color: textSec }}>{c.date}</td>
                        <td style={{ padding: "12px 12px" }}>
                          <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                            background: c.shift === "Morning" ? "#fef3c7" : "#ede9fe",
                            color: c.shift === "Morning" ? "#92400e" : "#5b21b6" }}>{c.shift}</span>
                        </td>
                        <td style={{ padding: "12px 12px", fontSize: 13, color: textPrimary, fontWeight: 700 }}>{c.quantity} L</td>
                        <td style={{ padding: "12px 12px", fontSize: 13, color: textSec }}>{c.fat || "—"}%</td>
                        <td style={{ padding: "12px 12px", fontSize: 13, color: COLORS.accent, fontWeight: 700 }}>{formatCurrency(c.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
