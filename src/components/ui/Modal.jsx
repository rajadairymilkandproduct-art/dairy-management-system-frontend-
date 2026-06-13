import { useState, useEffect } from "react";
import { getStyles } from "../../styles/getStyles.js";

export default function Modal({ open, onClose, title, dark, children }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenWidth < 768;
  const s = getStyles(dark, isMobile);
  if (!open) return null;
  
  return (
    <div style={s.modal} onClick={onClose}>
      <div style={{ ...s.modalContent, maxWidth: isMobile ? "100%" : 520, width: isMobile ? "calc(100% - 16px)" : "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 700, wordBreak: "break-word" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: dark ? "#94a3b8" : "#64748b", flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ maxHeight: "calc(90vh - 80px)", overflowY: "auto", paddingRight: 6 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
