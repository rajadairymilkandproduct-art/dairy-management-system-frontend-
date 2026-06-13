import { useState, useEffect } from "react";
import { COLORS } from "../constants/index.js";
import { PRODUCTION_LOG } from "../data/mockData.js";
import { formatCurrency } from "../utils/formatters.js";
import { getStyles } from "../styles/getStyles.js";
import StatCard from "../components/ui/StatCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import Modal from "../components/ui/Modal.jsx";

// ─── MongoDB API helpers ───────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/production`
  : "http://localhost:5000/api/production";

// ───────────────── TOKEN HELPER ─────────────────
function getToken() {
  const possibleKeys = [
    "token",
    "authToken",
    "accessToken",
    "jwt",
    "userToken",
    "access_token",
    "auth_token",
  ];

  for (const key of possibleKeys) {
    let val = localStorage.getItem(key);
    if (val) {
      val = val.replace(/^["']|["']$/g, "");
      val = val.replace(/^Bearer\s+/i, "");
      if (val) return val;
    }
  }

  const objectKeys = [
    "user",
    "auth",
    "currentUser",
    "userData",
    "loginData",
    "userProfile",
  ];
  for (const key of objectKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const tokenFields = [
          "token",
          "authToken",
          "accessToken",
          "jwt",
          "access_token",
          "auth_token",
        ];
        for (const field of tokenFields) {
          let val = parsed[field];
          if (val) {
            val = val.replace(/^["']|["']$/g, "");
            val = val.replace(/^Bearer\s+/i, "");
            if (val) return val;
          }
        }
      }
    } catch {
      // not JSON, skip
    }
  }

  return null;
}

function getAuthHeaders() {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log(
      "🔑 Sending Authorization:",
      `Bearer ${token.substring(0, 25)}...`
    );

    const parts = token.split(".");
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp) {
          const expired = payload.exp < now;
          console.log(
            "📅 Token expires:",
            new Date(payload.exp * 1000).toLocaleString(),
            expired ? "❌ EXPIRED" : "✅ valid"
          );
        }
      } catch {
        // can't decode
      }
    }
  } else {
    console.warn("⚠️ No token found in localStorage");
    console.log("📦 Available keys:", Object.keys(localStorage).join(", "));
  }

  return headers;
}

// ───────────────── LOGOUT HELPER ─────────────────
function clearAuthAndRedirect() {
  const keysToRemove = [
    "token", "authToken", "accessToken", "jwt", "userToken",
    "user", "auth", "currentUser", "userData", "loginData",
    "access_token", "auth_token", "userProfile",
  ];
  keysToRemove.forEach(key => localStorage.removeItem(key));
  window.location.href = "/login";
}

// ─── Normalize a single production record from MongoDB ────────────────────────
// Backend stores: inputQuantity, outputQuantity (snake_case from model)
// Frontend uses:  inputQty, outputQty (camelCase, shorter)
function normalizeProduction(item) {
  return {
    ...item,
    id: item._id || item.id,
    _id: item._id || item.id,
    // ── Field-name normalization ──────────────────────────────────────────────
    inputQty:    Number(item.inputQty    ?? item.inputQuantity  ?? 0),
    outputQty:   Number(item.outputQty   ?? item.outputQuantity ?? 0),
    inputPrice:  Number(item.inputPrice  ?? 0),
    outputPrice: Number(item.outputPrice ?? 0),
    laborCost:   Number(item.laborCost   ?? 0),
    energyCost:  Number(item.energyCost  ?? 0),
    lossPercent: Number(item.lossPercent ?? 0),
    // ── Date normalization: ISO string → "YYYY-MM-DD" ─────────────────────────
    date: item.date
      ? String(item.date).split("T")[0]
      : new Date().toISOString().split("T")[0],
  };
}

// ───────────────── FETCH PRODUCTIONS ─────────────────
async function fetchProductions() {
  try {
    const res = await fetch(API_BASE, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401) {
        const result = await res.json().catch(() => ({}));
        console.warn("🔒 Auth error:", result.message || "Unauthorized");
        // DO NOT redirect here — return null so the page shows a banner
        return null;
      }
      throw new Error(`Fetch failed: ${res.status}`);
    }

    const result = await res.json();
    console.log("Productions Response:", result);
    return result.data || [];
  } catch (err) {
    console.error("fetchProductions:", err);
    return null;
  }
}

