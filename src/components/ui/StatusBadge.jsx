import { getStyles } from "../../styles/getStyles.js";

export default function StatusBadge({ status, dark }) {
  const s = getStyles(dark);
  const map = {
    Active: "#10b981",
    Inactive: "#ef4444",
    Paid: "#10b981",
    Pending: "#f59e0b",
    Good: "#10b981",
    Low: "#f59e0b",
    Critical: "#ef4444",
  };
  return <span style={s.badge2(map[status] || "#64748b")}>{status}</span>;
}
