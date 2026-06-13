export const COLORS = {
  primary: "#1a56db",
  primaryLight: "#3b82f6",
  primaryDark: "#1e40af",
  accent: "#10b981",
  accentLight: "#34d399",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cream: "#fef9f0",
  milkWhite: "#f8fafc",
};

export const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { id: "dashboard", icon: "🏠", label: "Dashboard" },
      { id: "analytics", icon: "📊", label: "Analytics" },
      { id: "reports", icon: "📋", label: "Reports & Data" },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "distributors", icon: "👨‍🌾", label: "Distributors" },
      { id: "milk", icon: "🥛", label: "Milk Collection" },
      { id: "production", icon: "🏭", label: "Production" },
      { id: "inventory", icon: "📦", label: "Inventory" },
    ],
  },
  {
    label: "Sales & Clients",
    items: [
      { id: "clients", icon: "🏪", label: "Clients" },
      { id: "sales", icon: "💼", label: "Sales" },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "payments", icon: "💳", label: "Payments" },
      // { id: "profit", icon: "📈", label: "Profit & Loss" },
    ],
  },
  {
    label: "System",
    items: [{ id: "settings", icon: "⚙️", label: "Settings" }],
  },
];