// ───────────────── SAVE PRODUCTION ─────────────────
async function saveProduction(data) {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await res.json();
    console.log("Save Response:", result);

    if (!res.ok) {
      if (res.status === 401) {
        return {
          data: null,
          error: result.message || "Session expired — please log in again",
          isAuthError: true,
        };
      }
      const msg =
        result.message ||
        result.error ||
        result.errors?.map(e => e.msg || e.message).join(", ") ||
        `Server error ${res.status}`;
      return { data: null, error: msg, isAuthError: false };
    }

    const saved = result.data || result;
    return { data: saved, error: null, isAuthError: false };
  } catch (err) {
    console.error("saveProduction:", err);
    return {
      data: null,
      error: err.message || "Network error — is the server running?",
      isAuthError: false,
    };
  }
}

// ───────────────── PROCESS TYPES ─────────────────
const PROCESS_TYPES_KEY = "dairy_process_types";

const DEFAULT_PROCESS_TYPES = [
  { _id: "default-1", name: "Pasteurization" },
  { _id: "default-2", name: "Paneer Making" },
  { _id: "default-3", name: "Ghee Preparation" },
  { _id: "default-4", name: "Butter Churning" },
  { _id: "default-5", name: "Yogurt Making" },
];

function loadProcessTypesFromStorage() {
  try {
    const stored = localStorage.getItem(PROCESS_TYPES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("localStorage read error:", e);
  }
  return DEFAULT_PROCESS_TYPES;
}

function persistProcessTypes(types) {
  try {
    localStorage.setItem(PROCESS_TYPES_KEY, JSON.stringify(types));
  } catch (e) {
    console.error("localStorage write error:", e);
  }
}

// ──────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  date: new Date().toISOString().split("T")[0],
  process: "",
  inputQty: "",
  inputUnit: "L",
  inputPrice: "",
  outputQty: "",
  outputUnit: "L",
  outputPrice: "",
  laborCost: "",
  energyCost: "",
  notes: "",
};

