import { useState, useEffect } from "react";
import { COLORS } from "../constants/index.js";
import { formatCurrency } from "../utils/formatters.js";
import { getStyles } from "../styles/getStyles.js";
import StatCard from "../components/ui/StatCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import SearchBar from "../components/ui/SearchBar.jsx";
import { milkCollectionAPI, distributorAPI } from "../utils/api.js";

// ─────────────────────────────────────────────────────────────────────────────
// TIRHUT DUGDH UTPADAK SAHKARI SANGH LTD. — Official Rate Table
// Effective: 24.04.2023  |  "Mishrit Doodh" (Mixed Milk)
//
// Structure: rateTable[fat_string][snf_string] = price_per_kg (₹)
// Fat range: 3.0 – 10.0 (step 0.1)
// SNF range: 8.0 – 9.0  (step 0.1)
// ─────────────────────────────────────────────────────────────────────────────
const RATE_TABLE = {
  // Fat 3.0
  "3.0": { "8.0": 32.00, "8.1": 32.26, "8.2": 32.51, "8.3": 32.77, "8.4": 33.02, "8.5": 33.28 },
  "3.1": { "8.0": 32.38, "8.1": 32.64, "8.2": 32.90, "8.3": 33.15, "8.4": 33.41, "8.5": 33.66 },
  "3.2": { "8.0": 32.77, "8.1": 33.02, "8.2": 33.28, "8.3": 33.54, "8.4": 33.79, "8.5": 34.05 },
  "3.3": { "8.0": 33.15, "8.1": 33.41, "8.2": 33.66, "8.3": 33.92, "8.4": 34.18, "8.5": 34.43 },
  "3.4": { "8.0": 33.54, "8.1": 33.79, "8.2": 34.05, "8.3": 34.30, "8.4": 34.56, "8.5": 34.82 },
  "3.5": { "8.0": 33.92, "8.1": 34.18, "8.2": 34.43, "8.3": 34.69, "8.4": 34.94, "8.5": 35.20 },
  "3.6": { "8.0": 34.30, "8.1": 34.56, "8.2": 34.82, "8.3": 35.07, "8.4": 35.33, "8.5": 35.58 },
  "3.7": { "8.0": 34.69, "8.1": 34.94, "8.2": 35.20, "8.3": 35.46, "8.4": 35.71, "8.5": 35.97 },
  "3.8": { "8.0": 35.07, "8.1": 35.33, "8.2": 35.58, "8.3": 35.84, "8.4": 36.10, "8.5": 36.35 },
  "3.9": { "8.0": 35.46, "8.1": 35.71, "8.2": 35.97, "8.3": 36.22, "8.4": 36.48, "8.5": 36.74 },
  "4.0": { "8.0": 35.84, "8.1": 36.10, "8.2": 36.35, "8.3": 36.61, "8.4": 36.86, "8.5": 37.12 },
  "4.1": { "8.0": 36.22, "8.1": 36.48, "8.2": 36.74, "8.3": 36.99, "8.4": 37.25, "8.5": 37.50 },
  "4.2": { "8.0": 36.61, "8.1": 36.86, "8.2": 37.12, "8.3": 37.38, "8.4": 37.63, "8.5": 37.89 },
  "4.3": { "8.0": 36.99, "8.1": 37.25, "8.2": 37.50, "8.3": 37.76, "8.4": 38.02, "8.5": 38.27 },
  "4.4": { "8.0": 37.38, "8.1": 37.63, "8.2": 37.89, "8.3": 38.14, "8.4": 38.40, "8.5": 38.66 },
  "4.5": { "8.0": 37.76, "8.1": 38.02, "8.2": 38.27, "8.3": 38.53, "8.4": 38.78, "8.5": 39.04 },
  "4.6": { "8.0": 38.14, "8.1": 38.40, "8.2": 38.66, "8.3": 38.91, "8.4": 39.17, "8.5": 39.42 },
  "4.7": { "8.0": 38.53, "8.1": 38.78, "8.2": 39.04, "8.3": 39.30, "8.4": 39.55, "8.5": 39.81 },
  "4.8": { "8.0": 38.91, "8.1": 39.17, "8.2": 39.42, "8.3": 39.68, "8.4": 39.94, "8.5": 40.19 },
  "4.9": { "8.0": 39.30, "8.1": 39.55, "8.2": 39.81, "8.3": 40.06, "8.4": 40.32, "8.5": 40.58 },
  "5.0": { "8.0": 39.68, "8.1": 39.94, "8.2": 40.19, "8.3": 40.45, "8.4": 40.70, "8.5": 40.96 },
  "5.1": { "8.0": 40.06, "8.1": 40.32, "8.2": 40.58, "8.3": 40.83, "8.4": 41.09, "8.5": 41.34 },
  "5.2": { "8.0": 40.45, "8.1": 40.70, "8.2": 40.96, "8.3": 41.22, "8.4": 41.47, "8.5": 41.73 },
  "5.3": { "8.0": 40.83, "8.1": 41.09, "8.2": 41.34, "8.3": 41.60, "8.4": 41.86, "8.5": 42.11 },
  "5.4": { "8.0": 41.22, "8.1": 41.47, "8.2": 41.73, "8.3": 41.98, "8.4": 42.24, "8.5": 42.50 },
  // Fat 5.5 – 7.9 (SNF 8.4 – 9.0)
  "5.5": { "8.4": 42.62, "8.5": 42.88, "8.6": 43.14, "8.7": 43.39, "8.8": 43.65, "9.0": 43.65 },
  "5.6": { "8.4": 43.01, "8.5": 43.26, "8.6": 43.52, "8.7": 43.78, "8.8": 44.03, "9.0": 44.03 },
  "5.7": { "8.4": 43.39, "8.5": 43.65, "8.6": 43.90, "8.7": 44.16, "8.8": 44.42, "9.0": 44.42 },
  "5.8": { "8.4": 43.78, "8.5": 44.03, "8.6": 44.29, "8.7": 44.54, "8.8": 44.80, "9.0": 44.80 },
  "5.9": { "8.4": 44.16, "8.5": 44.42, "8.6": 44.67, "8.7": 44.93, "8.8": 45.18, "9.0": 45.18 },
  "6.0": { "8.4": 44.23, "8.5": 44.46, "8.6": 44.69, "8.7": 44.92, "8.8": 45.14, "8.9": 45.37, "9.0": 45.60 },
  "6.1": { "8.4": 44.97, "8.5": 45.20, "8.6": 45.43, "8.7": 45.66, "8.8": 45.90, "8.9": 46.13, "9.0": 46.36 },
  "6.2": { "8.4": 45.71, "8.5": 45.94, "8.6": 46.18, "8.7": 46.41, "8.8": 46.65, "8.9": 46.88, "9.0": 47.12 },
  "6.3": { "8.4": 46.44, "8.5": 46.68, "8.6": 46.92, "8.7": 47.16, "8.8": 47.40, "8.9": 48.40, "9.0": 48.64 },
  "6.4": { "8.4": 47.18, "8.5": 48.17, "8.6": 47.42, "8.7": 47.67, "8.8": 47.91, "8.9": 49.15, "9.0": 49.40 },
  "6.5": { "8.4": 47.92, "8.5": 48.17, "8.6": 48.41, "8.7": 48.66, "8.8": 48.91, "8.9": 49.15, "9.0": 49.40 },
  "6.6": { "8.4": 48.66, "8.5": 48.91, "8.6": 49.16, "8.7": 49.41, "8.8": 49.66, "8.9": 49.91, "9.0": 50.16 },
  "6.7": { "8.4": 49.39, "8.5": 49.65, "8.6": 49.90, "8.7": 50.16, "8.8": 50.41, "8.9": 50.67, "9.0": 50.92 },
  "6.8": { "8.4": 50.13, "8.5": 50.39, "8.6": 50.65, "8.7": 50.90, "8.8": 51.16, "8.9": 51.42, "9.0": 51.68 },
  "6.9": { "8.4": 50.87, "8.5": 51.13, "8.6": 51.39, "8.7": 51.65, "8.8": 51.92, "8.9": 52.18, "9.0": 52.44 },
  "7.0": { "8.4": 51.60, "8.5": 51.87, "8.6": 52.14, "8.7": 52.40, "8.8": 52.67, "8.9": 52.93, "9.0": 53.20 },
  "7.1": { "8.4": 52.34, "8.5": 52.61, "8.6": 52.88, "8.7": 53.15, "8.8": 53.42, "8.9": 53.69, "9.0": 53.96 },
  "7.2": { "8.4": 53.08, "8.5": 53.35, "8.6": 53.63, "8.7": 53.90, "8.8": 54.17, "8.9": 54.45, "9.0": 54.72 },
  "7.3": { "8.4": 53.82, "8.5": 54.09, "8.6": 54.37, "8.7": 54.65, "8.8": 54.93, "8.9": 55.20, "9.0": 55.48 },
  "7.4": { "8.4": 54.55, "8.5": 54.83, "8.6": 55.12, "8.7": 55.40, "8.8": 55.68, "8.9": 55.96, "9.0": 56.24 },
  "7.5": { "8.4": 55.29, "8.5": 55.58, "8.6": 55.86, "8.7": 56.15, "8.8": 56.43, "8.9": 56.72, "9.0": 57.00 },
  "7.6": { "8.4": 56.03, "8.5": 56.32, "8.6": 56.60, "8.7": 56.89, "8.8": 57.18, "8.9": 57.47, "9.0": 57.76 },
  "7.7": { "8.4": 56.76, "8.5": 57.06, "8.6": 57.35, "8.7": 57.64, "8.8": 57.93, "8.9": 58.23, "9.0": 58.52 },
  "7.8": { "8.4": 57.50, "8.5": 57.80, "8.6": 58.09, "8.7": 58.39, "8.8": 58.69, "8.9": 58.98, "9.0": 59.28 },
  "7.9": { "8.4": 58.24, "8.5": 58.54, "8.6": 58.84, "8.7": 59.14, "8.8": 59.44, "8.9": 59.74, "9.0": 60.04 },
  // Fat 8.0 – 10.0 (SNF 8.4 – 9.0)
  "8.0": { "8.4": 58.98, "8.5": 59.28, "8.6": 59.58, "8.7": 59.89, "8.8": 60.19, "8.9": 60.50, "9.0": 60.80 },
  "8.1": { "8.4": 59.71, "8.5": 60.02, "8.6": 60.33, "8.7": 60.64, "8.8": 61.25, "8.9": 61.25, "9.0": 61.56 },
  "8.2": { "8.4": 60.45, "8.5": 60.76, "8.6": 61.07, "8.7": 61.39, "8.8": 61.70, "8.9": 62.01, "9.0": 62.32 },
  "8.3": { "8.4": 61.19, "8.5": 61.50, "8.6": 61.82, "8.7": 62.13, "8.8": 62.45, "8.9": 62.76, "9.0": 63.08 },
  "8.4": { "8.4": 61.92, "8.5": 62.24, "8.6": 62.56, "8.7": 62.88, "8.8": 63.20, "8.9": 63.52, "9.0": 63.84 },
  "8.5": { "8.4": 62.66, "8.5": 62.99, "8.6": 63.31, "8.7": 63.63, "8.8": 63.95, "8.9": 64.28, "9.0": 64.60 },
  "8.6": { "8.4": 63.40, "8.5": 63.73, "8.6": 64.05, "8.7": 64.38, "8.8": 64.71, "8.9": 65.03, "9.0": 65.36 },
  "8.7": { "8.4": 64.14, "8.5": 64.47, "8.6": 64.80, "8.7": 65.13, "8.8": 65.46, "8.9": 65.79, "9.0": 66.12 },
  "8.8": { "8.4": 64.87, "8.5": 65.21, "8.6": 65.54, "8.7": 65.88, "8.8": 66.21, "8.9": 66.55, "9.0": 66.88 },
  "8.9": { "8.4": 65.61, "8.5": 65.95, "8.6": 66.29, "8.7": 66.63, "8.8": 66.96, "8.9": 67.30, "9.0": 67.64 },
  "9.0": { "8.4": 66.35, "8.5": 66.69, "8.6": 67.03, "8.7": 67.37, "8.8": 67.72, "8.9": 68.06, "9.0": 68.40 },
  "9.1": { "8.4": 67.09, "8.5": 67.43, "8.6": 67.78, "8.7": 68.12, "8.8": 68.47, "8.9": 68.81, "9.0": 69.16 },
  "9.2": { "8.4": 67.82, "8.5": 68.17, "8.6": 68.52, "8.7": 68.87, "8.8": 69.22, "8.9": 69.57, "9.0": 69.92 },
  "9.3": { "8.4": 68.56, "8.5": 68.91, "8.6": 69.27, "8.7": 69.62, "8.8": 69.97, "8.9": 70.33, "9.0": 71.44 },
  "9.4": { "8.4": 69.30, "8.5": 69.65, "8.6": 70.01, "8.7": 70.37, "8.8": 71.12, "8.9": 71.48, "9.0": 72.20 },
  "9.5": { "8.4": 70.03, "8.5": 70.40, "8.6": 70.76, "8.7": 71.12, "8.8": 71.48, "8.9": 71.84, "9.0": 72.20 },
  "9.6": { "8.4": 70.77, "8.5": 71.14, "8.6": 71.50, "8.7": 71.87, "8.8": 72.23, "8.9": 72.60, "9.0": 72.96 },
  "9.7": { "8.4": 71.51, "8.5": 71.88, "8.6": 72.25, "8.7": 72.61, "8.8": 72.98, "8.9": 73.35, "9.0": 73.72 },
  "9.8": { "8.4": 72.25, "8.5": 72.62, "8.6": 72.99, "8.7": 73.36, "8.8": 73.74, "8.9": 74.11, "9.0": 75.24 },
  "9.9": { "8.4": 72.98, "8.5": 73.36, "8.6": 73.74, "8.7": 74.11, "8.8": 74.49, "8.9": 74.86, "9.0": 75.24 },
  "10.0": { "8.4": 73.72, "8.5": 74.10, "8.6": 74.48, "8.7": 74.86, "8.8": 75.24, "8.9": 75.62, "9.0": 76.00 },
};

