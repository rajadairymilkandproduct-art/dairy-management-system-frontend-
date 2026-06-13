/**
 * HomePage — Landing page shown before login
 * Professional dairy management SaaS landing page
 */
import { useState, useEffect } from "react";
import { COLORS } from "../constants/index.js";

export default function HomePage({ onLogin }) {
  const [scrolled, setScrolled] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    const onResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(f => (f + 1) % 6), 3000);
    return () => clearInterval(t);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  const features = [
    { icon: "🥛", title: "Milk Collection", desc: "Real-time entries with fat-based auto-pricing for morning & evening shifts. Supports all breeds.", color: "#3b82f6" },
    { icon: "👨‍🌾", title: "Distributor Management", desc: "Manage all farmer/distributor profiles, payment history, and milk supply records.", color: "#10b981" },
    { icon: "💳", title: "Payment System", desc: "Track payments via UPI, Cash or Bank Transfer. Generate instant PDF receipts.", color: "#8b5cf6" },
    { icon: "📊", title: "Analytics & Reports", desc: "Visual dashboards with profit/loss, collection trends, and monthly comparisons.", color: "#f59e0b" },
    { icon: "🏪", title: "Inventory Control", desc: "Monitor cold storage, expiry alerts, stock levels, and product tracking.", color: "#ef4444" },
    { icon: "🏪", title: "Client Sales", desc: "Manage retail clients, track credit, generate invoices, and manage outstanding dues.", color: "#06b6d4" },
  ];

  const stats = [
    ["500+", "Dairy Centers"],
    ["50K+", "Distributors"],
    ["₹10Cr+", "Processed"],
    ["99.9%", "Uptime"],
  ];

  const testimonials = [
    { name: "Rajesh Gupta", role: "Dairy Owner, MP", text: "DairyFlow doubled our efficiency. Payments are now tracked perfectly!", avatar: "R", color: "#3b82f6" },
    { name: "Anita Patel", role: "Manager, Gujarat", text: "The fat-based pricing system is exactly what we needed. Brilliant tool!", avatar: "A", color: "#10b981" },
    { name: "Sunil Verma", role: "Cooperative, UP", text: "Every distributor payment is now transparent and on time.", avatar: "S", color: "#8b5cf6" },
  ];

  const btnPrimary = { padding: isMobile ? "12px 20px" : "14px 32px", background: COLORS.primary,
    color: "#fff", border: "none", borderRadius: 12, fontSize: isMobile ? 14 : 16,
    fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(26,86,219,0.35)",
    minHeight: isMobile ? 44 : "auto", width: isMobile ? "100%" : "auto" };
  const btnOutline = { ...btnPrimary, background: "#fff", color: COLORS.primary,
    border: `2px solid ${COLORS.primary}`, boxShadow: "none" };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f0f6ff", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html,body { width:100%; overflow-x:hidden; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, transition: "all 0.3s",
        background: scrolled ? "rgba(255,255,255,0.96)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
        padding: isMobile ? "12px 16px" : isTablet ? "14px 32px" : "14px 64px",
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, background: COLORS.primary, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🥛</div>
          <span style={{ fontWeight: 900, fontSize: isMobile ? 18 : 20, color: "#1a56db", letterSpacing: "-0.5px" }}>DairyFlow</span>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", gap: 32, fontSize: 14, fontWeight: 500 }}>
            {["Features", "Analytics", "Pricing", "Contact"].map(t => (
              <a key={t} href={`#${t.toLowerCase()}`} style={{ color: "#334155", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = COLORS.primary}
                onMouseLeave={e => e.target.style.color = "#334155"}>{t}</a>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          {!isMobile && (
            <button onClick={onLogin} style={{ padding: "10px 20px", background: "none", color: COLORS.primary,
              border: `1.5px solid ${COLORS.primary}`, borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Sign In
            </button>
          )}
          <button onClick={onLogin} style={{ padding: isMobile ? "10px 18px" : "10px 22px",
            background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(26,86,219,0.35)" }}>
            {isMobile ? "Launch" : "Start Free →"}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: isMobile ? "50px 20px 40px" : isTablet ? "70px 40px 60px" : "90px 64px 70px",
        textAlign: "center", background: "linear-gradient(135deg, #eef2ff 0%, #e0f2fe 50%, #f0fdf4 100%)",
        animation: "fadeInUp 0.6s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px",
          background: "#dbeafe", borderRadius: 20, marginBottom: isMobile ? 16 : 24 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", animation: "pulse 2s infinite", display: "inline-block" }} />
          <span style={{ color: "#1a56db", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>🆕 COMPLETE DAIRY ERP SYSTEM</span>
        </div>
        <h1 style={{ fontSize: isMobile ? 36 : isTablet ? 48 : 64, fontWeight: 900, color: "#0f172a",
          lineHeight: 1.08, margin: "0 auto 20px", maxWidth: 820, letterSpacing: "-1px" }}>
          Manage Your Dairy Business{" "}
          <span style={{ color: COLORS.primary, backgroundImage: "linear-gradient(135deg,#1a56db,#7c3aed)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Digitally</span>
        </h1>
        <p style={{ fontSize: isMobile ? 15 : isTablet ? 17 : 19, color: "#475569",
          maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
          DairyFlow helps village dairy owners digitize milk collection, manage distributors, track payments, monitor inventory and grow business — all from one powerful dashboard.
        </p>
        <div style={{ display: "flex", gap: isMobile ? 10 : 14, justifyContent: "center",
          flexDirection: isMobile ? "column" : "row", maxWidth: isMobile ? 300 : "none", margin: "0 auto" }}>
          <button onClick={onLogin} style={btnPrimary}>🚀 Start Free Trial</button>
          <button style={btnOutline}>▶ Watch Demo</button>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: isMobile ? 24 : 48, justifyContent: "center",
          marginTop: isMobile ? 36 : 56, flexWrap: "wrap" }}>
          {stats.map(([v, l]) => (
            <div key={l} style={{ textAlign: "center", animation: "fadeInUp 0.8s ease" }}>
              <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 900, color: COLORS.primary }}>{v}</div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: "#64748b", fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: isMobile ? "50px 20px" : isTablet ? "70px 40px" : "90px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 32 : 48 }}>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
            Everything Your Dairy Needs
          </h2>
          <p style={{ color: "#64748b", fontSize: isMobile ? 14 : 16, maxWidth: 480, margin: "0 auto" }}>
            From milk collection to payments to analytics — fully connected with your MongoDB backend.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(3,1fr)", gap: 20 }}>
          {features.map((f, i) => (
            <div key={i}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 50px ${f.color}30`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              style={{ background: "#fff", borderRadius: 20, padding: isMobile ? 20 : 28,
                border: `1.5px solid ${activeFeature === i ? f.color : "#e2e8f0"}`,
                transition: "all 0.3s", cursor: "default" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 17, color: "#1e293b", marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANALYTICS PREVIEW ── */}
      <section id="analytics" style={{ padding: isMobile ? "40px 20px" : "70px 64px",
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: isMobile ? 24 : 34, fontWeight: 900, color: "#f1f5f9", marginBottom: 12 }}>
            Real-Time Analytics Dashboard
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
            Beautiful charts, live data from MongoDB, and PDF reports — all in one place.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 14, maxWidth: 900, margin: "0 auto" }}>
          {[
            { icon: "📈", label: "Revenue Tracking", val: "₹2.4L", sub: "This month" },
            { icon: "🥛", label: "Daily Collection", val: "1,240L", sub: "Today" },
            { icon: "💳", label: "Payments Cleared", val: "₹89K", sub: "This week" },
            { icon: "📊", label: "Profit Margin", val: "28.4%", sub: "Monthly" },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 16,
              padding: isMobile ? 16 : 24, border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: "#f1f5f9", marginBottom: 4 }}>{item.val}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: isMobile ? "50px 20px" : "70px 64px", background: "#fff" }}>
        <h2 style={{ textAlign: "center", fontSize: isMobile ? 24 : 34, fontWeight: 900, color: "#0f172a", marginBottom: 40 }}>
          Trusted by Dairy Owners Across India
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20, maxWidth: 900, margin: "0 auto" }}>
          {testimonials.map(t => (
            <div key={t.name} style={{ background: "#f8fafc", borderRadius: 20, padding: 28,
              border: "1.5px solid #e2e8f0" }}>
              <div style={{ fontSize: 28, color: "#fbbf24", marginBottom: 12 }}>★★★★★</div>
              <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: 16 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>{t.name}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: isMobile ? "50px 20px" : "70px 64px", background: "#f0f6ff" }}>
        <h2 style={{ textAlign: "center", fontSize: isMobile ? 24 : 34, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
          Simple, Transparent Pricing
        </h2>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: 15, marginBottom: 40 }}>Start free. Scale as you grow.</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20, maxWidth: 860, margin: "0 auto" }}>
          {[
            { name: "Starter", price: "Free", desc: "Perfect for small dairies", features: ["Up to 100L/day", "10 Distributors", "20 Clients", "Basic Reports"], color: "#64748b", highlight: false },
            { name: "Growing", price: "₹999/mo", desc: "For expanding operations", features: ["Up to 500L/day", "50 Distributors", "100 Clients", "Advanced Analytics", "PDF Reports"], color: COLORS.primary, highlight: true },
            { name: "Enterprise", price: "Custom", desc: "Unlimited everything", features: ["Unlimited Liters", "Unlimited Users", "API Access", "Dedicated Support", "Custom Analytics"], color: "#8b5cf6", highlight: false },
          ].map(p => (
            <div key={p.name} style={{ background: p.highlight ? COLORS.primary : "#fff",
              borderRadius: 20, padding: 28, border: `2px solid ${p.highlight ? COLORS.primary : "#e2e8f0"}`,
              transform: p.highlight ? "scale(1.04)" : "none", boxShadow: p.highlight ? "0 20px 50px rgba(26,86,219,0.3)" : "none" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.highlight ? "rgba(255,255,255,0.8)" : "#64748b", marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: p.highlight ? "#fff" : "#1e293b", marginBottom: 4 }}>{p.price}</div>
              <div style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.7)" : "#64748b", marginBottom: 20 }}>{p.desc}</div>
              {p.features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ color: p.highlight ? "#86efac" : COLORS.accent, fontSize: 14 }}>✓</span>
                  <span style={{ color: p.highlight ? "rgba(255,255,255,0.9)" : "#475569", fontSize: 13 }}>{f}</span>
                </div>
              ))}
              <button onClick={onLogin}
                style={{ width: "100%", marginTop: 20, padding: "12px 0", borderRadius: 12,
                  background: p.highlight ? "#fff" : COLORS.primary,
                  color: p.highlight ? COLORS.primary : "#fff",
                  border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Get Started →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: isMobile ? "50px 20px" : "80px 64px",
        background: "linear-gradient(135deg,#1a56db,#7c3aed)", textAlign: "center" }}>
        <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 900, color: "#fff", marginBottom: 16 }}>
          Ready to Digitize Your Dairy?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
          Join hundreds of dairy owners managing millions of liters with DairyFlow.
        </p>
        <button onClick={onLogin} style={{ padding: "16px 40px", background: "#fff", color: COLORS.primary,
          border: "none", borderRadius: 14, fontWeight: 900, fontSize: 18, cursor: "pointer",
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
          🚀 Launch DairyFlow Free
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer id="contact" style={{ background: "#0f172a", padding: isMobile ? "30px 20px" : "40px 64px",
        textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, background: COLORS.primary, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🥛</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9" }}>DairyFlow</span>
        </div>
        <p style={{ color: "#64748b", fontSize: 13 }}>© 2025 DairyFlow. Built for Indian Dairy Entrepreneurs.</p>
        <div style={{ marginTop: 12, display: "flex", gap: 20, justifyContent: "center" }}>
          {["Privacy Policy","Terms of Service","Contact Us"].map(l => (
            <a key={l} href="#" style={{ color: "#475569", fontSize: 12, textDecoration: "none" }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