export default function ProductionPage({ dark }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const s = getStyles(dark, isMobile, isTablet);

  // ── State ──────────────────────────────────────────────────────────────────
  const [production, setProduction] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isAuthed, setIsAuthed] = useState(true); // NEW

  const [processTypes, setProcessTypes] = useState(() => loadProcessTypesFromStorage());

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    process: loadProcessTypesFromStorage()[0]?.name || "",
  });

  // ── Load productions from MongoDB ─────────────────────────────────────────
  const loadProductions = async () => {
    setDbLoading(true);
    const data = await fetchProductions();
    if (data) {
      setProduction(data.map(normalizeProduction));
      setDbError(null);
      setIsAuthed(true);
    } else {
      setProduction(PRODUCTION_LOG.map(normalizeProduction));
      const token = getToken();
      if (!token) {
        setDbError("Not logged in — please sign in to save data");
      } else {
        setDbError("Session expired or invalid token — please log in again");
      }
      setIsAuthed(false);
    }
    setDbLoading(false);
  };

  useEffect(() => {
    loadProductions();
  }, []);

  // ── Metrics ────────────────────────────────────────────────────────────────
  const totalProcessed = production.reduce((a, b) => a + b.inputQty, 0);
  const totalOutput = production.reduce((a, b) => a + b.outputQty, 0);
  const avgLoss =
    production.length > 0
      ? (production.reduce((a, b) => a + b.lossPercent, 0) / production.length).toFixed(1)
      : 0;
  const totalLaborCost = production.reduce((a, b) => a + b.laborCost, 0);
  const totalEnergyCost = production.reduce((a, b) => a + b.energyCost, 0);
  const totalProductionCost = totalLaborCost + totalEnergyCost;
  const totalInputCost = production.reduce((a, b) => a + b.inputQty * b.inputPrice, 0);
  const totalOutputRevenue = production.reduce((a, b) => a + b.outputQty * b.outputPrice, 0);
  const totalProfit = totalOutputRevenue - totalInputCost - totalProductionCost;
  const profitMargin =
    totalOutputRevenue > 0 ? ((totalProfit / totalOutputRevenue) * 100).toFixed(1) : 0;

  // ── Add production ─────────────────────────────────────────────────────────
  const handleAddProduction = async () => {
    if (!form.process) { setSaveError("Please select a process type"); return; }
    if (!form.inputQty || Number(form.inputQty) <= 0) { setSaveError("Input quantity must be > 0"); return; }
    if (!form.outputQty || Number(form.outputQty) < 0) { setSaveError("Output quantity cannot be negative"); return; }
    if (!form.inputPrice || Number(form.inputPrice) <= 0) { setSaveError("Input price must be > 0"); return; }
    if (!form.outputPrice || Number(form.outputPrice) <= 0) { setSaveError("Output price must be > 0"); return; }

    const inputQty = Number(form.inputQty);
    const outputQty = Number(form.outputQty);
    const inputPrice = Number(form.inputPrice);
    const outputPrice = Number(form.outputPrice);
    const lossPercent = inputQty > 0 ? Number(((inputQty - outputQty) / inputQty) * 100).toFixed(1) : 0;
    const laborCost = Number(form.laborCost) || 0;
    const energyCost = Number(form.energyCost) || 0;

    const newEntry = {
      date: form.date,
      process: form.process,
      inputQty,
      inputUnit: form.inputUnit,
      inputPrice,
      outputQty,
      outputUnit: form.outputUnit,
      outputPrice,
      lossPercent: Number(lossPercent),
      laborCost,
      energyCost,
      notes: form.notes,
    };

    setSaving(true);
    setSaveError(null);

    const { data: saved, error, isAuthError } = await saveProduction(newEntry);
    setSaving(false);

    if (saved) {
      await loadProductions();
      setShowAddModal(false);
      setForm({ ...EMPTY_FORM, process: processTypes[0]?.name || "" });
    } else {
      setSaveError(error || "Unknown error");
      if (isAuthError) setIsAuthed(false);
      // Save locally so data isn't lost
      setProduction(prev => [{ ...newEntry, id: Date.now(), _id: `temp-${Date.now()}` }, ...prev]);
    }
  };

  // ── Manage process types ───────────────────────────────────────────────────
  const handleAddProcessType = () => {
    const name = newTypeName.trim();
    if (!name) return;
    if (processTypes.find(p => p.name.toLowerCase() === name.toLowerCase())) {
      alert("Process type already exists");
      return;
    }
    const newType = { _id: `local-${Date.now()}`, name };
    const updated = [...processTypes, newType];
    setProcessTypes(updated);
    persistProcessTypes(updated);
    setNewTypeName("");
  };

  const handleDeleteProcessType = (id, name) => {
    if (!window.confirm(`Delete process type "${name}"?`)) return;
    const updated = processTypes.filter(p => p._id !== id);
    setProcessTypes(updated);
    persistProcessTypes(updated);
    if (form.process === name) setForm(f => ({ ...f, process: updated[0]?.name || "" }));
  };

  // ── Process summary ────────────────────────────────────────────────────────
  const processSummary = {};
  production.forEach(p => {
    if (!processSummary[p.process]) {
      processSummary[p.process] = { count: 0, input: 0, output: 0, cost: 0, loss: [] };
    }
    processSummary[p.process].count += 1;
    processSummary[p.process].input += p.inputQty;
    processSummary[p.process].output += p.outputQty;
    processSummary[p.process].cost += p.laborCost + p.energyCost;
    processSummary[p.process].loss.push(p.lossPercent);
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Auth warning banner — NO auto-redirect, just a manual button */}
      {!isAuthed && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            background: "#fef2f2",
            border: `1px solid ${COLORS.danger}`,
            borderRadius: 10,
            fontSize: 13,
            color: "#991b1b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>
            🔒 <strong>Not connected to database.</strong> Your token is invalid or expired. Data is shown locally only.
          </span>
          <button
            onClick={clearAuthAndRedirect}
            style={{
              background: COLORS.danger,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            🔑 Log In Again
          </button>
        </div>
      )}

      {/* DB error banner (non-auth errors) */}
      {dbError && isAuthed && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 16px",
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: 10,
            fontSize: 13,
            color: "#92400e",
          }}
        >
          ⚠️ {dbError}
        </div>
      )}

      {dbLoading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", fontSize: 15 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔄</div>
          Loading from database…
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={s.grid(4)}>
            <StatCard icon="🏭" label="Total Input" value={`${totalProcessed} L`} color={COLORS.primary} dark={dark} />
            <StatCard icon="📦" label="Total Output" value={`${totalOutput} L`} color={COLORS.accent} dark={dark} />
            <StatCard icon="📉" label="Avg Loss %" value={`${avgLoss}%`} color={COLORS.warning} dark={dark} />
            <StatCard icon="💰" label="Production Cost" value={formatCurrency(totalProductionCost)} delta={`Labor: ${formatCurrency(totalLaborCost)} | Energy: ${formatCurrency(totalEnergyCost)}`} color={COLORS.primary} dark={dark} />
          </div>

          {/* Profit/Loss Cards */}
          <div style={s.grid(3)}>
            <div style={s.card}>
              <div style={{ fontSize: isMobile ? 11 : 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>TOTAL INPUT COST</div>
              <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: COLORS.primary, marginBottom: 4 }}>{formatCurrency(totalInputCost)}</div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: "#94a3b8" }}>{totalProcessed} L @ avg price</div>
            </div>
            <div style={s.card}>
              <div style={{ fontSize: isMobile ? 11 : 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>TOTAL OUTPUT REVENUE</div>
              <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: COLORS.accent, marginBottom: 4 }}>{formatCurrency(totalOutputRevenue)}</div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: "#94a3b8" }}>{totalOutput} L sold</div>
            </div>
            <div style={{ ...s.card, borderTop: `4px solid ${totalProfit >= 0 ? COLORS.accent : COLORS.danger}` }}>
              <div style={{ fontSize: isMobile ? 11 : 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>NET PROFIT/LOSS</div>
              <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: totalProfit >= 0 ? COLORS.accent : COLORS.danger, marginBottom: 4 }}>{formatCurrency(totalProfit)}</div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: "#94a3b8" }}>Margin: {profitMargin}%</div>
            </div>
          </div>

          {/* Process Overview */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ ...s.card, marginBottom: 0 }}>
              <SectionHeader title="Process Overview" dark={dark} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                {Object.entries(processSummary).map(([process, data]) => {
                  const al = (data.loss.reduce((a, b) => a + b, 0) / data.loss.length).toFixed(1);
                  const cpu = data.output > 0 ? (data.cost / data.output).toFixed(2) : 0;
                  return (
                    <div key={process} style={{ padding: 14, background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderRadius: 12, border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{process}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                        <div><div style={{ color: "#94a3b8", fontSize: 11 }}>Batches</div><div style={{ fontWeight: 600, color: COLORS.primary }}>{data.count}</div></div>
                        <div><div style={{ color: "#94a3b8", fontSize: 11 }}>Avg Loss</div><div style={{ fontWeight: 600, color: COLORS.warning }}>{al}%</div></div>
                        <div><div style={{ color: "#94a3b8", fontSize: 11 }}>Total Input</div><div style={{ fontWeight: 600 }}>{data.input} L</div></div>
                        <div><div style={{ color: "#94a3b8", fontSize: 11 }}>Cost/Unit</div><div style={{ fontWeight: 600, color: COLORS.accent }}>₹{cpu}</div></div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(processSummary).length === 0 && <div style={{ color: "#94a3b8", fontSize: 13, padding: 20 }}>No processes logged yet</div>}
              </div>
            </div>
          </div>

          {/* Production Log */}
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <SectionHeader title="Production Log" dark={dark} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => setShowManageTypes(true)} style={{ ...s.btn(COLORS.warning, true), display: "flex", alignItems: "center", gap: 6 }}>⚙️ Process Types</button>
                <button onClick={() => { setShowAddModal(true); setSaveError(null); }} style={s.btn(COLORS.primary)}>+ New Process</button>
              </div>
            </div>

            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {production.map(log => {
                  const inputCost = log.inputQty * (log.inputPrice || 0);
                  const outputRevenue = log.outputQty * (log.outputPrice || 0);
                  const totalCost = log.laborCost + log.energyCost;
                  const profit = outputRevenue - inputCost - totalCost;
                  return (
                    <div key={log._id || log.id} style={{ padding: 12, background: dark ? "rgba(255,255,255,0.02)" : "#f8fafc", borderRadius: 12, border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                        <div><div style={{ fontSize: 13, fontWeight: 700 }}>{log.process}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{log.date}</div></div>
                        <button onClick={() => setSelectedProcess(log)} style={{ ...s.btn(COLORS.primary, true), padding: "4px 10px", fontSize: 11 }}>View</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10, fontSize: 12 }}>
                        <div><div style={{ color: "#94a3b8", marginBottom: 2 }}>Input</div><div style={{ fontWeight: 600, color: COLORS.primary }}>{log.inputQty} {log.inputUnit}</div>{log.inputPrice && <div style={{ fontSize: 10, color: "#94a3b8" }}>₹{log.inputPrice.toFixed(2)}/unit</div>}</div>
                        <div><div style={{ color: "#94a3b8", marginBottom: 2 }}>Output</div><div style={{ fontWeight: 600, color: COLORS.accent }}>{log.outputQty} {log.outputUnit}</div>{log.outputPrice && <div style={{ fontSize: 10, color: "#94a3b8" }}>₹{log.outputPrice.toFixed(2)}/unit</div>}</div>
                        <div><div style={{ color: "#94a3b8", marginBottom: 2 }}>Loss %</div><div style={{ fontWeight: 600, color: log.lossPercent > 15 ? COLORS.danger : COLORS.warning }}>{log.lossPercent}%</div></div>
                        <div><div style={{ color: "#94a3b8", marginBottom: 2 }}>Prod. Cost</div><div style={{ fontWeight: 600 }}>{formatCurrency(totalCost)}</div></div>
                      </div>
                      {log.inputPrice && log.outputPrice && (
                        <div style={{ paddingTop: 10, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`, fontSize: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Profit/Loss:</span><span style={{ fontWeight: 700, color: profit >= 0 ? COLORS.accent : COLORS.danger }}>{formatCurrency(profit)}</span></div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {production.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No production logs</div>}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr>{["Date","Process","Input (Qty)","Input (₹/unit)","Output (Qty)","Output (₹/unit)","Loss %","Prod.Cost","Profit/Loss","Action"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {production.map(log => {
                      const inputCost = log.inputQty * (log.inputPrice || 0);
                      const outputRevenue = log.outputQty * (log.outputPrice || 0);
                      const totalCost = log.laborCost + log.energyCost;
                      const profit = outputRevenue - inputCost - totalCost;
                      return (
                        <tr key={log._id || log.id}>
                          <td style={s.td}>{log.date}</td>
                          <td style={{ ...s.td, fontWeight: 600 }}>{log.process}</td>
                          <td style={{ ...s.td, fontWeight: 600, color: COLORS.primary }}>{log.inputQty} {log.inputUnit}</td>
                          <td style={{ ...s.td, fontWeight: 600, color: COLORS.primary }}>₹{log.inputPrice?.toFixed(2) || "0.00"}</td>
                          <td style={{ ...s.td, fontWeight: 600, color: COLORS.accent }}>{log.outputQty} {log.outputUnit}</td>
                          <td style={{ ...s.td, fontWeight: 600, color: COLORS.accent }}>₹{log.outputPrice?.toFixed(2) || "0.00"}</td>
                          <td style={{ ...s.td, fontWeight: 600, color: log.lossPercent > 15 ? COLORS.danger : COLORS.warning }}>{log.lossPercent}%</td>
                          <td style={{ ...s.td, fontWeight: 600 }}>{formatCurrency(totalCost)}</td>
                          <td style={{ ...s.td, fontWeight: 700, color: profit >= 0 ? COLORS.accent : COLORS.danger }}>{formatCurrency(profit)}</td>
                          <td style={s.td}><button onClick={() => setSelectedProcess(log)} style={{ ...s.btn(COLORS.primary, true), padding: "4px 10px", fontSize: 11 }}>View</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {production.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No production logs</div>}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Manage Process Types Modal ─────────────────────────────────────── */}
      <Modal open={showManageTypes} onClose={() => setShowManageTypes(false)} title="Manage Process Types" dark={dark}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={s.label}>Add New Process Type</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newTypeName} onChange={e => setNewTypeName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddProcessType()} style={{ ...s.input, flex: 1 }} placeholder="e.g. Cream Separation" />
              <button onClick={handleAddProcessType} disabled={addingType || !newTypeName.trim()} style={{ ...s.btn(COLORS.accent), minWidth: 80, opacity: !newTypeName.trim() || addingType ? 0.5 : 1 }}>{addingType ? "..." : "+ Add"}</button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 10 }}>CURRENT TYPES ({processTypes.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {processTypes.map(pt => (
                <div key={pt._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc", borderRadius: 10, border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{pt.name}{pt._id.startsWith("default-") && <span style={{ marginLeft: 8, fontSize: 10, color: "#94a3b8", fontWeight: 400 }}>default</span>}</div>
                  <button onClick={() => handleDeleteProcessType(pt._id, pt.name)} style={{ background: "transparent", border: `1px solid ${COLORS.danger}40`, color: COLORS.danger, borderRadius: 6, padding: "3px 10px", fontSize: 12, cursor: "pointer" }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setShowManageTypes(false)} style={{ ...s.btn(COLORS.primary), width: "100%" }}>Done</button>
        </div>
      </Modal>

      {/* ── Production Detail Modal ────────────────────────────────────────── */}
      <Modal open={!!selectedProcess} onClose={() => setSelectedProcess(null)} title={selectedProcess?.process} dark={dark}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <div><div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>DATE</div><div style={{ fontSize: 16, fontWeight: 600 }}>{selectedProcess?.date}</div></div>
          <div><div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>PROCESS</div><div style={{ fontSize: 16, fontWeight: 600 }}>{selectedProcess?.process}</div></div>

          <div style={{ gridColumn: "1 / -1", padding: 12, background: dark ? "rgba(26,86,219,0.1)" : "rgba(26,86,219,0.05)", borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: COLORS.primary, fontWeight: 700, marginBottom: 8 }}>📥 INPUT</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Quantity</div><div style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary }}>{selectedProcess?.inputQty} {selectedProcess?.inputUnit}</div></div>
              <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Price per Unit</div><div style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary }}>₹{selectedProcess?.inputPrice?.toFixed(2) || "0.00"}</div></div>
              <div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 11, color: "#94a3b8" }}>Total Cost</div><div style={{ fontSize: 18, fontWeight: 700, color: COLORS.primary }}>{formatCurrency((selectedProcess?.inputQty || 0) * (selectedProcess?.inputPrice || 0))}</div></div>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", padding: 12, background: dark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.05)", borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: COLORS.accent, fontWeight: 700, marginBottom: 8 }}>📤 OUTPUT</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Quantity</div><div style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>{selectedProcess?.outputQty} {selectedProcess?.outputUnit}</div></div>
              <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Selling Price</div><div style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>₹{selectedProcess?.outputPrice?.toFixed(2) || "0.00"}</div></div>
              <div style={{ gridColumn: "1 / -1" }}><div style={{ fontSize: 11, color: "#94a3b8" }}>Total Revenue</div><div style={{ fontSize: 18, fontWeight: 700, color: COLORS.accent }}>{formatCurrency((selectedProcess?.outputQty || 0) * (selectedProcess?.outputPrice || 0))}</div></div>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", padding: 12, background: dark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.05)", borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: COLORS.warning, fontWeight: 700, marginBottom: 8 }}>📉 LOSS & COSTS</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 12 }}>
              <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Loss %</div><div style={{ fontSize: 18, fontWeight: 700, color: COLORS.warning }}>{selectedProcess?.lossPercent}%</div></div>
              <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Labor Cost</div><div style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(selectedProcess?.laborCost || 0)}</div></div>
              <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Energy Cost</div><div style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(selectedProcess?.energyCost || 0)}</div></div>
            </div>
          </div>

          {selectedProcess?.inputPrice && selectedProcess?.outputPrice && (() => {
            const ic = (selectedProcess.inputQty || 0) * (selectedProcess.inputPrice || 0);
            const or = (selectedProcess.outputQty || 0) * (selectedProcess.outputPrice || 0);
            const pc = (selectedProcess.laborCost || 0) + (selectedProcess.energyCost || 0);
            const net = or - ic - pc;
            return (
              <div style={{ gridColumn: "1 / -1", padding: 12, background: dark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.05)", borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginBottom: 8 }}>💹 PROFIT/LOSS</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 10 }}>
                  <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Input Cost</div><div style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(ic)}</div></div>
                  <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Production Cost</div><div style={{ fontSize: 16, fontWeight: 700, color: COLORS.warning }}>{formatCurrency(pc)}</div></div>
                  <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Total Cost</div><div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>{formatCurrency(ic + pc)}</div></div>
                </div>
                <div style={{ paddingTop: 10, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>NET PROFIT/LOSS</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: net >= 0 ? COLORS.accent : COLORS.danger }}>{formatCurrency(net)}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {selectedProcess?.notes && (
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>NOTES</div>
              <div style={{ fontSize: 14 }}>{selectedProcess.notes}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Add Production Modal ───────────────────────────────────────────── */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Production Process" dark={dark}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
          {saveError && (
            <div style={{ gridColumn: "1 / -1", padding: "10px 14px", background: "#fef2f2", border: `1px solid ${COLORS.danger}`, borderRadius: 8, fontSize: 13, color: "#991b1b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>❌ {saveError}</span>
                <button onClick={() => setSaveError(null)} style={{ background: "transparent", border: "none", color: "#991b1b", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>×</button>
              </div>
              {(saveError.includes("expired") || saveError.includes("Invalid token")) && (
                <button onClick={clearAuthAndRedirect} style={{ marginTop: 8, background: COLORS.danger, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", width: "100%" }}>🔑 Log In Again</button>
              )}
            </div>
          )}

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={s.input} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label style={{ ...s.label, marginBottom: 0 }}>Process Type</label>
              <button onClick={() => { setShowAddModal(false); setShowManageTypes(true); }} style={{ fontSize: 11, color: COLORS.primary, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>+ Manage Types</button>
            </div>
            <select value={form.process} onChange={e => setForm({ ...form, process: e.target.value })} style={s.select}>
              <option value="">— Select Process —</option>
              {processTypes.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div style={{ ...s.card, gridColumn: "1 / -1", background: dark ? "rgba(26,86,219,0.05)" : "rgba(26,86,219,0.02)", border: `1px solid ${COLORS.primary}20` }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: COLORS.primary }}>📥 INPUT DETAILS</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div><label style={s.label}>Quantity *</label><input type="number" value={form.inputQty} onChange={e => setForm({ ...form, inputQty: e.target.value })} style={s.input} placeholder="0" step="0.1" /></div>
              <div><label style={s.label}>Unit</label><select value={form.inputUnit} onChange={e => setForm({ ...form, inputUnit: e.target.value })} style={s.select}><option>L</option><option>KG</option></select></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Price per {form.inputUnit === "L" ? "Liter" : "KG"} (₹) *</label><input type="number" value={form.inputPrice} onChange={e => setForm({ ...form, inputPrice: e.target.value })} style={s.input} placeholder="0.00" step="0.01" /></div>
              {form.inputQty && form.inputPrice && (
                <div style={{ gridColumn: "1 / -1", padding: "10px 12px", background: COLORS.primary + "10", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Total Input Cost</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(Number(form.inputQty) * Number(form.inputPrice))}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ ...s.card, gridColumn: "1 / -1", background: dark ? "rgba(34,197,94,0.05)" : "rgba(34,197,94,0.02)", border: `1px solid ${COLORS.accent}20` }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: COLORS.accent }}>📤 OUTPUT DETAILS</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div><label style={s.label}>Quantity *</label><input type="number" value={form.outputQty} onChange={e => setForm({ ...form, outputQty: e.target.value })} style={s.input} placeholder="0" step="0.1" /></div>
              <div><label style={s.label}>Unit</label><select value={form.outputUnit} onChange={e => setForm({ ...form, outputUnit: e.target.value })} style={s.select}><option>L</option><option>KG</option><option>Liters</option></select></div>
              <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Selling Price per {form.outputUnit === "L" ? "Liter" : "KG"} (₹) *</label><input type="number" value={form.outputPrice} onChange={e => setForm({ ...form, outputPrice: e.target.value })} style={s.input} placeholder="0.00" step="0.01" /></div>
              {form.outputQty && form.outputPrice && (
                <div style={{ gridColumn: "1 / -1", padding: "10px 12px", background: COLORS.accent + "10", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Total Output Revenue</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>{formatCurrency(Number(form.outputQty) * Number(form.outputPrice))}</div>
                </div>
              )}
            </div>
          </div>

          {form.inputQty && form.outputQty && Number(form.inputQty) > 0 && (
            <div style={{ ...s.card, gridColumn: "1 / -1", background: dark ? "rgba(245,158,11,0.05)" : "rgba(245,158,11,0.02)", border: `1px solid ${COLORS.warning}20` }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: COLORS.warning }}>📉 LOSS ANALYSIS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Loss %</div><div style={{ fontSize: 20, fontWeight: 700, color: COLORS.warning }}>{(((Number(form.inputQty) - Number(form.outputQty)) / Number(form.inputQty)) * 100).toFixed(2)}%</div></div>
                <div><div style={{ fontSize: 11, color: "#94a3b8" }}>Quantity Lost</div><div style={{ fontSize: 20, fontWeight: 700, color: COLORS.warning }}>{(Number(form.inputQty) - Number(form.outputQty)).toFixed(2)} {form.inputUnit}</div></div>
              </div>
            </div>
          )}

          <div><label style={s.label}>Labor Cost (₹)</label><input type="number" value={form.laborCost} onChange={e => setForm({ ...form, laborCost: e.target.value })} style={s.input} placeholder="0" /></div>
          <div><label style={s.label}>Energy Cost (₹)</label><input type="number" value={form.energyCost} onChange={e => setForm({ ...form, energyCost: e.target.value })} style={s.input} placeholder="0" /></div>

          {form.inputQty && form.outputQty && form.inputPrice && form.outputPrice && (() => {
            const ic = Number(form.inputQty) * Number(form.inputPrice);
            const or = Number(form.outputQty) * Number(form.outputPrice);
            const pc = (Number(form.laborCost) || 0) + (Number(form.energyCost) || 0);
            const net = or - ic - pc;
            return (
              <div style={{ ...s.card, gridColumn: "1 / -1", background: dark ? "rgba(16,185,129,0.05)" : "rgba(16,185,129,0.02)", border: "1px solid #10b98120" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#10b981" }}>💹 PROFIT/LOSS CALCULATION</div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12, fontSize: 12 }}>
                  <div><div style={{ color: "#94a3b8" }}>Total Input Cost</div><div style={{ fontSize: 16, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(ic)}</div></div>
                  <div><div style={{ color: "#94a3b8" }}>Total Output Revenue</div><div style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>{formatCurrency(or)}</div></div>
                  <div><div style={{ color: "#94a3b8" }}>Total Prod. Cost</div><div style={{ fontSize: 16, fontWeight: 700, color: COLORS.warning }}>{formatCurrency(pc)}</div></div>
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}` }}>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>NET PROFIT/LOSS</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: net >= 0 ? COLORS.accent : COLORS.danger }}>{formatCurrency(net)}</div>
                </div>
              </div>
            );
          })()}

          <div style={{ gridColumn: "1 / -1" }}><label style={s.label}>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={s.input} placeholder="Optional notes…" /></div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
            <button onClick={handleAddProduction} disabled={saving} style={{ ...s.btn(COLORS.primary), flex: 1, opacity: saving ? 0.7 : 1 }}>{saving ? "⏳ Saving…" : "✓ Add Process"}</button>
            <button onClick={() => { setShowAddModal(false); setSaveError(null); }} style={{ ...s.btn(COLORS.primary, true), flex: 1 }}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}