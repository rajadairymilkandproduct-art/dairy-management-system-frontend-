import { getStyles } from "../../styles/getStyles.js";
import { COLORS } from "../../constants/index.js";

export default function SectionHeader({ title, dark, action }) {
  const s = getStyles(dark);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 4, height: 20, background: COLORS.primary, borderRadius: 4 }} />
        <h3 style={{ ...s.sectionTitle, margin: 0 }}>{title}</h3>
      </div>
      {action}
    </div>
  );
}