// Default SNF per fat range (for auto-estimation when SNF is not entered)
const DEFAULT_SNF = {
  low: 8.5,   // fat < 5.5
  mid: 8.7,   // 5.5 <= fat < 8.0
  high: 8.9,  // fat >= 8.0
};

/**
 * Look up rate from the official Tirhut rate table.
 * Returns ₹ per kg (same as ₹ per litre for whole milk).
 */
function lookupRate(fat, snf) {
  const fatKey = (Math.round(fat * 10) / 10).toFixed(1);
  const snfKey = (Math.round(snf * 10) / 10).toFixed(1);

  const fatRow = RATE_TABLE[fatKey];
  if (!fatRow) return null;

  // Exact SNF hit
  if (fatRow[snfKey] !== undefined) return fatRow[snfKey];

  // Find nearest available SNF column
  const availSnfs = Object.keys(fatRow).map(Number).sort((a, b) => a - b);
  if (availSnfs.length === 0) return null;
  if (snf <= availSnfs[0]) return fatRow[availSnfs[0].toFixed(1)];
  if (snf >= availSnfs[availSnfs.length - 1]) return fatRow[availSnfs[availSnfs.length - 1].toFixed(1)];

  // Interpolate
  for (let i = 0; i < availSnfs.length - 1; i++) {
    if (snf >= availSnfs[i] && snf <= availSnfs[i + 1]) {
      const lo = fatRow[availSnfs[i].toFixed(1)];
      const hi = fatRow[availSnfs[i + 1].toFixed(1)];
      const t = (snf - availSnfs[i]) / (availSnfs[i + 1] - availSnfs[i]);
      return lo + t * (hi - lo);
    }
  }
  return null;
}

