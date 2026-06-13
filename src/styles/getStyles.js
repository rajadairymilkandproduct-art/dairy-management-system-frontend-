export const getStyles = (dark, isMobile = false, isTablet = false) => ({
  app: { 
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif", 
    background: dark ? "#0f172a" : "#f0f4ff", 
    minHeight: "100vh", 
    color: dark ? "#e2e8f0" : "#1e293b", 
    transition: "all 0.3s" 
  },
  sidebar: { 
    width: isMobile ? "100%" : isTablet ? 220 : 240, 
    background: dark ? "#1e293b" : "#1a56db", 
    minHeight: "100vh", 
    display: "flex", 
    flexDirection: "column", 
    position: isMobile ? "fixed" : "fixed", 
    top: isMobile ? 64 : 0, 
    left: 0, 
    zIndex: isMobile ? 99 : 100, 
    transition: "all 0.3s", 
    boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
    maxHeight: isMobile ? "calc(100vh - 64px)" : "100vh",
    overflowY: "auto",
  },
  sidebarBrand: { 
    padding: isMobile ? "16px 14px" : "20px 20px 16px", 
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    display: isMobile ? "none" : "block"
  },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { width: 38, height: 38, background: "white", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  logoText: { color: "white", fontWeight: 700, fontSize: 18, lineHeight: 1.1 },
  logoSub: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 400 },
  navSection: { flex: 1, overflowY: "auto", padding: isMobile ? "8px 0" : "12px 0" },
  navLabel: { 
    color: "rgba(255,255,255,0.45)", 
    fontSize: isMobile ? 9 : 10, 
    fontWeight: 600, 
    letterSpacing: "0.1em", 
    textTransform: "uppercase", 
    padding: isMobile ? "8px 14px 4px" : "10px 20px 4px",
    display: isMobile ? "none" : "block"
  },
  navItem: (active) => ({ 
    display: "flex", 
    alignItems: "center", 
    gap: isMobile ? 12 : 10, 
    padding: isMobile ? "12px 14px" : "10px 20px", 
    cursor: "pointer", 
    borderRadius: 0, 
    color: active ? "white" : "rgba(255,255,255,0.65)", 
    background: active ? "rgba(255,255,255,0.15)" : "transparent", 
    borderLeft: active ? "3px solid white" : "3px solid transparent", 
    transition: "all 0.2s", 
    fontSize: isMobile ? 13 : 14, 
    fontWeight: active ? 600 : 400,
    justifyContent: isMobile ? "center" : "flex-start"
  }),
  navIcon: { fontSize: isMobile ? 18 : 16, width: isMobile ? 24 : 20, textAlign: "center" },
  sidebarFooter: { 
    padding: isMobile ? "12px 14px" : "16px 20px", 
    borderTop: "1px solid rgba(255,255,255,0.15)",
    display: isMobile ? "none" : "block"
  },
  userCard: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "white", fontWeight: 600, border: "2px solid rgba(255,255,255,0.3)" },
  userInfo: { flex: 1 },
  userName: { color: "white", fontSize: 13, fontWeight: 600 },
  userRole: { color: "rgba(255,255,255,0.55)", fontSize: 11 },
  mainContent: { 
    marginLeft: isMobile ? 0 : isTablet ? 220 : 240, 
    display: "flex", 
    flexDirection: "column", 
    minHeight: "100vh",
    transition: "margin-left 0.3s"
  },
  topbar: { 
    background: dark ? "#1e293b" : "white", 
    padding: isMobile ? "0 12px" : "0 24px", 
    height: 64, 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "space-between", 
    boxShadow: dark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.08)", 
    position: "sticky", 
    top: 0, 
    zIndex: 50 
  },
  pageTitle: { 
    fontSize: isMobile ? 14 : 18, 
    fontWeight: 700, 
    color: dark ? "#f1f5f9" : "#1e293b" 
  },
  topbarRight: { display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 },
  iconBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 8, 
    border: "none", 
    background: dark ? "rgba(255,255,255,0.05)" : "#f1f5f9", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    fontSize: 16, 
    color: dark ? "#94a3b8" : "#64748b", 
    position: "relative", 
    transition: "all 0.2s",
    padding: 0
  },
  hamburger: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "none",
    background: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 0
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    background: dark ? "#94a3b8" : "#64748b",
    borderRadius: 1,
    transition: "all 0.3s"
  },
  badge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", color: "white", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  pageContent: { 
    flex: 1, 
    padding: isMobile ? 12 : isTablet ? 16 : 24, 
    overflowY: "auto",
    transition: "padding 0.3s"
  },
  card: { 
    background: dark ? "#1e293b" : "white", 
    borderRadius: 16, 
    padding: isMobile ? 14 : 20, 
    boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.25)" : "0 2px 12px rgba(0,0,0,0.06)", 
    border: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.04)", 
    transition: "all 0.2s" 
  },
  statCard: (color) => ({ 
    background: dark ? "#1e293b" : "white", 
    borderRadius: 16, 
    padding: isMobile ? "14px 16px" : "20px 22px", 
    boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.25)" : "0 2px 12px rgba(0,0,0,0.06)", 
    borderTop: `4px solid ${color}`, 
    position: "relative", 
    overflow: "hidden" 
  }),
  statIcon: (color) => ({ 
    width: isMobile ? 36 : 44, 
    height: isMobile ? 36 : 44, 
    borderRadius: 12, 
    background: color + "18", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    fontSize: isMobile ? 18 : 20, 
    marginBottom: 12 
  }),
  statLabel: { 
    fontSize: isMobile ? 10 : 12, 
    color: dark ? "#94a3b8" : "#64748b", 
    fontWeight: 500, 
    textTransform: "uppercase", 
    letterSpacing: "0.05em" 
  },
  statValue: { 
    fontSize: isMobile ? 18 : 26, 
    fontWeight: 800, 
    color: dark ? "#f1f5f9" : "#1e293b", 
    marginTop: 2 
  },
  statDelta: (pos) => ({ 
    fontSize: 11, 
    color: pos ? "#10b981" : "#ef4444", 
    fontWeight: 600, 
    marginTop: 4, 
    display: "flex", 
    alignItems: "center", 
    gap: 3 
  }),
  grid: (cols) => {
    let responsive = cols;
    if (isMobile) responsive = 1;
    else if (isTablet) responsive = Math.max(2, cols - 1);
    return { display: "grid", gridTemplateColumns: `repeat(${responsive}, 1fr)`, gap: isMobile ? 12 : 16, transition: "all 0.3s" }
  },
  sectionTitle: { 
    fontSize: isMobile ? 14 : 16, 
    fontWeight: 700, 
    color: dark ? "#f1f5f9" : "#1e293b", 
    marginBottom: 16 
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 11 : 13 },
  th: { 
    textAlign: "left", 
    padding: isMobile ? "8px 10px" : "10px 14px", 
    color: dark ? "#94a3b8" : "#64748b", 
    fontWeight: 600, 
    fontSize: isMobile ? 9 : 11, 
    textTransform: "uppercase", 
    letterSpacing: "0.05em", 
    borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9" 
  },
  td: { 
    padding: isMobile ? "10px 8px" : "12px 14px", 
    borderBottom: dark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #f8fafc", 
    color: dark ? "#e2e8f0" : "#334155" 
  },
  badge2: (color) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + "20", color: color }),
  btn: (color, outline) => ({ 
    padding: isMobile ? "6px 12px" : "8px 16px", 
    borderRadius: 8, 
    border: outline ? `1.5px solid ${color}` : "none", 
    background: outline ? "transparent" : color, 
    color: outline ? color : "white", 
    cursor: "pointer", 
    fontSize: isMobile ? 12 : 13, 
    fontWeight: 600, 
    display: "inline-flex", 
    alignItems: "center", 
    gap: 6, 
    transition: "all 0.15s",
    whiteSpace: "nowrap"
  }),
  input: { 
    width: "100%", 
    padding: "10px 14px", 
    borderRadius: 10, 
    border: dark ? "1.5px solid rgba(255,255,255,0.1)" : "1.5px solid #e2e8f0", 
    background: dark ? "rgba(255,255,255,0.05)" : "#f8fafc", 
    color: dark ? "#e2e8f0" : "#1e293b", 
    fontSize: isMobile ? 13 : 14, 
    outline: "none", 
    boxSizing: "border-box", 
    transition: "all 0.2s" 
  },
  label: { 
    fontSize: isMobile ? 12 : 13, 
    fontWeight: 600, 
    color: dark ? "#94a3b8" : "#64748b", 
    marginBottom: 6, 
    display: "block" 
  },
  select: { 
    width: "100%", 
    padding: "10px 14px", 
    borderRadius: 10, 
    border: dark ? "1.5px solid rgba(255,255,255,0.1)" : "1.5px solid #e2e8f0", 
    background: dark ? "#1e293b" : "#f8fafc", 
    color: dark ? "#e2e8f0" : "#1e293b", 
    fontSize: isMobile ? 13 : 14, 
    outline: "none", 
    cursor: "pointer" 
  },
  modal: { 
    position: "fixed", 
    inset: 0, 
    background: "rgba(0,0,0,0.5)", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    zIndex: 1000, 
    padding: isMobile ? 12 : 16 
  },
  modalContent: { 
    background: dark ? "#1e293b" : "white", 
    borderRadius: 20, 
    padding: isMobile ? 20 : 28, 
    width: "100%", 
    maxWidth: isMobile ? "95%" : 520, 
    maxHeight: "90vh", 
    overflowY: "auto", 
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)" 
  },
  progressBar: (pct, color) => ({ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s ease" }),
  chip: (color) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + "15", color: color, border: `1px solid ${color}30` }),
});
