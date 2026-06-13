import { getStyles } from "../../styles/getStyles.js";

export default function SearchBar({ value, onChange, placeholder, dark }) {
  const s = getStyles(dark);
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...s.input, paddingLeft: 36, width: 220 }}
      />
    </div>
  );
}
