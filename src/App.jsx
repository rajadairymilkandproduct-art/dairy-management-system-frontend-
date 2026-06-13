import { useState, useEffect } from "react";
import { getStyles } from "./styles/getStyles.js";
import { authAPI, getUserData } from "./utils/api.js";
import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DistributorsPage from "./pages/DistributorsPage.jsx";
import MilkCollectionPage from "./pages/MilkCollectionPage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import ReportsAnalyticsPage from "./pages/ReportsAnalyticsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import SalesPage from "./pages/SalesPage.jsx";
import ProductionPage from "./pages/ProductionPage.jsx";

export default function App() {
  const [dark, setDark] = useState(false);
  // page: "loading" | "home" | "login" | "app"
  const [page, setPage] = useState("loading");
  const [activePage, setActivePage] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [loggingOut, setLoggingOut] = useState(false);

  // On mount: check existing session, else show home
  useEffect(() => {
    if (authAPI.isAuthenticated()) {
      const userData = getUserData();
      if (userData) { setUser(userData); setPage("app"); return; }
    }
    setPage("home"); // show home landing before login
  }, []);

  useEffect(() => {
    const h = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  const handleLogin = (userData) => {
    setUser(userData);
    setPage("app");
    setSidebarOpen(false);
    setActivePage("dashboard");
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await authAPI.logout(); } catch (e) { /* ignore */ }
    finally {
      setUser(null);
      setPage("home"); // go back to home after logout
      setSidebarOpen(false);
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [activePage, isMobile]);

  const s = getStyles(dark, isMobile, isTablet);

  // ── Loading splash ──
  if (page === "loading") {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16, animation: "spin 2s linear infinite" }}>🥛</div>
          <p style={{ color: "#64748b", fontWeight: 700, fontSize: 15 }}>Loading DairyFlow…</p>
        </div>
        <style>{'@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  // ── Home landing ──
  if (page === "home") {
    return <HomePage onLogin={() => setPage("login")} />;
  }

  // ── Login page ──
  if (page === "login") {
    return <LoginPage onLogin={handleLogin} dark={dark} onBack={() => setPage("home")} />;
  }

  // ── Main app ──
  const renderPage = () => {
    switch (activePage) {
      case "dashboard":    return <Dashboard dark={dark} />;
      case "distributors": return <DistributorsPage dark={dark} />;
      case "milk":         return <MilkCollectionPage dark={dark} />;
      case "clients":      return <ClientsPage dark={dark} />;
      case "sales":        return <SalesPage dark={dark} />;
      case "production":   return <ProductionPage dark={dark} />;
      case "payments":     return <PaymentsPage dark={dark} />;
      case "inventory":    return <InventoryPage dark={dark} />;
      case "analytics":    return <AnalyticsPage dark={dark} />;
      case "reports":      return <ReportsAnalyticsPage dark={dark} />;
      case "settings":     return <SettingsPage dark={dark} toggleDark={() => setDark(d => !d)} />;
      default:             return <Dashboard dark={dark} />;
    }
  };

  return (
    <div style={s.app}>
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 98, top: 64 }} />
      )}
      {(!isMobile || sidebarOpen) && (
        <Sidebar dark={dark} activePage={activePage} setActivePage={setActivePage}
          user={user} onLogout={handleLogout} loggingOut={loggingOut} isMobile={isMobile} />
      )}
      <div style={s.mainContent}>
        <Topbar dark={dark} toggleDark={() => setDark(d => !d)} activePage={activePage}
          user={user} isMobile={isMobile} sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout} loggingOut={loggingOut} />
        <div style={s.pageContent}>{renderPage()}</div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        tr:hover td { background: ${dark ? "rgba(255,255,255,0.02)" : "rgba(26,86,219,0.02)"}; }
        @media (max-width: 767px) { * { font-size: 14px; } }
      `}</style>
    </div>
  );
}