/**
 * Get the default SNF assumption for a given fat value.
 */
function getDefaultSnf(fat) {
  if (fat < 5.5) return DEFAULT_SNF.low;
  if (fat < 8.0) return DEFAULT_SNF.mid;
  return DEFAULT_SNF.high;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function MilkCollectionPage({ dark }) {
  const s = getStyles(dark);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [collections, setCollections] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [showRateChart, setShowRateChart] = useState(false);

  const [form, setForm] = useState({
    distributorId: "",
    date: new Date().toISOString().split("T")[0],
    shift: "Morning",
    cowType: "Cow",
    quantity: "",
    fat: "",
    snf: "",
    pricePerLiter: null,
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [collResult, distResult] = await Promise.all([
        milkCollectionAPI.getAll(),
        distributorAPI.getAll(),
      ]);
      setCollections(collResult.data || []);
      setDistributors(distResult.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Rate calculation ────────────────────────────────────────────────────────
  const calcPrice = (fat, snf) => {
    if (!fat || isNaN(fat)) return null;
    const fatNum = parseFloat(fat);
    const snfNum = snf && !isNaN(snf) ? parseFloat(snf) : getDefaultSnf(fatNum);
    const rate = lookupRate(fatNum, snfNum);
    return rate !== null ? parseFloat(rate.toFixed(2)) : null;
  };

  const handleFatChange = (val) => {
    const price = calcPrice(val, form.snf);
    setForm((prev) => ({ ...prev, fat: val, pricePerLiter: price }));
  };

  const handleSnfChange = (val) => {
    const price = calcPrice(form.fat, val);
    setForm((prev) => ({ ...prev, snf: val, pricePerLiter: price }));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.distributorId || !form.quantity || !form.fat) {
      alert("Please fill all required fields");
      return;
    }
    try {
      setSubmitting(true);
      const result = await milkCollectionAPI.create({
        distributorId: form.distributorId,
        date: form.date,
        shift: form.shift,
        cowType: form.cowType,
        quantity: Number(form.quantity),
        fat: Number(form.fat),
        snf: form.snf ? Number(form.snf) : getDefaultSnf(Number(form.fat)),
        pricePerLiter: form.pricePerLiter,
        status: "Pending",
      });
      setCollections((prev) => [result.data, ...prev]);
      setForm({
        distributorId: "",
        date: new Date().toISOString().split("T")[0],
        shift: "Morning",
        cowType: "Cow",
        quantity: "",
        fat: "",
        snf: "",
        pricePerLiter: null,
      });
      alert("✅ Collection added successfully!");
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = collections.filter(
    (c) =>
      c.date === filterDate &&
      (c.distributorName?.toLowerCase().includes(search.toLowerCase()) || search === "")
  );

  const todayTotal = filtered.reduce((a, b) => a + (b.quantity || 0), 0);
  const todayRevenue = filtered.reduce((a, b) => a + (b.total || 0), 0);
  const estimatedTotal = (form.quantity || 0) * (form.pricePerLiter || 0);

  // ── Rate Chart Modal ────────────────────────────────────────────────────────
  const RateChartModal = () => {
    const fatKeys = Object.keys(RATE_TABLE).map(Number).sort((a, b) => a - b);
    const snfCols = [8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 9.0];

    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
        onClick={() => setShowRateChart(false)}
      >
        <div
          style={{
            background: dark ? "#1e293b" : "#fff",
            borderRadius: 16, padding: 24,
            maxWidth: 900, width: "100%",
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: COLORS.primary, textTransform: "uppercase", marginBottom: 4 }}>
                तिरहुत दुग्ध उत्पादक सहकारी संघ लि.
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: dark ? "#f1f5f9" : "#0f172a" }}>
                दुग्ध उत्पादक मूल्य तालिका
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                प्रभावी तिथि: 24.04.2023 • मिश्रित दूध (₹ per kg)
              </div>
            </div>
            <button
              onClick={() => setShowRateChart(false)}
              style={{
                background: "none", border: "none", fontSize: 22,
                cursor: "pointer", color: "#94a3b8", padding: "4px 8px",
              }}
            >✕</button>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 11, width: "max-content" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle(dark), minWidth: 52, background: COLORS.primary, color: "#fff" }}>
                    Fat %
                  </th>
                  {snfCols.map((snf) => (
                    <th key={snf} style={{ ...thStyle(dark), background: dark ? "#334155" : "#e2e8f0", minWidth: 52 }}>
                      SNF {snf.toFixed(1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fatKeys.map((fat, i) => {
                  const fatKey = fat.toFixed(1);
                  const row = RATE_TABLE[fatKey];
                  return (
                    <tr key={fatKey} style={{ background: i % 2 === 0 ? (dark ? "#1e293b" : "#f8fafc") : (dark ? "#263044" : "#fff") }}>
                      <td style={{ ...tdStyle(dark), fontWeight: 700, color: COLORS.primary, textAlign: "center" }}>
                        {fatKey}
                      </td>
                      {snfCols.map((snf) => {
                        const snfKey = snf.toFixed(1);
                        const val = row ? row[snfKey] : null;
                        return (
                          <td key={snfKey} style={{ ...tdStyle(dark), textAlign: "center", color: val ? (dark ? "#e2e8f0" : "#1e293b") : "#94a3b8" }}>
                            {val !== undefined && val !== null ? val.toFixed(2) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8" }}>
            * Fat 3.0–5.4%: SNF base 8.0–8.5 (Double Excess)&nbsp;&nbsp;
            * Fat 5.5–5.9%: SNF base 8.4–8.8 (Double Excess)&nbsp;&nbsp;
            * Fat 6.0+: SNF 8.4–9.0 (Single Excess)
          </div>
        </div>
      </div>
    );
  };

  const thStyle = (dark) => ({
    padding: "6px 8px", border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
    fontWeight: 700, whiteSpace: "nowrap",
  });
  const tdStyle = (dark) => ({
    padding: "4px 8px", border: `1px solid ${dark ? "#334155" : "#f1f5f9"}`,
    whiteSpace: "nowrap",
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {showRateChart && <RateChartModal />}

      {/* Stat Cards */}
      <div style={s.grid(4)}>
        <StatCard icon="🥛" label="Day Collection" value={`${todayTotal.toFixed(1)} L`} color={COLORS.primary} dark={dark} />
        <StatCard icon="💰" label="Day Revenue" value={formatCurrency(todayRevenue)} color={COLORS.accent} dark={dark} />
        <StatCard icon="🌅" label="Morning" value={filtered.filter((m) => m.shift === "Morning").length} color={COLORS.warning} dark={dark} />
        <StatCard icon="🌙" label="Evening" value={filtered.filter((m) => m.shift === "Evening").length} color={COLORS.purple} dark={dark} />
      </div>

      <div style={s.grid(isMobile ? 1 : 2)}>
        {/* ── New Entry Form ── */}
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SectionHeader title="New Milk Entry" dark={dark} />
            <button
              onClick={() => setShowRateChart(true)}
              style={{
                background: COLORS.primary + "18",
                color: COLORS.primary,
                border: `1px solid ${COLORS.primary}40`,
                borderRadius: 8, padding: "5px 12px",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              📋 Rate Chart
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Distributor */}
            <div>
              <label style={s.label}>Distributor</label>
              <select
                value={form.distributorId}
                onChange={(e) => setForm({ ...form, distributorId: e.target.value })}
                style={s.select}
                disabled={submitting || loading}
              >
                <option value="">Select Distributor</option>
                {distributors.map((d) => (
                  <option key={d._id} value={d._id}>{d.name} ({d.village})</option>
                ))}
              </select>
            </div>

            {/* Date & Shift */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={s.label}>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={s.input} disabled={submitting} />
              </div>
              <div>
                <label style={s.label}>Shift</label>
                <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} style={s.select} disabled={submitting}>
                  <option>Morning</option>
                  <option>Evening</option>
                </select>
              </div>
            </div>

            {/* Cow Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={s.label}>Cow Type</label>
                <select value={form.cowType} onChange={(e) => setForm({ ...form, cowType: e.target.value })} style={s.select} disabled={submitting}>
                  <option value="Cow">🐄 Cow</option>
                  <option value="Buffalo">🐃 Buffalo</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Quantity (L)</label>
                <input
                  type="number" value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  style={s.input} placeholder="45" disabled={submitting}
                />
              </div>
            </div>

            {/* Fat & SNF */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={s.label}>Fat %</label>
                <input
                  type="number" value={form.fat}
                  onChange={(e) => handleFatChange(e.target.value)}
                  style={s.input} placeholder="3.8" step="0.1" disabled={submitting}
                />
              </div>
              <div>
                <label style={s.label}>
                  SNF %
                  <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>(optional)</span>
                </label>
                <input
                  type="number" value={form.snf}
                  onChange={(e) => handleSnfChange(e.target.value)}
                  style={s.input} placeholder="8.5" step="0.1" disabled={submitting}
                />
              </div>
            </div>

            {/* Rate Preview */}
            {form.fat && (
              <div style={{ background: dark ? "#0f172a" : "#f1f5f9", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
                  Rate Preview — Tirhut Official Rates (24.04.2023)
                  {!form.snf && <span style={{ color: COLORS.warning, marginLeft: 6 }}>★ using default SNF {getDefaultSnf(Number(form.fat)).toFixed(1)}</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div style={{ padding: "10px 12px", background: COLORS.primary + "20", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Rate / kg</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.primary }}>
                      {form.pricePerLiter ? `₹${form.pricePerLiter.toFixed(2)}` : "—"}
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", background: COLORS.accent + "20", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Total Est.</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.accent }}>
                      {form.pricePerLiter && form.quantity ? formatCurrency(estimatedTotal) : "—"}
                    </div>
                  </div>
                  <div style={{ padding: "10px 12px", background: dark ? "#1e293b" : "#e2e8f0", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Fat / SNF</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: dark ? "#f1f5f9" : "#1e293b" }}>
                      {form.fat || "—"} / {form.snf || getDefaultSnf(Number(form.fat)).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button onClick={handleAdd} style={s.btn(COLORS.primary)} disabled={submitting || loading}>
              {submitting ? "Adding..." : "➕ Add Entry"}
            </button>
          </div>
        </div>

        {/* ── Filter & Summary ── */}
        <div style={s.card}>
          <SectionHeader title="Filter & Search" dark={dark} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={s.label}>Date</label>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={s.input} />
            </div>
            <SearchBar value={search} onChange={setSearch} placeholder="Search distributor..." dark={dark} />
            <div style={{ padding: 12, background: dark ? "#1e293b" : "#f8fafc", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Total for {filterDate}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary, marginTop: 4 }}>{todayTotal.toFixed(1)} L</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.accent, marginTop: 4 }}>{formatCurrency(todayRevenue)}</div>
            </div>

            {/* Quick rate lookup */}
            <div style={{ padding: 12, background: dark ? "#1e293b" : "#f8fafc", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Quick Rate Lookup
              </div>
              <QuickRateLookup dark={dark} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Collections Table ── */}
      <div style={s.card}>
        <SectionHeader title="Today's Collections" dark={dark} />
        {loading && <div style={{ textAlign: "center", padding: 40 }}>⏳ Loading...</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>No collections for this date</div>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Distributor", "Shift", "Cow Type", "Qty (L)", "Fat %", "SNF %", "Rate/kg", "Total", "Status"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m._id}>
                    <td style={{ ...s.td, fontWeight: 600 }}>{m.distributorName}</td>
                    <td style={s.td}>
                      <span style={s.chip(m.shift === "Morning" ? COLORS.warning : COLORS.purple)}>
                        {m.shift === "Morning" ? "🌅" : "🌙"} {m.shift}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.chip(m.cowType === "Cow" ? COLORS.accent : COLORS.purple)}>
                        {m.cowType === "Cow" ? "🐄" : "🐃"} {m.cowType}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontWeight: 700, color: COLORS.primary }}>{m.quantity}</td>
                    <td style={s.td}>{m.fat}%</td>
                    <td style={s.td}>{m.snf ? `${m.snf}%` : "—"}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>₹{m.pricePerLiter?.toFixed(2) || "—"}</td>
                    <td style={{ ...s.td, fontWeight: 700, color: COLORS.accent }}>{formatCurrency(m.total)}</td>
                    <td style={s.td}><StatusBadge status={m.status} dark={dark} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quick Rate Lookup sub-component ─────────────────────────────────────────
function QuickRateLookup({ dark }) {
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState("");
  const rate = fat ? (() => {
    const f = parseFloat(fat), s = snf ? parseFloat(snf) : getDefaultSnf(parseFloat(fat));
    return lookupRate(f, s);
  })() : null;

  const inputStyle = {
    width: "100%", padding: "7px 10px", borderRadius: 6, fontSize: 13,
    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
    background: dark ? "#0f172a" : "#fff",
    color: dark ? "#f1f5f9" : "#1e293b",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>Fat %</div>
          <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} style={inputStyle} placeholder="4.5" step="0.1" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>SNF % (opt.)</div>
          <input type="number" value={snf} onChange={(e) => setSnf(e.target.value)} style={inputStyle} placeholder="8.5" step="0.1" />
        </div>
      </div>
      {rate !== null && (
        <div style={{ padding: "8px 12px", background: "#10b98118", borderRadius: 8, textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>Rate: </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>₹{rate.toFixed(2)}</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}> /kg</span>
          {!snf && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 2 }}>Using default SNF {getDefaultSnf(parseFloat(fat)).toFixed(1)}</div>}
        </div>
      )}
    </div>
  );
}
