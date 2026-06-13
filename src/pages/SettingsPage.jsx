/**
 * SettingsPage — Full backend-connected settings
 * - Business details (GET/PATCH /api/settings/business)
 * - Password change (PATCH /api/settings/change-password)
 * - Production level upgrade (PATCH /api/settings/production-level)
 * - User management (GET /api/auth/users)
 * - Dark mode toggle
 */
import { useState, useEffect } from "react";
import { COLORS } from "../constants/index.js";
import { getStyles } from "../styles/getStyles.js";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import { settingsAPI, authAPI, getUserData } from "../utils/api.js";

/* ── Toast ── */
function Toast({ message, type, onClose }) {
  const cfg = {
    success: { bg: "#ecfdf5", border: COLORS.accent, text: "#065f46", icon: "✓" },
    error:   { bg: "#fef2f2", border: COLORS.danger, text: "#991b1b", icon: "✕" },
    info:    { bg: "#eff6ff", border: COLORS.primary, text: "#1e40af", icon: "ℹ" },
  }[type] || { bg: "#eff6ff", border: COLORS.primary, text: "#1e40af", icon: "ℹ" };
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, display: "flex",
      alignItems: "center", gap: 10, padding: "14px 20px", background: cfg.bg,
      borderLeft: `4px solid ${cfg.border}`, borderRadius: 14,
      boxShadow: "0 12px 44px rgba(0,0,0,0.16)", maxWidth: 400 }}>
      <span style={{ width: 24, height: 24, borderRadius: "50%", background: cfg.border,
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700 }}>{cfg.icon}</span>
      <span style={{ color: cfg.text, fontSize: 14, fontWeight: 500 }}>{message}</span>
      <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none",
        cursor: "pointer", color: cfg.text, fontSize: 18 }}>×</button>
    </div>
  );
}

const LEVELS = [
  { name: "Starter",    maxDailyLitres: 100,  maxDistributors: 10,  maxClients: 20,  color: "#64748b", icon: "🌱", price: "Free" },
  { name: "Growing",    maxDailyLitres: 500,  maxDistributors: 50,  maxClients: 100, color: "#3b82f6", icon: "🌿", price: "₹999/mo" },
  { name: "Established",maxDailyLitres: 2000, maxDistributors: 200, maxClients: 500, color: "#8b5cf6", icon: "🌳", price: "₹2,499/mo" },
  { name: "Enterprise", maxDailyLitres: 99999,maxDistributors: 9999,maxClients: 9999,color: "#f59e0b", icon: "🏭", price: "Custom" },
];

