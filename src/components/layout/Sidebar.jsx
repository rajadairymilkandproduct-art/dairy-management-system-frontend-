import { getStyles } from "../../styles/getStyles.js";
import { NAV_SECTIONS } from "../../constants/index.js";

export default function Sidebar({ dark, activePage, setActivePage, user, onLogout, loggingOut, isMobile }) {
  const s = getStyles(dark, isMobile);

  const roleColors = {
    Admin:   { bg: "#1a56db22", color: "#1a56db" },
    Manager: { bg: "#8b5cf622", color: "#8b5cf6" },
    Staff:   { bg: "#10b98122", color: "#10b981" },
  };
  const rc = roleColors[user?.role] || roleColors.Staff;

  return (
    <div style={s.sidebar}>
      {/* Brand */}
      <div style={s.sidebarBrand}>
        <div style={{ ...(isMobile ? { justifyContent: "center" } : {}), ...s.sidebarLogo }}>
          <div style={s.logoIcon}>🥛</div>
          {!isMobile && (
            <div>
              <div style={s.logoText}>RAJADairy</div>
              <div style={s.logoSub}>SMART DAIRY MGMT</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={s.navSection}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div style={s.navLabel}>{section.label}</div>
            {section.items.map((item) => (
              <div
                key={item.id}
                style={s.navItem(activePage === item.id)}
                onClick={() => setActivePage(item.id)}
              >
                <span style={s.navIcon}>{item.icon}</span>
                {!isMobile && <span>{item.label}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer — User card + logout */}
      <div style={s.sidebarFooter}>
        {/* User info */}
        <div style={{
          padding: "12px 14px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 12,
          marginBottom: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1a56db, #8b5cf6)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 15,
              flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            {!isMobile && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {user?.name || "User"}
                </div>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: rc.bg,
                  color: rc.color,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                  marginTop: 2,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  {user?.role || "Staff"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout button — prominent, always visible */}
        <button
          onClick={onLogout}
          disabled={loggingOut}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: isMobile ? "center" : "flex-start",
            gap: 10,
            padding: isMobile ? "10px" : "11px 14px",
            background: loggingOut ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12,
            color: "#fca5a5",
            cursor: loggingOut ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 700,
            transition: "all 0.2s",
            fontFamily: "inherit",
            letterSpacing: "0.01em",
          }}
          onMouseEnter={e => { if (!loggingOut) { e.currentTarget.style.background = "rgba(239,68,68,0.25)"; e.currentTarget.style.color = "#f87171"; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#fca5a5"; }}
          title="Logout"
        >
          <span style={{ fontSize: 16 }}>
            {loggingOut ? "⟳" : "🚪"}
          </span>
          {!isMobile && (
            <span>{loggingOut ? "Signing out…" : "Sign Out"}</span>
          )}
        </button>
      </div>
    </div>
  );
}
