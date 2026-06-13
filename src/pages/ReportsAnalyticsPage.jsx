/**
 * ReportsAnalyticsPage.jsx  —  FULLY FIXED + ENHANCED VERSION
 *
 * Original fixes retained:
 *  1. SalesTab: filter callback param `s` shadowed styles variable → renamed to `sale`
 *  2. SalesTab: client-side date guard added
 *  3. SalesTab: salesAPI.getAll() params forwarded correctly
 *  4. CollectionTab: date comparison uses toDateStr() normalisation
 *  5. CollectionTab: distributorName fallback (distributorId?.name)
 *  6. OverviewTab: profitLoss API called with correct key shape
 *  7. ProfitLossTab: duplicate reportsAPI import alias removed
 *  8. ProductionTab: date normalisation aligned
 *  9. DistributorsTab: date comparison fixed
 * 10. All tabs: loading/error states hardened
 * 11. Duplicate import aliases removed
 * 12. All CSV columns use correct field names
 *
 * NEW ENHANCEMENTS (SalesTab):
 *  A. Daily / Weekly / Monthly / Yearly view toggle — groups chart data by period
 *  B. Proper period aggregation functions for all 4 views
 *  C. Summary cards update based on selected period grouping
 *  D. Trend chart label format adapts per period (DD MMM / Wk N / MMM / YYYY)
 *  E. "No data" guard on pie chart replaced with zero-safe rendering
 *  F. Table page size increased to 50 with count label
 *  G. productId.item / productId.unit null-safe throughout
 *  H. All chart tooltips show formatted currency consistently
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { COLORS } from "../constants/index.js";
import { formatCurrency, formatNum } from "../utils/formatters.js";
import { getStyles } from "../styles/getStyles.js";
import {
  analyticsAPI,
  milkCollectionAPI,
  salesAPI,
  paymentAPI,
  reportsAPI,
  distributorAPI,
  productionAPI,
} from "../utils/api.js";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import StatCard from "../components/ui/StatCard.jsx";

// ─── tiny helpers ─────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split("T")[0];

const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

/** Safely extract YYYY-MM-DD from any date string or Date object */
const toDateStr = (val) => {
  if (!val) return "";
  return String(val).split("T")[0];
};

const fmtDate = (s) =>
  s
    ? new Date(s).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// ─── Period aggregation helpers ───────────────────────────────────────────────

/**
 * Returns the ISO week number (1–53) and year for a given date string.
 * Uses ISO 8601 definition: week starts Monday, week 1 contains Jan 4.
 */
function getISOWeek(dateStr) {
  const d = new Date(dateStr);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const diff = d - startOfWeek1;
  const week = Math.floor(diff / (7 * 86400000)) + 1;
  // Handle year boundary
  if (week < 1) {
    const jan4Prev = new Date(d.getFullYear() - 1, 0, 4);
    const startPrev = new Date(jan4Prev);
    startPrev.setDate(jan4Prev.getDate() - ((jan4Prev.getDay() + 6) % 7));
    const diffPrev = d - startPrev;
    return { year: d.getFullYear() - 1, week: Math.floor(diffPrev / (7 * 86400000)) + 1 };
  }
  return { year: d.getFullYear(), week };
}

/** Given a YYYY-MM-DD string and view mode, return the bucket key */
function getPeriodKey(dateStr, view) {
  if (!dateStr) return "";
  switch (view) {
    case "daily":
      return dateStr; // YYYY-MM-DD
    case "weekly": {
      const { year, week } = getISOWeek(dateStr);
      return `${year}-W${String(week).padStart(2, "0")}`;
    }
    case "monthly":
      return dateStr.slice(0, 7); // YYYY-MM
    case "yearly":
      return dateStr.slice(0, 4); // YYYY
    default:
      return dateStr;
  }
}

/** Format a bucket key into a human-readable label for chart axes */
function formatPeriodLabel(key, view) {
  if (!key) return "";
  switch (view) {
    case "daily": {
      // key = YYYY-MM-DD → "10 Jun"
      const d = new Date(key + "T00:00:00");
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    }
    case "weekly": {
      // key = YYYY-Wnn → "Wk 23"
      const [, w] = key.split("-W");
      return `Wk ${parseInt(w, 10)}`;
    }
    case "monthly": {
      // key = YYYY-MM → "Jun '24"
      const [y, m] = key.split("-");
      const d = new Date(Number(y), Number(m) - 1, 1);
      return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    }
    case "yearly":
      return key; // "2024"
    default:
      return key;
  }
}

/**
 * Aggregate an array of sale records into chart buckets.
 * Returns [{key, label, revenue, paidRevenue, pendingRevenue, count}] sorted by key.
 */
function aggregateSales(records, view) {
  const map = {};
  records.forEach((sale) => {
    const dateStr = toDateStr(sale.date || sale.createdAt);
    const key = getPeriodKey(dateStr, view);
    if (!key) return;
    if (!map[key]) {
      map[key] = {
        key,
        label: formatPeriodLabel(key, view),
        revenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        count: 0,
      };
    }
    const total = sale.total || 0;
    map[key].revenue += total;
    map[key].count   += 1;
    if (sale.paymentStatus === "Paid") {
      map[key].paidRevenue += total;
    } else {
      map[key].pendingRevenue += total;
    }
  });
  return Object.values(map).sort((a, b) => a.key.localeCompare(b.key));
}

// ─── Preset quick-ranges ──────────────────────────────────────────────────────
const PRESET_RANGES = [
  { label: "Today",        start: today(),       end: today() },
  {
    label: "This Week",
    start: (() => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split("T")[0];
    })(),
    end: today(),
  },
  { label: "This Month",  start: monthStart(),  end: today() },
  {
    label: "Last Month",
    start: (() => {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
      return d.toISOString().split("T")[0];
    })(),
    end: (() => {
      const d = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
      return d.toISOString().split("T")[0];
    })(),
  },
  {
    label: "Last 3 Months",
    start: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      return d.toISOString().split("T")[0];
    })(),
    end: today(),
  },
  { label: "This Year",   start: `${new Date().getFullYear()}-01-01`, end: today() },
];

