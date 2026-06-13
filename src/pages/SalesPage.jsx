import { useState, useEffect } from "react";
import { COLORS } from "../constants/index.js";
import { formatCurrency } from "../utils/formatters.js";
import { getStyles } from "../styles/getStyles.js";
import { clientAPI, inventoryAPI, salesAPI } from "../utils/api.js";
import StatCard from "../components/ui/StatCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import SearchBar from "../components/ui/SearchBar.jsx";
import Modal from "../components/ui/Modal.jsx";

export default function SalesPage({ dark }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const s = getStyles(dark, isMobile, isTablet);

  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPayment, setFilterPayment] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    clientId: "",
    product: "",
    quantity: "",
    pricePerUnit: "",
    notes: "",
  });

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [clientRes, inventRes, salesRes] = await Promise.all([
        clientAPI.getAll(),
        inventoryAPI.getAll(),
        salesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setClients(clientRes.data || []);
      setInventory(inventRes.data || []);
      setSales(salesRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Error loading sales data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = sales.reduce((a, b) => a + (b.total || 0), 0);
  const totalPaid = sales
    .filter((s) => s.paymentStatus === "Paid")
    .reduce((a, b) => a + (b.total || 0), 0);
  const totalPending = sales
    .filter((s) => s.paymentStatus === "Pending")
    .reduce((a, b) => a + (b.total || 0), 0);

  const filtered = sales.filter(
    (s) =>
      (filterPayment === "All" || s.paymentStatus === filterPayment) &&
      (s.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        s.product?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddSale = async () => {
    if (!form.clientId || !form.product || !form.quantity || !form.pricePerUnit) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const client = clients.find((c) => c._id === form.clientId);
      const qty = Number(form.quantity);
      const price = Number(form.pricePerUnit);
      const total = qty * price;

      const result = await salesAPI.create({
        clientId: form.clientId,
        clientName: client?.name,
        product: form.product,
        quantity: qty,
        unit:
          form.product.includes("Packet") || form.product.includes("Sachet")
            ? "pcs"
            : form.product.includes("kg")
            ? "kg"
            : "L",
        pricePerUnit: price,
        total: total,
        paymentStatus: "Pending",
        notes: form.notes,
      });

      setSales((prev) => [result.data, ...prev]);
      setShowAddModal(false);
      setForm({
        clientId: "",
        product: "",
        quantity: "",
        pricePerUnit: "",
        notes: "",
      });
      alert("✅ Sale recorded successfully!");
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const markAsPaid = async (id) => {
    try {
      await salesAPI.markPaid(id, {});
      setSales((prev) =>
        prev.map((s) =>
          s._id === id ? { ...s, paymentStatus: "Paid" } : s
        )
      );
      alert("✅ Marked as paid!");
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  };

  return (
    <div>
      {/* Stats Cards */}
      <div style={s.grid(4)}>
        <StatCard
          icon="💼"
          label="Total Sales"
          value={formatCurrency(totalSales)}
          color={COLORS.accent}
          dark={dark}
        />
        <StatCard
          icon="✅"
          label="Paid Amount"
          value={formatCurrency(totalPaid)}
          color={COLORS.accent}
          dark={dark}
        />
        <StatCard
          icon="⏳"
          label="Pending Amount"
          value={formatCurrency(totalPending)}
          delta={
            sales.filter((s) => s.paymentStatus === "Pending").length +
            " invoices"
          }
          color={COLORS.warning}
          dark={dark}
        />
        <StatCard
          icon="📦"
          label="Total Transactions"
          value={sales.length}
          color={COLORS.primary}
          dark={dark}
        />
      </div>

      {/* Sales Table */}
      <div style={s.card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search sales..."
              dark={dark}
            />
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              style={{ ...s.select, width: 140 }}
            >
              <option>All</option>
              <option>Paid</option>
              <option>Pending</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={s.btn(COLORS.primary)}
            disabled={loading}
          >
            + Add Sale
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: COLORS.primary }}>
            ⏳ Loading sales...
          </div>
        )}

        {!loading && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {[
                      "Date",
                      "Client",
                      "Product",
                      "Quantity",
                      "Price/Unit",
                      "Total",
                      "Payment",
                      "Notes",
                      "Action",
                    ].map((h) => (
                      <th key={h} style={s.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sale) => (
                    <tr key={sale._id || sale.id}>
                      <td style={s.td}>{sale.date?.substring(0, 10) || "N/A"}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{sale.clientName}</td>
                      <td style={s.td}>
                        <span style={s.chip(COLORS.primary)}>{sale.product}</span>
                      </td>
                      <td style={{ ...s.td, fontWeight: 600 }}>
                        {sale.quantity} {sale.unit}
                      </td>
                      <td style={s.td}>{formatCurrency(sale.pricePerUnit)}</td>
                      <td style={{ ...s.td, fontWeight: 700, color: COLORS.accent }}>
                        {formatCurrency(sale.total)}
                      </td>
                      <td style={s.td}>
                        <StatusBadge status={sale.paymentStatus} dark={dark} />
                      </td>
                      <td style={{ ...s.td, fontSize: 12, color: "#94a3b8" }}>
                        {sale.notes || "-"}
                      </td>
                      <td style={s.td}>
                        {sale.paymentStatus === "Pending" ? (
                          <button
                            onClick={() => markAsPaid(sale._id || sale.id)}
                            style={{
                              ...s.btn(COLORS.accent),
                              padding: "4px 10px",
                              fontSize: 11,
                            }}
                            disabled={submitting}
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <button
                            style={{
                              ...s.btn(COLORS.primary, true),
                              padding: "4px 10px",
                              fontSize: 11,
                            }}
                          >
                            Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                No sales found
              </div>
            )}
          </>
        )}
      </div>

      {/* Sales by Client */}
      {!loading && clients.length > 0 && (
        <div style={s.card}>
          <SectionHeader title="Sales by Client (Last 7 Days)" dark={dark} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clients
              .filter((c) => c.status === "Active")
              .slice(0, 6)
              .map((client) => {
                const clientSales = sales
                  .filter(
                    (s) =>
                      s.clientId === client._id || s.clientId === client.id
                  )
                  .reduce((a, b) => a + (b.total || 0), 0);
                const clientCount = sales.filter(
                  (s) =>
                    s.clientId === client._id || s.clientId === client.id
                ).length;
                return (
                  <div
                    key={client._id || client.id}
                    style={{
                      padding: "12px 14px",
                      background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                      borderRadius: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {client.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        {clientCount} sales • {client.type}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: COLORS.accent,
                          fontSize: 14,
                        }}
                      >
                        {formatCurrency(clientSales)}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        Total sales
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Add Sale Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record New Sale"
        dark={dark}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Client *</label>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              style={s.select}
              disabled={submitting || loading}
            >
              <option value="">Select Client...</option>
              {clients
                .filter((c) => c.status === "Active")
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Product *</label>
            <select
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              style={s.select}
              disabled={submitting || loading}
            >
              <option value="">Select Product...</option>
              {inventory.map((i) => (
                <option key={i._id}>{i.item}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={s.label}>Quantity *</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              style={s.input}
              placeholder="0"
              disabled={submitting}
            />
          </div>
          <div>
            <label style={s.label}>Price per Unit (₹) *</label>
            <input
              type="number"
              value={form.pricePerUnit}
              onChange={(e) =>
                setForm({ ...form, pricePerUnit: e.target.value })
              }
              style={s.input}
              placeholder="0"
              disabled={submitting}
            />
          </div>
          {form.quantity && form.pricePerUnit && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "12px 16px",
                background: COLORS.accent + "10",
                borderRadius: 8,
                border: `1px solid ${COLORS.accent}20`,
              }}
            >
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                TOTAL SALE AMOUNT
              </div>
              <div
                style={{ fontSize: 22, fontWeight: 700, color: COLORS.accent }}
              >
                {formatCurrency(
                  Number(form.quantity) * Number(form.pricePerUnit)
                )}
              </div>
            </div>
          )}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={s.input}
              placeholder="Optional notes..."
              disabled={submitting}
            />
          </div>
          <div
            style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}
          >
            <button
              onClick={handleAddSale}
              style={{ ...s.btn(COLORS.primary), flex: 1 }}
              disabled={submitting}
            >
              ✓ Record Sale
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              style={{ ...s.btn(COLORS.primary, true), flex: 1 }}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
