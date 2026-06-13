/**
 * PaymentsPage — Full real-data payment management
 * Handles: Distributor payments + Client/Sales payments (dual-tab)
 * Backend: /api/payments  +  /api/sales (mark-paid)
 */
import { useState, useEffect, useCallback } from "react";
import { COLORS } from "../constants/index.js";
import { formatCurrency } from "../utils/formatters.js";
import { getStyles } from "../styles/getStyles.js";
import { paymentAPI, salesAPI, distributorAPI, clientAPI } from "../utils/api.js";
import StatCard from "../components/ui/StatCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import SearchBar from "../components/ui/SearchBar.jsx";

/* ── animation CSS ─────────────────────────────────────────────── */
const GLOBAL_CSS = `
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideInRight{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

/* ── Skeleton ──────────────────────────────────────────────────── */
function Skeleton({ width = "100%", height = 14, radius = 8, dark, style }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: dark
        ? "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%)"
        : "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s ease-in-out infinite",
      ...style,
    }} />
  );
}
function TableSkeleton({ dark, rows = 6 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "12px 0" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Skeleton width="18%" height={13} dark={dark} />
          <Skeleton width="13%" height={13} dark={dark} />
          <Skeleton width="13%" height={13} dark={dark} />
          <Skeleton width="10%" height={13} dark={dark} />
          <Skeleton width="12%" height={13} dark={dark} />
          <Skeleton width="10%" height={20} radius={10} dark={dark} />
          <Skeleton width="12%" height={26} radius={8} dark={dark} />
        </div>
      ))}
    </div>
  );
}

/* ── Toast ─────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  const cfg = {
    success: { bg: "#ecfdf5", border: COLORS.accent, text: "#065f46", icon: "✓" },
    error:   { bg: "#fef2f2", border: COLORS.danger, text: "#991b1b", icon: "✕" },
    info:    { bg: "#eff6ff", border: COLORS.primary, text: "#1e40af", icon: "ℹ" },
  }[type] || { bg: "#eff6ff", border: COLORS.primary, text: "#1e40af", icon: "ℹ" };
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, display: "flex",
      alignItems: "center", gap: 10, padding: "14px 20px", background: cfg.bg,
      borderLeft: `4px solid ${cfg.border}`, borderRadius: 14,
      boxShadow: "0 12px 44px rgba(0,0,0,0.16)", animation: "slideInRight 0.35s cubic-bezier(.21,1.02,.73,1)",
      maxWidth: 400 }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: cfg.border,
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{cfg.icon}</span>
      <span style={{ color: cfg.text, fontSize: 14, fontWeight: 500 }}>{message}</span>
      <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none",
        cursor: "pointer", color: cfg.text, fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
}

/* ── Confirm Modal ─────────────────────────────────────────────── */
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 8000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 420, width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)", animation: "fadeInUp 0.25s ease" }}>
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>💳</div>
        <h3 style={{ fontWeight: 700, fontSize: 18, textAlign: "center", color: "#1e293b", marginBottom: 8 }}>{title}</h3>
        <p style={{ color: "#64748b", textAlign: "center", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} disabled={loading}
            style={{ flex: 1, padding: "12px 0", border: "2px solid #e2e8f0", borderRadius: 12,
              background: "#fff", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, padding: "12px 0", border: "none", borderRadius: 12,
              background: loading ? "#9ca3af" : COLORS.accent, color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Processing…" : "✓ Confirm Paid"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Payment Modal ─────────────────────────────────────────── */
function AddPaymentModal({ open, onClose, onSave, distributors, dark }) {
  const [form, setForm] = useState({ distributorId: "", amount: "", date: new Date().toISOString().split("T")[0], method: "UPI", reference: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setError("");
    if (!form.distributorId || !form.amount || !form.date || !form.method)
      return setError("Distributor, amount, date & method are required.");
    if (isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return setError("Amount must be a positive number.");
    setSaving(true);
    try {
      await onSave({ ...form, amount: Number(form.amount) });
      setForm({ distributorId: "", amount: "", date: new Date().toISOString().split("T")[0], method: "UPI", reference: "", notes: "" });
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  const bg = dark ? "#1e293b" : "#fff";
  const border = dark ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #e2e8f0";
  const labelStyle = { fontSize: 12, fontWeight: 600, color: dark ? "#94a3b8" : "#64748b", marginBottom: 4, display: "block" };
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border,
    background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc", color: dark ? "#e2e8f0" : "#1e293b",
    fontSize: 14, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 8000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: bg, borderRadius: 20, padding: 28, maxWidth: 480, width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)", animation: "fadeInUp 0.25s ease", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 18, color: dark ? "#f1f5f9" : "#1e293b", margin: 0 }}>💳 Add Distributor Payment</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: dark ? "#94a3b8" : "#64748b" }}>×</button>
        </div>
        {error && <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, color: "#991b1b", fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Distributor *</label>
            <select value={form.distributorId} onChange={set("distributorId")} style={inputStyle}>
              <option value="">-- Select Distributor --</option>
              {distributors.map(d => <option key={d._id} value={d._id}>{d.name} ({d.village || d.phone})</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Amount (₹) *</label>
            <input type="number" value={form.amount} onChange={set("amount")} placeholder="0.00" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date *</label>
            <input type="date" value={form.date} onChange={set("date")} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Method *</label>
            <select value={form.method} onChange={set("method")} style={inputStyle}>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Reference / UTR</label>
            <input value={form.reference} onChange={set("reference")} placeholder="Optional" style={inputStyle} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Notes</label>
            <input value={form.notes} onChange={set("notes")} placeholder="Optional notes" style={inputStyle} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button onClick={onClose} disabled={saving}
            style={{ flex: 1, padding: "12px 0", border: "2px solid #e2e8f0", borderRadius: 12,
              background: "none", color: dark ? "#94a3b8" : "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: "12px 0", border: "none", borderRadius: 12,
              background: saving ? "#9ca3af" : COLORS.primary, color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving…" : "Add Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Method Badge ──────────────────────────────────────────────── */
function MethodBadge({ method }) {
  const cfg = {
    UPI:           { bg: "#eff6ff", color: "#1d4ed8", icon: "📱" },
    Cash:          { bg: "#f0fdf4", color: "#15803d", icon: "💵" },
    "Bank Transfer":{ bg: "#faf5ff", color: "#7e22ce", icon: "🏦" },
  }[method] || { bg: "#f1f5f9", color: "#475569", icon: "💳" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
      borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600 }}>
      {cfg.icon} {method}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function PaymentsPage({ dark }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [tab, setTab] = useState("distributor"); // "distributor" | "client"

  // Distributor payments state
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null, name: "", amount: 0 });
  const [markingPaid, setMarkingPaid] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [distributors, setDistributors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Client/Sales payments state
  const [clientSales, setClientSales] = useState([]);
  const [clientLoading, setClientLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("All");
  const [markingSalePaid, setMarkingSalePaid] = useState(null);

  const PER_PAGE = 10;

  useEffect(() => {
    const h = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const s = getStyles(dark, isMobile, isTablet);

  const showToast = (message, type = "info") => setToast({ message, type });

  /* ── Load Distributor Payments ── */
  const loadPayments = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [payRes, distRes] = await Promise.all([
        paymentAPI.getAll(),
        distributorAPI.getAll({ status: "Active" }),
      ]);
      setPayments(payRes.data || []);
      setDistributors(distRes.data || []);
    } catch (e) { setError(e.message || "Failed to load payments"); }
    finally { setLoading(false); }
  }, []);

  /* ── Load Client/Sales Payments ── */
  const loadClientSales = useCallback(async () => {
    setClientLoading(true);
    try {
      const res = await salesAPI.getAll({ limit: 200 });
      setClientSales(res.data || []);
    } catch (e) { console.error("Client sales load error:", e); }
    finally { setClientLoading(false); }
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);
  useEffect(() => { loadClientSales(); }, [loadClientSales]);

  /* ── Mark Distributor Payment Paid ── */
  const confirmMarkPaid = async () => {
    setMarkingPaid(true);
    try {
      await paymentAPI.markPaid(confirmModal.id);
      showToast(`Payment of ${formatCurrency(confirmModal.amount)} marked as Paid!`, "success");
      setConfirmModal({ open: false });
      loadPayments();
    } catch (e) { showToast(e.message || "Failed to mark as paid", "error"); }
    finally { setMarkingPaid(false); }
  };

  /* ── Add Distributor Payment ── */
  const handleAddPayment = async (data) => {
    await paymentAPI.create(data);
    showToast("Payment recorded successfully!", "success");
    setAddModal(false);
    loadPayments();
  };

  /* ── Mark Sale/Client Payment Paid ── */
  const handleMarkSalePaid = async (saleId, amount, clientName) => {
    setMarkingSalePaid(saleId);
    try {
      await salesAPI.markPaid(saleId, { paymentMethod: "Cash" });
      showToast(`${clientName} — ₹${amount} marked as Paid!`, "success");
      loadClientSales();
    } catch (e) { showToast(e.message || "Failed to update sale", "error"); }
    finally { setMarkingSalePaid(null); }
  };

  /* ── Filter & Paginate (Distributor) ── */
  const filteredPayments = payments.filter(p => {
    const matchStatus = filter === "All" || p.status === filter;
    const matchSearch = !search ||
      p.distributorName?.toLowerCase().includes(search.toLowerCase()) ||
      p.reference?.toLowerCase().includes(search.toLowerCase()) ||
      p.method?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });
  const totalPages = Math.ceil(filteredPayments.length / PER_PAGE);
  const paginated = filteredPayments.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  /* ── Filter (Client Sales) ── */
  const filteredSales = clientSales.filter(s => {
    const matchStatus = clientFilter === "All" || s.paymentStatus === clientFilter;
    const matchSearch = !clientSearch ||
      s.clientName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      s.invoiceNumber?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      s.product?.toLowerCase().includes(clientSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  /* ── Stats ── */
  const totalPaid = payments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "Pending").reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter(p => p.status === "Pending").length;

  const clientPaid = clientSales.filter(s => s.paymentStatus === "Paid").reduce((a, s) => a + s.total, 0);
  const clientPending = clientSales.filter(s => s.paymentStatus === "Pending").reduce((a, s) => a + s.total, 0);
  const clientPendingCount = clientSales.filter(s => s.paymentStatus === "Pending").length;

  const cardBg = dark ? "rgba(255,255,255,0.04)" : "#fff";
  const borderColor = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const textPrimary = dark ? "#f1f5f9" : "#1e293b";
  const textSec = dark ? "#94a3b8" : "#64748b";

  const tabStyle = (active) => ({
    padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: 14, transition: "all 0.2s",
    background: active ? COLORS.primary : (dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"),
    color: active ? "#fff" : textSec,
  });

  const thStyle = { padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
    color: textSec, textTransform: "uppercase", letterSpacing: "0.06em",
    background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderBottom: `1px solid ${borderColor}` };
  const tdStyle = { padding: "13px 14px", fontSize: 13, color: textPrimary, borderBottom: `1px solid ${borderColor}` };

  return (
    <div>
      <style>{GLOBAL_CSS}</style>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <ConfirmModal
        open={confirmModal.open}
        title="Mark Payment as Paid?"
        message={`Confirm payment of ${formatCurrency(confirmModal.amount)} to ${confirmModal.name}?`}
        onConfirm={confirmMarkPaid}
        onCancel={() => setConfirmModal({ open: false })}
        loading={markingPaid}
      />
      <AddPaymentModal
        open={addModal}
        onClose={() => setAddModal(false)}
        onSave={handleAddPayment}
        distributors={distributors}
        dark={dark}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: isMobile ? 20 : 24, color: textPrimary, margin: 0 }}>💳 Payments</h2>
          <p style={{ color: textSec, fontSize: 13, margin: "4px 0 0" }}>Manage distributor & client payment records</p>
        </div>
        {tab === "distributor" && (
          <button onClick={() => setAddModal(true)}
            style={{ padding: "11px 22px", background: COLORS.primary, color: "#fff", border: "none",
              borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(26,86,219,0.3)" }}>
            + Add Payment
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button style={tabStyle(tab === "distributor")} onClick={() => setTab("distributor")}>👨‍🌾 Distributor Payments</button>
        <button style={tabStyle(tab === "client")} onClick={() => setTab("client")}>🏪 Client / Sales Payments</button>
      </div>

      {/* ══════════ DISTRIBUTOR TAB ══════════ */}
      {tab === "distributor" && (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
            <StatCard icon="💰" label="Total Paid" value={formatCurrency(totalPaid)} color={COLORS.accent} dark={dark} />
            <StatCard icon="⏳" label="Total Pending" value={formatCurrency(totalPending)} color={COLORS.warning} dark={dark} />
            <StatCard icon="✅" label="Paid Records" value={payments.filter(p=>p.status==="Paid").length} color={COLORS.primary} dark={dark} />
            <StatCard icon="🔴" label="Pending Records" value={pendingCount} color={COLORS.danger} dark={dark} />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search distributor, reference…" dark={dark} />
            {["All","Pending","Paid"].map(f => (
              <button key={f} onClick={() => { setFilter(f); setCurrentPage(1); }}
                style={{ padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                  background: filter === f ? COLORS.primary : (dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"),
                  color: filter === f ? "#fff" : textSec }}>
                {f}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: "hidden" }}>
            {loading ? <TableSkeleton dark={dark} /> : error ? (
              <div style={{ padding: 40, textAlign: "center", color: COLORS.danger }}>❌ {error}</div>
            ) : filteredPayments.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                <p style={{ color: textSec }}>No payments found.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Distributor","Amount","Date","Method","Reference","Status","Action"].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(p => (
                      <tr key={p._id} style={{ transition: "background 0.15s" }}>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${COLORS.primary}20`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: COLORS.primary, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                              {(p.distributorName || "?")[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: textPrimary }}>{p.distributorName || "Unknown"}</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: COLORS.accent }}>{formatCurrency(p.amount)}</td>
                        <td style={{ ...tdStyle, color: textSec }}>{p.date}</td>
                        <td style={tdStyle}><MethodBadge method={p.method} /></td>
                        <td style={{ ...tdStyle, color: textSec, fontFamily: "monospace", fontSize: 12 }}>{p.reference || "—"}</td>
                        <td style={tdStyle}><StatusBadge status={p.status} /></td>
                        <td style={tdStyle}>
                          {p.status === "Pending" ? (
                            <button
                              onClick={() => setConfirmModal({ open: true, id: p._id, name: p.distributorName, amount: p.amount })}
                              style={{ padding: "6px 14px", background: `${COLORS.accent}15`, color: COLORS.accent,
                                border: `1px solid ${COLORS.accent}30`, borderRadius: 8, fontSize: 12,
                                fontWeight: 700, cursor: "pointer" }}>
                              Mark Paid
                            </button>
                          ) : (
                            <span style={{ color: COLORS.accent, fontSize: 12, fontWeight: 600 }}>✓ Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 16, borderTop: `1px solid ${borderColor}` }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${borderColor}`,
                    background: "none", color: textSec, cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}>
                  ← Prev
                </button>
                <span style={{ padding: "6px 14px", color: textSec, fontSize: 13 }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${borderColor}`,
                    background: "none", color: textSec, cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1 }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════ CLIENT / SALES TAB ══════════ */}
      {tab === "client" && (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
            <StatCard icon="💰" label="Total Received" value={formatCurrency(clientPaid)} color={COLORS.accent} dark={dark} />
            <StatCard icon="⏳" label="Outstanding" value={formatCurrency(clientPending)} color={COLORS.warning} dark={dark} />
            <StatCard icon="📄" label="Paid Invoices" value={clientSales.filter(s=>s.paymentStatus==="Paid").length} color={COLORS.primary} dark={dark} />
            <StatCard icon="🔴" label="Pending Invoices" value={clientPendingCount} color={COLORS.danger} dark={dark} />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <SearchBar value={clientSearch} onChange={setClientSearch} placeholder="Search client, invoice, product…" dark={dark} />
            {["All","Pending","Paid"].map(f => (
              <button key={f} onClick={() => setClientFilter(f)}
                style={{ padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: 13,
                  background: clientFilter === f ? COLORS.primary : (dark ? "rgba(255,255,255,0.06)" : "#f1f5f9"),
                  color: clientFilter === f ? "#fff" : textSec }}>
                {f}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}`, overflow: "hidden" }}>
            {clientLoading ? <TableSkeleton dark={dark} /> : filteredSales.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
                <p style={{ color: textSec }}>No client sales found.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Client","Invoice","Product","Qty","Total","Date","Status","Action"].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map(sale => (
                      <tr key={sale._id}>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${COLORS.purple}20`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: COLORS.purple, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                              {(sale.clientName || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: textPrimary, fontSize: 13 }}>{sale.clientName || "Unknown"}</div>
                              <div style={{ fontSize: 11, color: textSec }}>{sale.clientType || ""}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12, color: textSec }}>{sale.invoiceNumber || sale._id?.slice(-6)}</td>
                        <td style={{ ...tdStyle, color: textPrimary }}>{sale.product || "Milk"}</td>
                        <td style={{ ...tdStyle, color: textSec }}>{sale.quantity} {sale.unit || "L"}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: COLORS.accent }}>{formatCurrency(sale.total)}</td>
                        <td style={{ ...tdStyle, color: textSec }}>{sale.date ? new Date(sale.date).toLocaleDateString("en-IN") : "—"}</td>
                        <td style={tdStyle}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: sale.paymentStatus === "Paid" ? "#ecfdf5" : "#fff7ed",
                            color: sale.paymentStatus === "Paid" ? "#15803d" : "#c2410c" }}>
                            {sale.paymentStatus || "Pending"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {sale.paymentStatus !== "Paid" ? (
                            <button
                              disabled={markingSalePaid === sale._id}
                              onClick={() => handleMarkSalePaid(sale._id, sale.total, sale.clientName)}
                              style={{ padding: "6px 14px", background: `${COLORS.accent}15`, color: COLORS.accent,
                                border: `1px solid ${COLORS.accent}30`, borderRadius: 8, fontSize: 12,
                                fontWeight: 700, cursor: markingSalePaid === sale._id ? "not-allowed" : "pointer",
                                opacity: markingSalePaid === sale._id ? 0.6 : 1 }}>
                              {markingSalePaid === sale._id ? "…" : "Mark Paid"}
                            </button>
                          ) : (
                            <span style={{ color: COLORS.accent, fontSize: 12, fontWeight: 600 }}>✓ Paid</span>
                          )}
                        </td>
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