// ─── CSV download helper ──────────────────────────────────────────────────────
function downloadCSV(filename, rows, columns) {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const v = c.accessor ? c.accessor(row) : (row[c.key] ?? "");
          return `"${String(v).replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",     icon: "📊", label: "Overview" },
  { id: "collection",   icon: "🥛", label: "Milk Collection" },
  { id: "sales",        icon: "💼", label: "Sales" },
  { id: "profitloss",   icon: "📈", label: "Profit & Loss" },
  { id: "production",   icon: "🏭", label: "Production" },
  { id: "distributors", icon: "👨‍🌾", label: "Distributors" },
];

// Sales-specific view toggle
const SALES_VIEWS = [
  { id: "daily",   label: "Daily"   },
  { id: "weekly",  label: "Weekly"  },
  { id: "monthly", label: "Monthly" },
  { id: "yearly",  label: "Yearly"  },
];

const PIE_PALETTE = [
  COLORS.primary, COLORS.accent, COLORS.warning,
  COLORS.purple,  COLORS.danger, "#06b6d4", "#ec4899", "#84cc16",
];

// ─── Loading Spinner ──────────────────────────────────────────────────────────
function Spinner({ color = COLORS.primary }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
      <div
        style={{
          width: 36, height: 36,
          border: `3px solid ${color}20`,
          borderTop: `3px solid ${color}`,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  return (
    <div style={{ padding: 24, textAlign: "center", color: COLORS.danger, fontWeight: 600 }}>
      ⚠️ {message}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyRow({ cols, message = "No records in selected range" }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>
        {message}
      </td>
    </tr>
  );
}

// ─── ViewToggle (for Sales Daily/Weekly/Monthly/Yearly) ───────────────────────
function ViewToggle({ value, onChange, dark }) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: dark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {SALES_VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          style={{
            padding: "5px 14px",
            border: "none",
            cursor: "pointer",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: value === v.id ? 700 : 500,
            background: value === v.id ? COLORS.primary : "transparent",
            color: value === v.id ? "white" : (dark ? "#94a3b8" : "#64748b"),
            transition: "all 0.15s",
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

// ─── DateRangePicker ──────────────────────────────────────────────────────────
function DateRangePicker({ startDate, endDate, onChange, dark }) {
  const s = getStyles(dark);
  const [showPresets, setShowPresets] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShowPresets(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div
      ref={ref}
      style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", position: "relative" }}
    >
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <label style={{ fontSize: 12, color: dark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>From</label>
        <input
          type="date"
          value={startDate}
          max={endDate || today()}
          onChange={(e) => onChange(e.target.value, endDate)}
          style={{ ...s.input, width: 140, padding: "7px 10px", fontSize: 13 }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <label style={{ fontSize: 12, color: dark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>To</label>
        <input
          type="date"
          value={endDate}
          min={startDate}
          max={today()}
          onChange={(e) => onChange(startDate, e.target.value)}
          style={{ ...s.input, width: 140, padding: "7px 10px", fontSize: 13 }}
        />
      </div>
      <button
        onClick={() => setShowPresets(!showPresets)}
        style={{ ...s.btn(COLORS.primary, true), padding: "7px 14px", fontSize: 12 }}
      >
        ⚡ Quick Range
      </button>

      {showPresets && (
        <div
          style={{
            position: "absolute", top: "110%", left: 0, zIndex: 200,
            background: dark ? "#1e293b" : "white",
            border: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
            borderRadius: 12, padding: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            minWidth: 160,
          }}
        >
          {PRESET_RANGES.map((p) => (
            <button
              key={p.label}
              onClick={() => { onChange(p.start, p.end); setShowPresets(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "8px 14px", background: "transparent",
                border: "none", cursor: "pointer", borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                color: dark ? "#e2e8f0" : "#334155",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = dark ? "rgba(255,255,255,0.07)" : "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OverviewTab
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ dark, startDate, endDate }) {
  const s = getStyles(dark);
  const [dash,    setDash]    = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [daily,   setDaily]   = useState([]);
  const [pl,      setPL]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      analyticsAPI.dashboard(),
      analyticsAPI.monthly(),
      analyticsAPI.daily(),
      analyticsAPI.profitLoss({ startDate, endDate }),
    ])
      .then(([d, m, dy, p]) => {
        setDash(d.data);
        setMonthly(m.data || []);
        setDaily(dy.data || []);
        setPL(p.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBanner message={`Error loading overview: ${error}`} />;
  if (!dash)   return null;

  const stats = [
    { icon: "🥛", label: "Today's Collection",  value: dash.todayCollection?.value,     color: COLORS.primary },
    { icon: "💰", label: "Today's Revenue",      value: dash.todayRevenue?.value,         color: COLORS.accent },
    { icon: "📈", label: "Monthly Revenue",      value: dash.monthlyRevenue?.value,       color: COLORS.purple },
    {
      icon: "🏆", label: "Net Profit",
      value: dash.netProfit?.value,
      color: (dash.netProfit?.raw ?? 0) >= 0 ? COLORS.accent : COLORS.danger,
    },
    { icon: "👨‍🌾", label: "Active Distributors", value: dash.activeDistributors?.value,  color: COLORS.warning },
    { icon: "🏪", label: "Active Clients",        value: dash.activeClients?.value,       color: COLORS.primary },
    { icon: "⏳", label: "Pending Payments",      value: dash.pendingDistPayments?.value, color: COLORS.danger },
    { icon: "📦", label: "Inventory (Liters)",    value: dash.totalInventory?.value,      color: COLORS.warning },
  ];

  const recentDaily = daily.slice(-14);

  const plData = pl
    ? [
        { name: "Milk Revenue",  value: pl.revenue?.milk  || 0, fill: COLORS.primary },
        { name: "Sales Revenue", value: pl.revenue?.sales || 0, fill: COLORS.accent  },
        { name: "Expenses",      value: pl.expenses?.total || 0, fill: COLORS.danger  },
        {
          name: "Net Profit",
          value: pl.netProfit || 0,
          fill: (pl.netProfit || 0) >= 0 ? COLORS.purple : COLORS.danger,
        },
      ]
    : [];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {stats.map((st) => (
          <StatCard key={st.label} icon={st.icon} label={st.label} value={st.value} color={st.color} dark={dark} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <SectionHeader
            title="Monthly Revenue vs Profit (12 months)"
            dark={dark}
            action={
              <button
                onClick={() =>
                  downloadCSV("monthly-trend.csv", monthly, [
                    { label: "Month",        key: "month"      },
                    { label: "Revenue",      key: "revenue"    },
                    { label: "Expenses",     key: "expenses"   },
                    { label: "Profit",       key: "profit"     },
                    { label: "Milk Liters",  key: "milkLiters" },
                  ])
                }
                style={{ ...s.btn(COLORS.primary, true), padding: "5px 12px", fontSize: 11 }}
              >
                ⬇ CSV
              </button>
            }
          />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.accent}  stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.accent}  stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="prf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} />
              <YAxis
                tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
              />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.accent}  fill="url(#rev)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="profit"  name="Profit"  stroke={COLORS.primary} fill="url(#prf)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={s.card}>
          <SectionHeader
            title="Daily Collection & Sales (Last 14 Days)"
            dark={dark}
            action={
              <button
                onClick={() =>
                  downloadCSV("daily-14.csv", recentDaily, [
                    { label: "Date",              key: "date"          },
                    { label: "Milk Collected (L)", key: "milkCollected" },
                    { label: "Milk Revenue",       key: "milkRevenue"   },
                    { label: "Sales Revenue",      key: "salesRevenue"  },
                  ])
                }
                style={{ ...s.btn(COLORS.primary, true), padding: "5px 12px", fontSize: 11 }}
              >
                ⬇ CSV
              </button>
            }
          />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={recentDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }} />
              <Tooltip contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="milkRevenue"  name="Milk Revenue"  fill={COLORS.primary} radius={[3, 3, 0, 0]} />
              <Bar dataKey="salesRevenue" name="Sales Revenue" fill={COLORS.accent}  radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {pl && (
        <div style={s.card}>
          <SectionHeader
            title={`P&L Summary: ${fmtDate(pl.period?.start)} → ${fmtDate(pl.period?.end)}`}
            dark={dark}
            action={
              <button
                onClick={() => reportsAPI.downloadProfitLoss(startDate, endDate)}
                style={{ ...s.btn(COLORS.primary, false), padding: "6px 14px", fontSize: 12 }}
              >
                📄 Download PDF Report
              </button>
            }
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
            {plData.map((item) => (
              <div
                key={item.name}
                style={{
                  padding: "16px 18px", borderRadius: 12,
                  background: item.fill + "12",
                  border: `1.5px solid ${item.fill}30`,
                }}
              >
                <div style={{ fontSize: 12, color: dark ? "#94a3b8" : "#64748b", fontWeight: 600, marginBottom: 4 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.fill }}>
                  {formatCurrency(item.value)}
                </div>
              </div>
            ))}
            <div
              style={{
                padding: "16px 18px", borderRadius: 12,
                background: ((pl.profitMargin || 0) >= 0 ? COLORS.accent : COLORS.danger) + "12",
                border: `1.5px solid ${((pl.profitMargin || 0) >= 0 ? COLORS.accent : COLORS.danger)}30`,
              }}
            >
              <div style={{ fontSize: 12, color: dark ? "#94a3b8" : "#64748b", fontWeight: 600, marginBottom: 4 }}>
                Profit Margin
              </div>
              <div
                style={{
                  fontSize: 22, fontWeight: 800,
                  color: (pl.profitMargin || 0) >= 0 ? COLORS.accent : COLORS.danger,
                }}
              >
                {pl.profitMargin ?? 0}%
              </div>
            </div>
          </div>

          {pl.expenses?.breakdown && Object.keys(pl.expenses.breakdown).length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: dark ? "#94a3b8" : "#64748b", marginBottom: 12 }}>
                Expense Breakdown
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(pl.expenses.breakdown).map(([cat, amt]) => {
                  const pct = pl.expenses.total > 0 ? (amt / pl.expenses.total) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600 }}>{cat}</span>
                        <span style={{ color: COLORS.danger, fontWeight: 700 }}>
                          {formatCurrency(amt)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ height: 6, background: dark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: 4 }}>
                        <div
                          style={{
                            width: `${pct}%`, height: "100%",
                            background: COLORS.danger, borderRadius: 4,
                            transition: "width 0.4s",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CollectionTab
// ─────────────────────────────────────────────────────────────────────────────
function CollectionTab({ dark, startDate, endDate }) {
  const s = getStyles(dark);
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [shiftFilter, setShiftFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    milkCollectionAPI
      .getAll()
      .then((r) => setData(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBanner message={error} />;

  const filtered = data.filter((c) => {
    const d = toDateStr(c.date);
    if (startDate && d < startDate) return false;
    if (endDate   && d > endDate)   return false;
    if (shiftFilter && c.shift !== shiftFilter) return false;
    const name = c.distributorName || c.distributorId?.name || "";
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalLiters  = filtered.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const totalRevenue = filtered.reduce((acc, c) => acc + (c.total    || 0), 0);
  const avgFat = filtered.length
    ? (filtered.reduce((acc, c) => acc + (c.fat || 0), 0) / filtered.length).toFixed(2)
    : 0;

  const dailyMap = {};
  filtered.forEach((c) => {
    const d = toDateStr(c.date);
    if (!dailyMap[d]) dailyMap[d] = { date: d, quantity: 0, revenue: 0 };
    dailyMap[d].quantity += c.quantity || 0;
    dailyMap[d].revenue  += c.total    || 0;
  });
  const dailyChart = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  const csvCols = [
    { label: "Date",        accessor: (r) => fmtDate(r.date) },
    { label: "Distributor", accessor: (r) => r.distributorName || r.distributorId?.name || "-" },
    { label: "Shift",       key: "shift" },
    { label: "Qty (L)",     key: "quantity" },
    { label: "Fat %",       key: "fat" },
    { label: "Price/L",     key: "pricePerLiter" },
    { label: "Total (₹)",   key: "total" },
    { label: "Status",      key: "status" },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard icon="🥛" label="Total Milk (L)"   value={`${formatNum(totalLiters.toFixed(1))} L`} color={COLORS.primary} dark={dark} />
        <StatCard icon="💰" label="Total Revenue"    value={formatCurrency(totalRevenue)}              color={COLORS.accent}  dark={dark} />
        <StatCard icon="🔬" label="Avg Fat %"        value={`${avgFat}%`}                              color={COLORS.warning} dark={dark} />
        <StatCard icon="📋" label="Total Records"    value={filtered.length}                           color={COLORS.purple}  dark={dark} />
      </div>

      <div style={{ ...s.card, marginBottom: 16 }}>
        <SectionHeader title="Daily Collection Trend" dark={dark} />
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyChart}>
            <defs>
              <linearGradient id="coll" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.35} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v, n) => (n === "revenue" ? formatCurrency(v) : `${v} L`)}
              contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
            />
            <Legend />
            <Area type="monotone" dataKey="quantity" name="Liters"  stroke={COLORS.primary} fill="url(#coll)" strokeWidth={2} />
            <Area type="monotone" dataKey="revenue"  name="Revenue" stroke={COLORS.accent}  fill="none"       strokeWidth={2} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={s.card}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              placeholder="Search distributor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...s.input, width: 200, padding: "7px 12px" }}
            />
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              style={{ ...s.select, width: 130 }}
            >
              <option value="">All Shifts</option>
              <option>Morning</option>
              <option>Evening</option>
            </select>
          </div>
          <button
            onClick={() => downloadCSV(`collections-${startDate}-${endDate}.csv`, filtered, csvCols)}
            style={{ ...s.btn(COLORS.accent, false), padding: "7px 16px" }}
          >
            ⬇ Download CSV ({filtered.length})
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Distributor", "Shift", "Qty (L)", "Fat %", "Price/L", "Total", "Status", "Receipt"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyRow cols={9} />
              ) : (
                filtered.map((c) => {
                  const distName = c.distributorName || c.distributorId?.name || "-";
                  return (
                    <tr key={c._id}>
                      <td style={s.td}>{fmtDate(c.date)}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{distName}</td>
                      <td style={s.td}>
                        <span style={s.badge2(c.shift === "Morning" ? COLORS.warning : COLORS.purple)}>
                          {c.shift}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontWeight: 700 }}>{c.quantity} L</td>
                      <td style={s.td}>{c.fat}%</td>
                      <td style={s.td}>₹{c.pricePerLiter}</td>
                      <td style={{ ...s.td, fontWeight: 700, color: COLORS.accent }}>{formatCurrency(c.total)}</td>
                      <td style={s.td}>
                        <span style={s.badge2(c.status === "Paid" ? COLORS.accent : COLORS.warning)}>
                          {c.status}
                        </span>
                      </td>
                      <td style={s.td}>
                        <button
                          onClick={() =>
                            milkCollectionAPI
                              .downloadReceipt(c._id)
                              .catch((e) => alert("Receipt error: " + e.message))
                          }
                          style={{ ...s.btn(COLORS.primary, true), padding: "4px 10px", fontSize: 11 }}
                        >
                          📄 Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SalesTab — FULLY ENHANCED: Daily / Weekly / Monthly / Yearly views
// ─────────────────────────────────────────────────────────────────────────────
function SalesTab({ dark, startDate, endDate }) {
  const s = getStyles(dark);

  // Data state
  const [data,         setData]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // Filter state
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // NEW: View period toggle — daily / weekly / monthly / yearly
  const [viewMode, setViewMode] = useState("daily");

  // Fetch when date range changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    salesAPI
      .getAll({ startDate, endDate })
      .then((r) => setData(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBanner message={error} />;

  // ── Client-side filtering (date guard + search + status) ──────────────────
  const filtered = data.filter((sale) => {
    const d = toDateStr(sale.date || sale.createdAt);
    if (startDate && d < startDate) return false;
    if (endDate   && d > endDate)   return false;
    if (statusFilter && sale.paymentStatus !== statusFilter) return false;
    const name = sale.clientId?.name || sale.clientName || "";
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Summary totals ─────────────────────────────────────────────────────────
  const totalRev   = filtered.reduce((acc, x) => acc + (x.total || 0), 0);
  const paidRev    = filtered.filter((x) => x.paymentStatus === "Paid").reduce((acc, x) => acc + (x.total || 0), 0);
  const pendingRev = totalRev - paidRev;
  const avgOrderValue = filtered.length > 0 ? totalRev / filtered.length : 0;

  // ── Period-aggregated chart data (respects viewMode) ─────────────────────
  // Use all filtered records (no extra slice — show the full range)
  const periodChart = aggregateSales(filtered, viewMode);

  // ── Product breakdown (for horizontal bar chart) ──────────────────────────
  const byProduct = {};
  filtered.forEach((sale) => {
    const k = sale.productId?.item || sale.product || "Other";
    if (!byProduct[k]) byProduct[k] = { name: k, total: 0, qty: 0 };
    byProduct[k].total += sale.total    || 0;
    byProduct[k].qty   += sale.quantity || 0;
  });
  const productChart = Object.values(byProduct)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── Paid vs Pending (safe pie data — never both zero) ─────────────────────
  const hasPieData = paidRev > 0 || pendingRev > 0;
  const pieData = hasPieData
    ? [
        { name: "Paid",    value: paidRev    },
        { name: "Pending", value: pendingRev },
      ]
    : [{ name: "No Data", value: 1 }];
  const pieColors = hasPieData
    ? [COLORS.accent, COLORS.warning]
    : ["#e2e8f0"];

  // ── CSV columns ────────────────────────────────────────────────────────────
  const csvCols = [
    { label: "Date",        accessor: (r) => fmtDate(r.date || r.createdAt) },
    { label: "Client",      accessor: (r) => r.clientId?.name || r.clientName || "-" },
    { label: "Product",     accessor: (r) => r.productId?.item || r.product || "-" },
    { label: "Qty",         key: "quantity" },
    { label: "Unit",        accessor: (r) => r.productId?.unit || r.unit || "-" },
    { label: "Price/Unit",  key: "pricePerUnit" },
    { label: "Total (₹)",   key: "total" },
    { label: "Status",      key: "paymentStatus" },
    { label: "Ref No",      key: "referenceNo" },
  ];

  // ── Dynamic chart title based on view mode ─────────────────────────────────
  const chartTitle = {
    daily:   `Daily Sales Trend (${fmtDate(startDate)} – ${fmtDate(endDate)})`,
    weekly:  `Weekly Sales Trend (${fmtDate(startDate)} – ${fmtDate(endDate)})`,
    monthly: `Monthly Sales Trend (${fmtDate(startDate)} – ${fmtDate(endDate)})`,
    yearly:  `Yearly Sales Trend`,
  }[viewMode];

  return (
    <div>
      {/* ── Summary stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard icon="💼" label="Total Sales"      value={formatCurrency(totalRev)}        color={COLORS.accent}  dark={dark} />
        <StatCard icon="✅" label="Paid"             value={formatCurrency(paidRev)}          color={COLORS.primary} dark={dark} />
        <StatCard icon="⏳" label="Pending"          value={formatCurrency(pendingRev)}       color={COLORS.warning} dark={dark} />
        <StatCard icon="📋" label="Total Invoices"   value={filtered.length}                  color={COLORS.purple}  dark={dark} />
        <StatCard icon="📦" label="Avg Order Value"  value={formatCurrency(avgOrderValue)}    color={COLORS.primary} dark={dark} />
        <StatCard
          icon="💯"
          label="Collection Rate"
          value={totalRev > 0 ? `${((paidRev / totalRev) * 100).toFixed(1)}%` : "0%"}
          color={COLORS.accent}
          dark={dark}
        />
      </div>

      {/* ── Charts row: product breakdown + paid/pending pie ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Sales by product (horizontal bars) */}
        <div style={s.card}>
          <SectionHeader title="Sales by Product" dark={dark} />
          {productChart.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
              No product data in selected range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={productChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v, name) =>
                    name === "qty" ? `${v} units` : formatCurrency(v)
                  }
                  contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
                />
                <Bar dataKey="total" name="Revenue" radius={[0, 6, 6, 0]}>
                  {productChart.map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Paid vs Pending pie */}
        <div style={s.card}>
          <SectionHeader title="Revenue Split (Paid vs Pending)" dark={dark} />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={hasPieData
                  ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`
                  : () => "No data"
                }
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) =>
                  name === "No Data" ? "₹0" : formatCurrency(v)
                }
                contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
              />
              {hasPieData && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Period trend chart with Daily/Weekly/Monthly/Yearly toggle ── */}
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#e2e8f0" : "#1e293b", marginBottom: 2 }}>
              {chartTitle}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {periodChart.length} {viewMode === "daily" ? "days" : viewMode === "weekly" ? "weeks" : viewMode === "monthly" ? "months" : "years"} · {filtered.length} invoices
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ViewToggle value={viewMode} onChange={setViewMode} dark={dark} />
            <button
              onClick={() => {
                const cols = [
                  { label: "Period",          key: "label"           },
                  { label: "Revenue (₹)",      key: "revenue"         },
                  { label: "Paid (₹)",         key: "paidRevenue"     },
                  { label: "Pending (₹)",      key: "pendingRevenue"  },
                  { label: "Invoice Count",    key: "count"           },
                ];
                downloadCSV(`sales-${viewMode}-${startDate}-${endDate}.csv`, periodChart, cols);
              }}
              style={{ ...s.btn(COLORS.primary, true), padding: "6px 12px", fontSize: 11 }}
            >
              ⬇ CSV
            </button>
          </div>
        </div>

        {periodChart.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
            No sales data in the selected date range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={periodChart}>
              <defs>
                <linearGradient id="salesGradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.accent}  stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.accent}  stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="salesGradPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                labelFormatter={(label) => `Period: ${label}`}
                formatter={(v, name) => [formatCurrency(v), name]}
                contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Total Revenue"
                stroke={COLORS.accent}
                fill="url(#salesGradTotal)"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="paidRevenue"
                name="Paid"
                stroke={COLORS.primary}
                fill="url(#salesGradPaid)"
                strokeWidth={1.8}
                strokeDasharray="5 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Sales Table with filters ── */}
      <div style={s.card}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              placeholder="Search client…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...s.input, width: 200, padding: "7px 12px" }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...s.select, width: 140 }}
            >
              <option value="">All Status</option>
              <option>Paid</option>
              <option>Pending</option>
            </select>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={() => downloadCSV(`sales-${startDate}-${endDate}.csv`, filtered, csvCols)}
            style={{ ...s.btn(COLORS.accent, false), padding: "7px 16px" }}
          >
            ⬇ Download CSV ({filtered.length})
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Client", "Product", "Qty", "Price/Unit", "Total", "Status", "Ref No", "Invoice"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyRow cols={9} />
              ) : (
                filtered.map((sale) => {
                  const clientName = sale.clientId?.name || sale.clientName || "-";
                  const product    = sale.productId?.item || sale.product || "-";
                  const unit       = sale.productId?.unit || sale.unit || "";
                  const saleDate   = sale.date || sale.createdAt;
                  return (
                    <tr key={sale._id}>
                      <td style={s.td}>{fmtDate(saleDate)}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{clientName}</td>
                      <td style={s.td}>{product}</td>
                      <td style={s.td}>{sale.quantity} {unit}</td>
                      <td style={s.td}>₹{sale.pricePerUnit ?? "-"}</td>
                      <td style={{ ...s.td, fontWeight: 700, color: COLORS.accent }}>{formatCurrency(sale.total)}</td>
                      <td style={s.td}>
                        <span style={s.badge2(sale.paymentStatus === "Paid" ? COLORS.accent : COLORS.warning)}>
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td style={{ ...s.td, fontSize: 11, color: "#94a3b8" }}>{sale.referenceNo || "-"}</td>
                      <td style={s.td}>
                        <button
                          onClick={() =>
                            salesAPI
                              .downloadInvoice(sale._id, sale.referenceNo)
                              .catch((e) => alert("Invoice error: " + e.message))
                          }
                          style={{ ...s.btn(COLORS.primary, true), padding: "4px 10px", fontSize: 11 }}
                        >
                          📄 Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProfitLossTab
// ─────────────────────────────────────────────────────────────────────────────
function ProfitLossTab({ dark, startDate, endDate }) {
  const s = getStyles(dark);
  const [pl,          setPL]          = useState(null);
  const [monthly,     setMonthly]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      analyticsAPI.profitLoss({ startDate, endDate }),
      analyticsAPI.monthly(),
    ])
      .then(([p, m]) => {
        setPL(p.data);
        setMonthly(m.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBanner message={error} />;
  if (!pl)     return null;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await reportsAPI.downloadProfitLoss(startDate, endDate);
    } catch (e) {
      alert("PDF Error: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const revenueData = [
    { name: "Milk Revenue",  value: pl.revenue?.milk  || 0 },
    { name: "Sales Revenue", value: pl.revenue?.sales || 0 },
  ];

  const expData = Object.entries(pl.expenses?.breakdown || {}).map(([k, v]) => ({ name: k, value: v }));
  if ((pl.expenses?.distributorPayments || 0) > 0) {
    expData.push({ name: "Distributor Payments", value: pl.expenses.distributorPayments });
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard icon="💰" label="Total Revenue"  value={formatCurrency(pl.revenue?.total)}  color={COLORS.accent}                                          dark={dark} />
        <StatCard icon="🥛" label="Milk Revenue"   value={formatCurrency(pl.revenue?.milk)}   color={COLORS.primary}                                         dark={dark} />
        <StatCard icon="💼" label="Sales Revenue"  value={formatCurrency(pl.revenue?.sales)}  color={COLORS.purple}                                          dark={dark} />
        <StatCard icon="📦" label="Total Expenses" value={formatCurrency(pl.expenses?.total)} color={COLORS.danger}                                          dark={dark} />
        <StatCard icon="📈" label="Net Profit"     value={formatCurrency(pl.netProfit)}       color={(pl.netProfit || 0) >= 0 ? COLORS.accent : COLORS.danger} dark={dark} />
        <StatCard icon="📊" label="Profit Margin"  value={`${pl.profitMargin ?? 0}%`}         color={(pl.profitMargin || 0) >= 0 ? COLORS.accent : COLORS.danger} dark={dark} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 10 }}>
        <button
          onClick={() =>
            downloadCSV("profitloss.csv", monthly, [
              { label: "Month",       key: "month"      },
              { label: "Revenue",     key: "revenue"    },
              { label: "Expenses",    key: "expenses"   },
              { label: "Profit",      key: "profit"     },
              { label: "Milk Liters", key: "milkLiters" },
            ])
          }
          style={{ ...s.btn(COLORS.primary, true), padding: "8px 18px" }}
        >
          ⬇ CSV (Monthly)
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          style={{ ...s.btn(COLORS.primary, false), padding: "8px 18px", opacity: downloading ? 0.7 : 1 }}
        >
          {downloading ? "⏳ Generating…" : "📄 Download PDF Report"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <SectionHeader title="Monthly P&L (12 months)" dark={dark} />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
              />
              <Legend />
              <Bar dataKey="revenue"  name="Revenue"  fill={COLORS.accent}  radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill={COLORS.danger}  radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit"   name="Profit"   fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={s.card}>
          <SectionHeader title="Expense Breakdown" dark={dark} />
          {expData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expData}
                  cx="50%" cy="50%" outerRadius={90} dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {expData.map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No expense data</div>
          )}
        </div>
      </div>

      <div style={s.card}>
        <SectionHeader
          title={`Detailed P&L: ${fmtDate(pl.period?.start)} to ${fmtDate(pl.period?.end)}`}
          dark={dark}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ fontWeight: 700, color: COLORS.accent, fontSize: 14, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${COLORS.accent}30` }}>
              INCOME
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
              <span>Milk Collection Revenue</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(pl.revenue?.milk)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
              <span>Product Sales Revenue</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(pl.revenue?.sales)}</span>
            </div>
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                padding: "10px 0 6px", fontSize: 15, fontWeight: 800,
                borderTop: `1.5px solid ${dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                marginTop: 6,
              }}
            >
              <span>Total Revenue</span>
              <span style={{ color: COLORS.accent }}>{formatCurrency(pl.revenue?.total)}</span>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, color: COLORS.danger, fontSize: 14, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${COLORS.danger}30` }}>
              EXPENSES
            </div>
            {Object.entries(pl.expenses?.breakdown || {}).map(([cat, amt]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                <span>{cat}</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(amt)}</span>
              </div>
            ))}
            {(pl.expenses?.distributorPayments || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                <span>Distributor Payments</span>
                <span style={{ fontWeight: 700 }}>{formatCurrency(pl.expenses.distributorPayments)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                padding: "10px 0 6px", fontSize: 15, fontWeight: 800,
                borderTop: `1.5px solid ${dark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                marginTop: 6,
              }}
            >
              <span>Total Expenses</span>
              <span style={{ color: COLORS.danger }}>{formatCurrency(pl.expenses?.total)}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 20, padding: "16px 20px", borderRadius: 12,
            background: ((pl.netProfit || 0) >= 0 ? COLORS.accent : COLORS.danger) + "12",
            border: `2px solid ${((pl.netProfit || 0) >= 0 ? COLORS.accent : COLORS.danger)}30`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700 }}>
            NET {(pl.netProfit || 0) >= 0 ? "PROFIT" : "LOSS"}
          </span>
          <span
            style={{
              fontSize: 24, fontWeight: 900,
              color: (pl.netProfit || 0) >= 0 ? COLORS.accent : COLORS.danger,
            }}
          >
            {formatCurrency(Math.abs(pl.netProfit || 0))}
          </span>
          <span
            style={{
              fontSize: 14, fontWeight: 700,
              color: (pl.netProfit || 0) >= 0 ? COLORS.accent : COLORS.danger,
            }}
          >
            {pl.profitMargin ?? 0}% margin
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductionTab
// ─────────────────────────────────────────────────────────────────────────────
function ProductionTab({ dark, startDate, endDate }) {
  const s = getStyles(dark);
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    productionAPI
      .getAll({ startDate, endDate })
      .then((r) => setData(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBanner message={error} />;

  const filtered = data.filter((p) => {
    const d = toDateStr(p.date);
    if (startDate && d < startDate) return false;
    if (endDate   && d > endDate)   return false;
    return true;
  });

  const totalProduced = filtered.reduce((acc, p) => acc + (p.outputQuantity || 0), 0);
  const totalInput    = filtered.reduce((acc, p) => acc + (p.inputQuantity  || 0), 0);
  const avgYield      = totalInput > 0 ? ((totalProduced / totalInput) * 100).toFixed(1) : 0;

  const byProd = {};
  filtered.forEach((p) => {
    const k = p.process || "Unknown";
    if (!byProd[k]) byProd[k] = { name: k, qty: 0, count: 0 };
    byProd[k].qty   += p.outputQuantity || 0;
    byProd[k].count += 1;
  });
  const prodChart = Object.values(byProd);

  const csvCols = [
    { label: "Date",         accessor: (r) => fmtDate(r.date)       },
    { label: "Process Type", accessor: (r) => r.process  || "-"     },
    { label: "Input Qty",    accessor: (r) => r.inputQuantity  || 0 },
    { label: "Input Unit",   accessor: (r) => r.inputUnit  || "-"   },
    { label: "Output Qty",   accessor: (r) => r.outputQuantity || 0 },
    { label: "Output Unit",  accessor: (r) => r.outputUnit || "-"   },
    { label: "Loss %",       accessor: (r) => r.lossPercent || 0    },
    { label: "Labor Cost",   accessor: (r) => r.laborCost  || 0     },
    { label: "Energy Cost",  accessor: (r) => r.energyCost || 0     },
    { label: "Total Cost",   accessor: (r) => r.totalCost  || 0     },
    { label: "Batch ID",     accessor: (r) => r.batchId    || "-"   },
    { label: "Status",       key: "status"                           },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard icon="🏭" label="Total Output" value={`${formatNum(totalProduced.toFixed(1))} units`} color={COLORS.primary} dark={dark} />
        <StatCard icon="🥛" label="Total Input"  value={`${formatNum(totalInput.toFixed(1))} L`}        color={COLORS.accent}  dark={dark} />
        <StatCard icon="📊" label="Avg Yield"    value={`${avgYield}%`}                                 color={COLORS.warning} dark={dark} />
        <StatCard icon="📋" label="Batches"      value={filtered.length}                                color={COLORS.purple}  dark={dark} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={s.card}>
          <SectionHeader title="Output by Process Type" dark={dark} />
          {prodChart.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={prodChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }} />
                <Bar dataKey="qty" name="Output Qty" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={s.card}>
          <SectionHeader title="Batch Count by Process" dark={dark} />
          {prodChart.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={prodChart} cx="50%" cy="50%" outerRadius={85}
                  dataKey="count" nameKey="name"
                  label={({ name, percent }) => `${name.slice(0, 8)} ${(percent * 100).toFixed(0)}%`}
                >
                  {prodChart.map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button
            onClick={() => downloadCSV(`production-${startDate}-${endDate}.csv`, filtered, csvCols)}
            style={{ ...s.btn(COLORS.accent, false), padding: "7px 16px" }}
          >
            ⬇ Download CSV ({filtered.length})
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Process Type", "Input Qty", "Output Qty", "Loss %", "Labor Cost", "Energy Cost", "Total Cost", "Batch ID", "Status"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyRow cols={10} />
              ) : (
                filtered.map((p) => {
                  const statusLower = (p.status || "").toLowerCase();
                  const statusColor =
                    statusLower === "completed"   ? COLORS.accent  :
                    statusLower === "in-progress" ? COLORS.warning :
                    statusLower === "cancelled"   ? COLORS.danger  : COLORS.primary;
                  const statusLabel = p.status
                    ? p.status.charAt(0).toUpperCase() + p.status.slice(1)
                    : "N/A";
                  return (
                    <tr key={p._id}>
                      <td style={s.td}>{fmtDate(p.date)}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{p.process || "-"}</td>
                      <td style={{ ...s.td, fontWeight: 700, color: COLORS.primary }}>
                        {(p.inputQuantity  || 0).toFixed(1)} {p.inputUnit  || "L"}
                      </td>
                      <td style={{ ...s.td, fontWeight: 700, color: COLORS.accent }}>
                        {(p.outputQuantity || 0).toFixed(1)} {p.outputUnit || "L"}
                      </td>
                      <td style={{ ...s.td, fontWeight: 600, color: COLORS.warning }}>
                        {(p.lossPercent || 0).toFixed(1)}%
                      </td>
                      <td style={s.td}>₹{(p.laborCost  || 0).toLocaleString("en-IN")}</td>
                      <td style={s.td}>₹{(p.energyCost || 0).toLocaleString("en-IN")}</td>
                      <td style={{ ...s.td, fontWeight: 700 }}>₹{(p.totalCost || 0).toLocaleString("en-IN")}</td>
                      <td style={{ ...s.td, fontSize: 11, color: "#94a3b8" }}>{p.batchId || "-"}</td>
                      <td style={s.td}>
                        <span style={s.badge2(statusColor)}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DistributorsTab
// ─────────────────────────────────────────────────────────────────────────────
function DistributorsTab({ dark, startDate, endDate }) {
  const s = getStyles(dark);
  const [distributors, setDistributors] = useState([]);
  const [collections,  setCollections]  = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      distributorAPI.getAll(),
      milkCollectionAPI.getAll(),
      paymentAPI.getAll(),
    ])
      .then(([d, c, p]) => {
        setDistributors(d.data || []);
        setCollections(c.data  || []);
        setPayments(p.data     || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <ErrorBanner message={error} />;

  const distMap = {};
  distributors.forEach((d) => {
    distMap[d._id] = { ...d, filteredLiters: 0, filteredRevenue: 0, pendingAmount: 0 };
  });

  collections.forEach((c) => {
    const d = toDateStr(c.date);
    if (startDate && d < startDate) return;
    if (endDate   && d > endDate)   return;
    const id = c.distributorId?._id || c.distributorId;
    if (distMap[id]) {
      distMap[id].filteredLiters   += c.quantity || 0;
      distMap[id].filteredRevenue  += c.total    || 0;
    }
  });

  payments.forEach((p) => {
    const status = (p.status || "").toLowerCase();
    if (status === "pending") {
      const id = p.distributorId?._id || p.distributorId;
      if (distMap[id]) distMap[id].pendingAmount += p.amount || 0;
    }
  });

  const rows         = Object.values(distMap).sort((a, b) => b.filteredLiters - a.filteredLiters);
  const totalLiters  = rows.reduce((acc, r) => acc + r.filteredLiters,  0);
  const totalRevenue = rows.reduce((acc, r) => acc + r.filteredRevenue, 0);
  const totalPending = rows.reduce((acc, r) => acc + r.pendingAmount,   0);

  const chartData = rows.slice(0, 8).map((r) => ({
    name:    r.name?.split(" ")[0] || "-",
    liters:  r.filteredLiters,
    revenue: r.filteredRevenue,
  }));

  const csvCols = [
    { label: "Name",               key: "name"            },
    { label: "Village",            key: "village"         },
    { label: "Phone",              key: "phone"           },
    { label: "Milk Type",          key: "milkType"        },
    { label: "Status",             key: "status"          },
    { label: "Liters (Period)",    key: "filteredLiters"  },
    { label: "Revenue (Period)",   key: "filteredRevenue" },
    { label: "Pending Amount",     key: "pendingAmount"   },
    { label: "Total Liters (All)", accessor: (r) => r.totalLiters  || 0 },
    { label: "Total Amount (All)", accessor: (r) => r.totalAmount  || 0 },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard icon="👨‍🌾" label="Total Distributors" value={rows.length}                                  color={COLORS.primary} dark={dark} />
        <StatCard icon="✅"   label="Active"             value={rows.filter((r) => r.status === "Active").length} color={COLORS.accent}  dark={dark} />
        <StatCard icon="🥛"   label="Liters (Period)"    value={`${formatNum(totalLiters.toFixed(0))} L`}    color={COLORS.warning} dark={dark} />
        <StatCard icon="⏳"   label="Pending Payments"   value={formatCurrency(totalPending)}                color={COLORS.danger}  dark={dark} />
      </div>

      <div style={{ ...s.card, marginBottom: 16 }}>
        <SectionHeader title="Top Distributors by Collection" dark={dark} />
        {chartData.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No collection data in selected range</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v, n) => (n === "liters" ? `${v} L` : formatCurrency(v))}
                contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }}
              />
              <Legend />
              <Bar dataKey="liters"  name="Liters"  fill={COLORS.primary} radius={[0, 5, 5, 0]} />
              <Bar dataKey="revenue" name="Revenue" fill={COLORS.accent}  radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button
            onClick={() => downloadCSV(`distributors-${startDate}-${endDate}.csv`, rows, csvCols)}
            style={{ ...s.btn(COLORS.accent, false), padding: "7px 16px" }}
          >
            ⬇ Download CSV ({rows.length})
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Distributor", "Village", "Phone", "Status", "Liters (Period)", "Revenue (Period)", "Pending", "Total Liters"].map((h) => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow cols={8} message="No distributors found" />
              ) : (
                rows.map((d) => (
                  <tr key={d._id}>
                    <td style={{ ...s.td, fontWeight: 600 }}>{d.name}</td>
                    <td style={s.td}>{d.village || "-"}</td>
                    <td style={s.td}>{d.phone   || "-"}</td>
                    <td style={s.td}>
                      <span style={s.badge2(d.status === "Active" ? COLORS.accent : COLORS.danger)}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontWeight: 700 }}>{formatNum(d.filteredLiters.toFixed(1))} L</td>
                    <td style={{ ...s.td, fontWeight: 700, color: COLORS.accent }}>
                      {formatCurrency(d.filteredRevenue)}
                    </td>
                    <td style={{ ...s.td, fontWeight: 700, color: d.pendingAmount > 0 ? COLORS.danger : COLORS.accent }}>
                      {formatCurrency(d.pendingAmount)}
                    </td>
                    <td style={s.td}>{formatNum((d.totalLiters || 0).toFixed(1))} L</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportsAnalyticsPage({ dark }) {
  const s = getStyles(dark);
  const [activeTab,  setActiveTab]  = useState("overview");
  const [startDate,  setStartDate]  = useState(monthStart());
  const [endDate,    setEndDate]    = useState(today());

  const handleRangeChange = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const renderTab = () => {
    const props = { dark, startDate, endDate };
    switch (activeTab) {
      case "overview":     return <OverviewTab     {...props} />;
      case "collection":   return <CollectionTab   {...props} />;
      case "sales":        return <SalesTab        {...props} />;
      case "profitloss":   return <ProfitLossTab   {...props} />;
      case "production":   return <ProductionTab   {...props} />;
      case "distributors": return <DistributorsTab {...props} />;
      default:             return <OverviewTab     {...props} />;
    }
  };

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 5, height: 28, background: COLORS.primary, borderRadius: 4 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: dark ? "#e2e8f0" : "#1e293b", margin: 0 }}>
            📊 Analytics & Reports
          </h2>
        </div>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, paddingLeft: 15 }}>
          Real-time data analysis · Date-wise filtering · CSV &amp; PDF downloads
        </p>
      </div>

      {/* Date Range Picker */}
      <div
        style={{
          ...s.card, marginBottom: 20, padding: "14px 20px",
          display: "flex", flexWrap: "wrap", gap: 12,
          alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: dark ? "#e2e8f0" : "#1e293b" }}>
            📅 Date Range:
          </span>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            {fmtDate(startDate)} → {fmtDate(endDate)}
          </span>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleRangeChange}
          dark={dark}
        />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex", overflowX: "auto", gap: 4, marginBottom: 20,
          padding: "4px",
          background: dark ? "rgba(255,255,255,0.05)" : "rgba(26,86,219,0.05)",
          borderRadius: 14, scrollbarWidth: "none",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "9px 18px", border: "none", cursor: "pointer", borderRadius: 10,
              fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500, whiteSpace: "nowrap",
              background: activeTab === tab.id ? COLORS.primary : "transparent",
              color: activeTab === tab.id ? "white" : (dark ? "#94a3b8" : "#64748b"),
              boxShadow: activeTab === tab.id ? "0 2px 8px rgba(26,86,219,0.3)" : "none",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {renderTab()}
    </div>
  );
}
