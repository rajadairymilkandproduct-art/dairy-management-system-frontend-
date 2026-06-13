import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { COLORS } from "../constants/index.js";
import { formatCurrency } from "../utils/formatters.js";
import { getStyles } from "../styles/getStyles.js";
import { analyticsAPI } from "../utils/api.js";
import StatCard from "../components/ui/StatCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";

export default function ProfitLossPage({ dark }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [data, setData] = useState({
    revenue: 0,
    purchase: 0,
    expenses: 0,
    monthlyData: [],
    expenseBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Fetch P&L data from API
  useEffect(() => {
    const loadProfitLossData = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await analyticsAPI.profitLoss();
        if (result.success) {
          setData(result.data || {
            revenue: 0,
            purchase: 0,
            expenses: 0,
            monthlyData: [],
            expenseBreakdown: []
          });
        } else {
          setError(result.message || "Failed to load profit/loss data");
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load profit/loss data");
      } finally {
        setLoading(false);
      }
    };
    
    loadProfitLossData();
  }, []);
  
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const s = getStyles(dark, isMobile, isTablet);
  
  const revenue = data.revenue || 0;
  const purchase = data.purchase || 0;
  const expenses = data.expenses || 0;
  const profit = revenue - purchase - expenses;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
  const monthlyData = data.monthlyData && Array.isArray(data.monthlyData) ? data.monthlyData : [];
  const expenseBreakdown = data.expenseBreakdown && Array.isArray(data.expenseBreakdown) ? data.expenseBreakdown : [];

  if (loading) return <div style={s.card}><p style={{ textAlign: "center", color: "#94a3b8" }}>Loading P&L data...</p></div>;

  return (
    <div>
      {error && <div style={{ ...s.card, background: "#fef2f2", borderLeft: `4px solid ${COLORS.danger}`, marginBottom: 16 }}>
        <p style={{ color: COLORS.danger }}>{error}</p>
      </div>}
      
      <div style={s.grid(4)}>
        <StatCard icon="💰" label="Total Revenue" value={formatCurrency(revenue)} delta={revenue > 0 ? "↑ Current" : ""} positive={true} color={COLORS.accent} dark={dark} />
        <StatCard icon="🛒" label="Milk Purchase Cost" value={formatCurrency(purchase)} color={COLORS.danger} dark={dark} />
        <StatCard icon="📦" label="Total Expenses" value={formatCurrency(expenses)} color={COLORS.warning} dark={dark} />
        <StatCard icon="📈" label="Net Profit" value={formatCurrency(profit)} delta={`${margin}% margin`} positive={profit > 0} color={COLORS.primary} dark={dark} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "2fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={s.card}>
          <SectionHeader title="Monthly P&L Comparison" dark={dark} />
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={isMobile ? 200 : isTablet ? 240 : 280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e3a5f" : "#f1f5f9"} />
                <XAxis dataKey="month" tick={{ fontSize: isMobile ? 9 : 11, fill: dark ? "#94a3b8" : "#64748b" }} />
                <YAxis tick={{ fontSize: isMobile ? 9 : 11, fill: dark ? "#94a3b8" : "#64748b" }} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: dark ? "#1e293b" : "white", border: "none", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 12 }} />
                <Bar dataKey="revenue" name="Revenue" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>No monthly data available</p>
          )}
        </div>

        <div style={s.card}>
          <SectionHeader title="Expense Categories" dark={dark} />
          {expenseBreakdown.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {expenseBreakdown.map((e, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: isMobile ? 12 : 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, wordBreak: "break-word" }}>{e.category || "Other"}</span>
                    <span style={{ fontWeight: 700, color: COLORS.danger, whiteSpace: "nowrap", marginLeft: 8 }}>{formatCurrency(e.amount || 0)}</span>
                  </div>
                  <div style={{ height: 6, background: dark ? "rgba(255,255,255,0.06)" : "#e2e8f0", borderRadius: 4 }}>
                    <div style={s.progressBar(expenses > 0 ? ((e.amount || 0) / expenses) * 100 : 0, COLORS.primary)} />
                  </div>
                  {e.note && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{e.note}</div>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>No expense data available</p>
          )}
          <div style={{ marginTop: 20, padding: "14px 16px", background: COLORS.primary + "10", borderRadius: 12, border: `1.5px solid ${COLORS.primary}20` }}>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>TOTAL EXPENSES</div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: COLORS.primary }}>{formatCurrency(expenses)}</div>
          </div>
        </div>
      </div>

      <div style={s.grid(3)}>
        <div style={s.card}>
          <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, marginBottom: 4 }}>Summary</div>
          <div style={{ fontSize: isMobile ? 11 : 12, color: "#94a3b8", marginBottom: 12 }}>Period Overview</div>
          <div style={{ fontSize: isMobile ? 12 : 14, color: COLORS.accent, fontWeight: 600, marginBottom: 4 }}>Revenue: {formatCurrency(revenue)}</div>
          <div style={{ fontSize: isMobile ? 12 : 14, color: COLORS.primary, fontWeight: 600, marginBottom: 12 }}>Profit: {formatCurrency(profit)}</div>
          <div style={{ fontSize: isMobile ? 12 : 14, color: COLORS.warning, fontWeight: 600, marginBottom: 12 }}>Expenses: {formatCurrency(expenses)}</div>
        </div>
      </div>
    </div>
  );
}
