// Unwrap MongoDB Decimal128 / {value, raw} objects before converting to Number
const toNum = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "object") {
    if ("value" in v) return Number(v.value) || 0;
    if ("$numberDecimal" in v) return Number(v.$numberDecimal) || 0;
    return 0;
  }
  return Number(v) || 0;
};

export const formatCurrency = (n) => `₹${toNum(n).toLocaleString("en-IN")}`;
export const formatNum = (n) => toNum(n).toLocaleString("en-IN");
