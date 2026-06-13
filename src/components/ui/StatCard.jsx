import { getStyles } from "../../styles/getStyles.js";

// Safely converts API values (including MongoDB Decimal128 objects like {value, raw})
// into a renderable string/number for React
const safeVal = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    // Handle MongoDB Decimal128 or similar {value, raw} shapes
    if ("value" in v) return String(v.value);
    if ("$numberDecimal" in v) return String(v.$numberDecimal);
    return String(v);
  }
  return v;
};

export default function StatCard({ icon, label, value, delta, positive, color, dark }) {
  const s = getStyles(dark);
  return (
    <div style={s.statCard(color)}>
      <div style={{ position: "absolute", right: -10, top: -10, width: 80, height: 80, borderRadius: "50%", background: color + "08" }} />
      <div style={s.statIcon(color)}>{icon}</div>
      <div style={s.statLabel}>{label}</div>
      <div style={s.statValue}>{safeVal(value)}</div>
      {delta && <div style={s.statDelta(positive)}>{positive ? "▲" : "▼"} {delta}</div>}
    </div>
  );
}
