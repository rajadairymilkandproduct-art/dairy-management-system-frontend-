import { useState, useRef, useEffect } from "react";
import { getStyles } from "../../styles/getStyles.js";
import { COLORS } from "../../constants/index.js";
import { NOTIFICATIONS as NOTIF_DATA } from "../../data/mockData.js";

const PAGE_TITLES = {
  dashboard:    "Dashboard",
  analytics:    "Analytics",
  reports:      "Reports & Data",
  distributors: "Distributors",
  milk:         "Milk Collection",
  production:   "Production",
  inventory:    "Inventory",
  clients:      "Clients",
  sales:        "Sales",
  payments:     "Payments",
  profit:       "Profit & Loss",
  settings:     "Settings",
};

export default function Topbar({
  dark, toggleDark, activePage, user, isMobile,
  sidebarOpen, toggleSidebar, onLogout, loggingOut,
}) {
  const s = getStyles(dark, isMobile);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notifRef   = useRef(null);
  const userMenuRef = useRef(null);

  const unreadCount = NOTIF_DATA.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const roleColors = {
    Admin:   "#1a56db",
    Manager: "#8b5cf6",
    Staff:   "#10b981",
  };
  const roleColor = roleColors[user?.role] || COLORS.primary;

  return (
    <div style={s.topbar}>
      {/* Left — hamburger + page title */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
        {isMobile && (
          <button onClick={toggleSidebar} style={s.hamburger} title="Toggle Menu">
            <div style={{ ...s.hamburgerLine, transform: sidebarOpen ? "rotate(45deg) translateY(11px)" : "rotate(0)" }} />
            <div style={{ ...s.hamburgerLine, opacity: sidebarOpen ? 0 : 1 }} />
            <div style={{ ...s.hamburgerLine, transform: sidebarOpen ? "rotate(-45deg) translateY(-11px)" : "rotate(0)" }} />
          </button>
        )}
        <div style={s.pageTitle}>{PAGE_TITLES[activePage] || "Dashboard"}</div>
      </div>

      {/* Right — actions */}
      <div style={s.topbarRight}>
        {/* Dark mode toggle */}
        <button onClick={toggleDark} style={s.iconBtn} title="Toggle Theme">
          {dark ? "☀️" : "🌙"}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button onClick={() => { setNotifOpen(o => !o); setUserMenuOpen(false); }} style={s.iconBtn} title="Notifications">
            🔔
            {unreadCount > 0 && <div style={s.badge}>{unreadCount}</div>}
          </button>

          {notifOpen && (
            <div style={{
              position: "absolute",
              right: 0,
              top: 44,
              width: isMobile ? 290 : 320,
              background: dark ? "#1e293b" : "white",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              zIndex: 200,
              overflow: "hidden",
            }}>
              <div style={{ padding: "14px 16px", borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9", fontWeight: 700, fontSize: 14 }}>
                Notifications
                {unreadCount > 0 && (
                  <span style={{ marginLeft: 8, background: COLORS.danger, color: "white", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 10 }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {NOTIF_DATA.map(n => {
                  const colors = { warning: "#f59e0b", danger: "#ef4444", info: COLORS.primary, success: "#10b981" };
                  return (
                    <div key={n.id} style={{
                      padding: "12px 16px",
                      borderBottom: dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #f8fafc",
                      background: !n.read ? colors[n.type] + "08" : "transparent",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: dark ? "#e2e8f0" : "#334155" }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{n.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User avatar + dropdown */}
        <div ref={userMenuRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setUserMenuOpen(o => !o); setNotifOpen(false); }}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${roleColor}, ${roleColor}cc)`,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              border: `2px solid ${userMenuOpen ? roleColor : "transparent"}`,
              outline: "none",
              transition: "all 0.2s",
              boxShadow: userMenuOpen ? `0 0 0 3px ${roleColor}30` : "none",
            }}
            title={user?.name}
          >
            {user?.name?.[0]?.toUpperCase() || "U"}
          </button>

          {userMenuOpen && (
            <div style={{
              position: "absolute",
              right: 0,
              top: 44,
              width: 220,
              background: dark ? "#1e293b" : "white",
              borderRadius: 14,
              boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
              border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              zIndex: 200,
              overflow: "hidden",
            }}>
              {/* User info header */}
              <div style={{
                padding: "14px 16px",
                borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9",
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: dark ? "#f1f5f9" : "#0f172a" }}>
                  {user?.name || "User"}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{user?.email}</div>
                <div style={{
                  display: "inline-block",
                  marginTop: 6,
                  background: roleColor + "18",
                  color: roleColor,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 9px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  {user?.role}
                </div>
              </div>

              {/* Logout option */}
              <div style={{ padding: "8px" }}>
                <button
                  onClick={() => { setUserMenuOpen(false); onLogout(); }}
                  disabled={loggingOut}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "none",
                    border: "none",
                    borderRadius: 10,
                    cursor: loggingOut ? "not-allowed" : "pointer",
                    color: "#ef4444",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "inherit",
                    transition: "background 0.15s",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                >
                  <span style={{ fontSize: 16 }}>{loggingOut ? "⟳" : "🚪"}</span>
                  {loggingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