export default function SettingsPage({ dark, toggleDark }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const s = getStyles(dark, isMobile, isTablet);
  const currentUser = getUserData();

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "info") => setToast({ message, type });

  /* ── Business Settings ── */
  const [bizLoading, setBizLoading] = useState(true);
  const [bizSaving, setBizSaving] = useState(false);
  const [profile, setProfile] = useState({
    businessName: "", ownerName: "", phone: "", email: "", address: "", gstNumber: "", bankAccount: ""
  });
  const [currentLevel, setCurrentLevel] = useState("Starter");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsAPI.getBusinessSettings();
        if (res.success && res.data) {
          const d = res.data;
          setProfile({
            businessName: d.businessName || "",
            ownerName: d.ownerName || "",
            phone: d.phone || "",
            email: d.email || "",
            address: d.address || "",
            gstNumber: d.gstNumber || "",
            bankAccount: d.bankAccount || "",
          });
          if (d.productionLevel?.name) setCurrentLevel(d.productionLevel.name);
        }
      } catch (e) { console.error("Settings load error:", e); }
      finally { setBizLoading(false); }
    };
    load();
  }, []);

  const handleSaveBusiness = async () => {
    setBizSaving(true);
    try {
      const res = await settingsAPI.updateBusinessSettings(profile);
      if (res.success) showToast("Business details saved!", "success");
      else showToast(res.message || "Save failed", "error");
    } catch (e) { showToast(e.message || "Save failed", "error"); }
    finally { setBizSaving(false); }
  };

  /* ── Password Change ── */
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const setPwField = (k) => (e) => setPw(f => ({ ...f, [k]: e.target.value }));

  const handleChangePassword = async () => {
    if (!pw.currentPassword || !pw.newPassword || !pw.confirmPassword)
      return showToast("All three fields are required.", "error");
    if (pw.newPassword !== pw.confirmPassword)
      return showToast("New passwords do not match.", "error");
    if (pw.newPassword.length < 6)
      return showToast("Password must be at least 6 characters.", "error");
    setPwLoading(true);
    try {
      const res = await settingsAPI.changePassword(pw);
      if (res.success) {
        showToast("Password changed successfully!", "success");
        setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else showToast(res.message || "Failed to change password", "error");
    } catch (e) { showToast(e.message || "Failed to change password", "error"); }
    finally { setPwLoading(false); }
  };

  /* ── Production Level ── */
  const [levelSaving, setLevelSaving] = useState(false);

  const handleUpgradeLevel = async (lvl) => {
    if (lvl.name === currentLevel) return;
    setLevelSaving(lvl.name);
    try {
      const res = await settingsAPI.updateProductionLevel({ name: lvl.name, maxDailyLitres: lvl.maxDailyLitres, maxDistributors: lvl.maxDistributors, maxClients: lvl.maxClients });
      if (res.success) { setCurrentLevel(lvl.name); showToast(`Upgraded to ${lvl.name}!`, "success"); }
      else showToast(res.message || "Upgrade failed", "error");
    } catch (e) { showToast(e.message || "Upgrade failed", "error"); }
    finally { setLevelSaving(false); }
  };

  /* ── Users ── */
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  useEffect(() => {
    const load = async () => {
      try { const res = await authAPI.getUsers(); setUsers(res.data || []); }
      catch (e) { console.error("Users load:", e); }
      finally { setUsersLoading(false); }
    };
    load();
  }, []);

  /* ── Styles ── */
  const cardBg = dark ? "rgba(255,255,255,0.04)" : "#fff";
  const border = dark ? "1.5px solid rgba(255,255,255,0.08)" : "1.5px solid #e2e8f0";
  const textPrimary = dark ? "#f1f5f9" : "#1e293b";
  const textSec = dark ? "#94a3b8" : "#64748b";
  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10,
    border: dark ? "1.5px solid rgba(255,255,255,0.1)" : "1.5px solid #e2e8f0",
    background: dark ? "rgba(255,255,255,0.05)" : "#f8fafc",
    color: textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: textSec, marginBottom: 4, display: "block" };
  const sectionCard = { background: cardBg, borderRadius: 16, border, padding: 24, marginBottom: 20 };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: isMobile ? 20 : 24, color: textPrimary, margin: 0 }}>⚙️ Settings</h2>
        <p style={{ color: textSec, fontSize: 13, margin: "4px 0 0" }}>Configure your DairyFlow system</p>
      </div>

      {/* ── Business Details ── */}
      <div style={sectionCard}>
        <SectionHeader title="🏢 Business Details" dark={dark} />
        {bizLoading ? (
          <div style={{ color: textSec, fontSize: 13, padding: "16px 0" }}>Loading business settings…</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              {[
                ["businessName", "Business / Dairy Name"],
                ["ownerName", "Owner Name"],
                ["phone", "Phone Number"],
                ["email", "Email Address"],
                ["gstNumber", "GST Number"],
                ["bankAccount", "Bank Account / UPI ID"],
              ].map(([k, label]) => (
                <div key={k}>
                  <label style={labelStyle}>{label}</label>
                  <input value={profile[k]} onChange={e => setProfile({ ...profile, [k]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Address</label>
                <textarea value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })}
                  rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
            <button onClick={handleSaveBusiness} disabled={bizSaving}
              style={{ marginTop: 18, padding: "11px 28px", background: bizSaving ? "#9ca3af" : COLORS.primary,
                color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14,
                cursor: bizSaving ? "not-allowed" : "pointer" }}>
              {bizSaving ? "Saving…" : "💾 Save Business Details"}
            </button>
          </>
        )}
      </div>

      {/* ── Appearance ── */}
      <div style={sectionCard}>
        <SectionHeader title="🎨 Appearance" dark={dark} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
          <div>
            <div style={{ fontWeight: 600, color: textPrimary, fontSize: 15 }}>{dark ? "🌙 Dark Mode" : "☀️ Light Mode"}</div>
            <div style={{ color: textSec, fontSize: 13, marginTop: 2 }}>Switch between light and dark interface</div>
          </div>
          <div onClick={toggleDark} style={{
            width: 52, height: 28, borderRadius: 14, cursor: "pointer", transition: "background 0.3s",
            background: dark ? COLORS.primary : "#e2e8f0", position: "relative"
          }}>
            <div style={{ position: "absolute", top: 3, left: dark ? 26 : 3, width: 22, height: 22,
              borderRadius: "50%", background: "#fff", transition: "left 0.3s",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
      </div>

      {/* ── Production Level ── */}
      <div style={sectionCard}>
        <SectionHeader title="🚀 Production Level" dark={dark} />
        <p style={{ color: textSec, fontSize: 13, marginBottom: 16 }}>
          Current plan: <strong style={{ color: textPrimary }}>{currentLevel}</strong>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
          {LEVELS.map(lvl => {
            const isActive = lvl.name === currentLevel;
            const isSaving = levelSaving === lvl.name;
            return (
              <div key={lvl.name} style={{
                border: isActive ? `2px solid ${lvl.color}` : border,
                borderRadius: 14, padding: 16, textAlign: "center", cursor: "pointer",
                background: isActive ? `${lvl.color}12` : cardBg,
                transition: "all 0.2s",
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{lvl.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: lvl.color, marginBottom: 4 }}>{lvl.name}</div>
                <div style={{ fontSize: 11, color: textSec, marginBottom: 2 }}>Up to {lvl.maxDailyLitres === 99999 ? "∞" : lvl.maxDailyLitres} L/day</div>
                <div style={{ fontSize: 11, color: textSec, marginBottom: 10 }}>{lvl.maxDistributors === 9999 ? "∞" : lvl.maxDistributors} distributors</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 12 }}>{lvl.price}</div>
                <button
                  onClick={() => handleUpgradeLevel(lvl)}
                  disabled={isActive || !!levelSaving}
                  style={{ width: "100%", padding: "8px 0", borderRadius: 10, border: "none",
                    background: isActive ? lvl.color : (dark ? "rgba(255,255,255,0.08)" : "#f1f5f9"),
                    color: isActive ? "#fff" : textSec, fontWeight: 600, fontSize: 12,
                    cursor: isActive || levelSaving ? "not-allowed" : "pointer" }}>
                  {isActive ? "✓ Active" : isSaving ? "Upgrading…" : "Select"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Change Password ── */}
      <div style={sectionCard}>
        <SectionHeader title="🔒 Change Password" dark={dark} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
          {[
            ["currentPassword", "Current Password"],
            ["newPassword", "New Password"],
            ["confirmPassword", "Confirm New Password"],
          ].map(([k, label]) => (
            <div key={k}>
              <label style={labelStyle}>{label}</label>
              <input type="password" value={pw[k]} onChange={setPwField(k)} style={inputStyle} autoComplete="new-password" />
            </div>
          ))}
        </div>
        <button onClick={handleChangePassword} disabled={pwLoading}
          style={{ marginTop: 18, padding: "11px 28px", background: pwLoading ? "#9ca3af" : COLORS.danger,
            color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14,
            cursor: pwLoading ? "not-allowed" : "pointer" }}>
          {pwLoading ? "Updating…" : "🔐 Update Password"}
        </button>
      </div>

      {/* ── User Management ── */}
      {currentUser?.role === "Admin" && (
        <div style={sectionCard}>
          <SectionHeader title="👥 User Accounts" dark={dark} />
          {usersLoading ? (
            <div style={{ color: textSec, fontSize: 13 }}>Loading users…</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Name","Email","Role","Status"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11,
                        fontWeight: 700, color: textSec, textTransform: "uppercase",
                        borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td style={{ padding: "12px 12px", fontSize: 13, color: textPrimary, fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${COLORS.primary}20`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: COLORS.primary, fontWeight: 700, fontSize: 13 }}>
                            {u.name[0].toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td style={{ padding: "12px 12px", fontSize: 13, color: textSec }}>{u.email}</td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: u.role === "Admin" ? "#fef3c7" : u.role === "Manager" ? "#eff6ff" : "#f1f5f9",
                          color: u.role === "Admin" ? "#92400e" : u.role === "Manager" ? "#1e40af" : "#475569" }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: u.isActive !== false ? "#ecfdf5" : "#fef2f2",
                          color: u.isActive !== false ? "#15803d" : "#dc2626" }}>
                          {u.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── System Info ── */}
      <div style={sectionCard}>
        <SectionHeader title="ℹ️ System Information" dark={dark} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          {[
            ["App Version", "DairyFlow v2.0"],
            ["Backend", "Node.js + Express + MongoDB"],
            ["Logged In As", currentUser?.name || "—"],
            ["Role", currentUser?.role || "—"],
            ["Email", currentUser?.email || "—"],
            ["API URL", import.meta?.env?.VITE_API_URL || "http://localhost:5000/api"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between",
              padding: "10px 14px", background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
              borderRadius: 10, border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}` }}>
              <span style={{ color: textSec, fontSize: 13 }}>{label}</span>
              <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
