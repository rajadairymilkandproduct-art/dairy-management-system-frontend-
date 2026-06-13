import { useState, useEffect } from "react";
import { COLORS } from "../constants/index.js";
import { formatCurrency, formatNum } from "../utils/formatters.js";
import { getStyles } from "../styles/getStyles.js";
import { inventoryAPI } from "../utils/api.js";
import StatCard from "../components/ui/StatCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import Modal from "../components/ui/Modal.jsx";
import SearchBar from "../components/ui/SearchBar.jsx";

export default function InventoryPage({ dark }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const s = getStyles(dark, isMobile, isTablet);

  // Main inventory state
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Transaction state (local)
  const [transactions, setTransactions] = useState([]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransactionItem, setSelectedTransactionItem] = useState(null);
  const [transactionForm, setTransactionForm] = useState({
    type: "In",
    quantity: "",
    reason: "",
  });

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Form state
  const [form, setForm] = useState({
    item: "",
    category: "Raw Milk",
    quantity: "",
    capacity: "",
    unit: "L",
    minStock: "",
    price: "",
    expiry: "",
    location: "Cold Storage 1",
  });

  // Fetch inventory on mount
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const result = await inventoryAPI.getAll();
      setInventory(result.data || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      alert("Error loading inventory: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalLiters = inventory
    .filter((i) => i.unit === "L")
    .reduce((a, b) => a + b.quantity, 0);
  const totalValue = inventory.reduce(
    (a, b) => a + b.quantity * (b.price || 0),
    0
  );
  const alerts = inventory.filter((i) => i.status !== "Good").length;
  const categories = ["All", ...new Set(inventory.map((i) => i.category))];

  // Filtered inventory
  const filtered = inventory.filter(
    (item) =>
      (filterCategory === "All" || item.category === filterCategory) &&
      item.item.toLowerCase().includes(search.toLowerCase())
  );

  // Add or update item
  const handleSaveItem = async () => {
    if (!form.item || !form.quantity || !form.capacity || !form.expiry) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        item: form.item,
        category: form.category,
        quantity: Number(form.quantity),
        capacity: Number(form.capacity),
        unit: form.unit,
        minStock: Number(form.minStock),
        price: Number(form.price),
        expiry: form.expiry,
        location: form.location,
      };

      if (editingItem) {
        const result = await inventoryAPI.update(editingItem._id, payload);
        setInventory((prev) =>
          prev.map((i) => (i._id === editingItem._id ? result.data : i))
        );
        alert("✅ Item updated successfully!");
      } else {
        const result = await inventoryAPI.create(payload);
        setInventory((prev) => [result.data, ...prev]);
        alert("✅ Item added successfully!");
      }

      setShowAddModal(false);
      setEditingItem(null);
      setForm({
        item: "",
        category: "Raw Milk",
        quantity: "",
        capacity: "",
        unit: "L",
        minStock: "",
        price: "",
        expiry: "",
        location: "Cold Storage 1",
      });
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Add stock transaction — persists to backend, then updates local state
  const handleTransaction = async () => {
    if (!transactionForm.quantity || !transactionForm.reason) {
      alert("Please fill all fields");
      return;
    }

    const qty = Number(transactionForm.quantity);
    const currentItem = selectedTransactionItem;
    const newQty =
      transactionForm.type === "In"
        ? currentItem.quantity + qty
        : currentItem.quantity - qty;

    if (newQty < 0) {
      alert("❌ Cannot reduce stock below zero. Current stock: " + currentItem.quantity + " " + currentItem.unit);
      return;
    }

    try {
      setSubmitting(true);
      // Persist the new quantity to MongoDB (pre-save hook recalculates status)
      const result = await inventoryAPI.update(currentItem._id, { quantity: newQty });
      const updatedItem = result.data;

      // Replace item in local state with server response (has correct recalculated status)
      setInventory((prev) =>
        prev.map((i) => (i._id !== currentItem._id ? i : updatedItem))
      );

      setTransactions((prev) => [
        {
          id: Date.now(),
          itemId: currentItem._id,
          type: transactionForm.type,
          quantity: qty,
          date: new Date().toISOString().split("T")[0],
          reason: transactionForm.reason,
          createdBy: "Admin",
        },
        ...prev,
      ]);

      setShowTransactionModal(false);
      setTransactionForm({ type: "In", quantity: "", reason: "" });
      setSelectedTransactionItem(null);
    } catch (err) {
      alert("❌ Error updating stock: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id) => {
    if (confirm("Are you sure? This will remove the item from inventory.")) {
      try {
        await inventoryAPI.delete(id);
        setInventory((prev) => prev.filter((i) => i._id !== id));
        alert("✅ Item deleted successfully!");
      } catch (err) {
        alert("❌ Error deleting item: " + err.message);
      }
    }
  };

  // Open edit modal
  const handleEditItem = (item) => {
    setEditingItem(item);
    setForm({
      item: item.item,
      category: item.category,
      quantity: item.quantity,
      capacity: item.capacity,
      unit: item.unit,
      minStock: item.minStock,
      price: item.price,
      expiry: item.expiry,
      location: item.location,
    });
    setShowAddModal(true);
  };

  return (
    <div>
      {/* Stats Cards */}
      <div style={s.grid(4)}>
        <StatCard
          icon="🥛"
          label="Total Stock"
          value={`${totalLiters.toFixed(1)} L`}
          color={COLORS.primary}
          dark={dark}
        />
        <StatCard
          icon="💰"
          label="Stock Value"
          value={formatCurrency(totalValue)}
          color={COLORS.accent}
          dark={dark}
        />
        <StatCard
          icon="🚨"
          label="Stock Alerts"
          value={alerts}
          delta={alerts > 0 ? "Needs attention" : "All good"}
          positive={alerts === 0}
          color={COLORS.danger}
          dark={dark}
        />
        <StatCard
          icon="📦"
          label="Items Tracked"
          value={inventory.length}
          delta={`${filtered.length} visible`}
          color={COLORS.primary}
          dark={dark}
        />
      </div>

      {/* Inventory Table */}
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
              placeholder="Search items..."
              dark={dark}
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ ...s.select, width: 140 }}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setForm({
                item: "",
                category: "Raw Milk",
                quantity: "",
                capacity: "",
                unit: "L",
                minStock: "",
                price: "",
                expiry: "",
                location: "Cold Storage 1",
              });
              setShowAddModal(true);
            }}
            style={s.btn(COLORS.primary)}
            disabled={loading}
          >
            + Add Item
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: COLORS.primary }}>
            ⏳ Loading inventory...
          </div>
        )}

        {!loading && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {[
                      "Item",
                      "Category",
                      "Quantity",
                      "Capacity",
                      "Usage",
                      "Status",
                      "Price",
                      "Expiry",
                      "Actions",
                    ].map((h) => (
                      <th key={h} style={s.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const pct = Math.round(
                      (item.quantity / item.capacity) * 100
                    );
                    const barColor =
                      item.status === "Out of Stock" ||
                      item.status === "Critical"
                        ? COLORS.danger
                        : item.status === "Low"
                        ? COLORS.warning
                        : COLORS.accent;
                    return (
                      <tr key={item._id}>
                        <td style={{ ...s.td, fontWeight: 600 }}>
                          {item.item}
                        </td>
                        <td style={s.td}>
                          <span style={s.chip(COLORS.primary)}>
                            {item.category}
                          </span>
                        </td>
                        <td
                          style={{
                            ...s.td,
                            fontWeight: 700,
                            color: COLORS.primary,
                          }}
                        >
                          {item.quantity} {item.unit}
                        </td>
                        <td style={s.td}>
                          {item.capacity} {item.unit}
                        </td>
                        <td style={{ ...s.td, minWidth: 140 }}>
                          <div
                            style={{
                              height: 8,
                              background: dark
                                ? "rgba(255,255,255,0.06)"
                                : "#e2e8f0",
                              borderRadius: 4,
                              marginBottom: 3,
                            }}
                          >
                            <div
                              style={{
                                ...s.progressBar(pct, barColor),
                                height: "100%",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              color: barColor,
                              fontWeight: 600,
                            }}
                          >
                            {pct}%
                          </span>
                        </td>
                        <td style={s.td}>
                          <StatusBadge status={item.status} dark={dark} />
                        </td>
                        <td
                          style={{
                            ...s.td,
                            fontWeight: 600,
                            color: COLORS.accent,
                          }}
                        >
                          {item.price ? formatCurrency(item.price) : "N/A"}
                        </td>
                        <td
                          style={{
                            ...s.td,
                            fontSize: 12,
                            color:
                              item.status === "Out of Stock"
                                ? COLORS.danger
                                : "#94a3b8",
                          }}
                        >
                          {item.expiry}
                        </td>
                        <td style={s.td}>
                          <div
                            style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                          >
                            <button
                              onClick={() => {
                                setSelectedTransactionItem(item);
                                setTransactionForm({
                                  type: "In",
                                  quantity: "",
                                  reason: "",
                                });
                                setShowTransactionModal(true);
                              }}
                              style={{
                                ...s.btn(COLORS.accent, true),
                                padding: "4px 8px",
                                fontSize: 11,
                              }}
                              disabled={submitting}
                            >
                              ➕
                            </button>
                            <button
                              onClick={() => handleEditItem(item)}
                              style={{
                                ...s.btn(COLORS.primary, true),
                                padding: "4px 8px",
                                fontSize: 11,
                              }}
                              disabled={submitting}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item._id)}
                              style={{
                                ...s.btn(COLORS.danger, true),
                                padding: "4px 8px",
                                fontSize: 11,
                              }}
                              disabled={submitting}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div
                style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}
              >
                No items found
              </div>
            )}
          </>
        )}
      </div>

      {/* Stock Movement History */}
      {transactions.length > 0 && (
        <div style={s.card}>
          <SectionHeader title="Recent Stock Transactions" dark={dark} />
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Item", "Type", "Quantity", "Date", "Reason", "By"].map(
                    (h) => (
                      <th key={h} style={s.th}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((t) => {
                  const item = inventory.find((i) => i._id === t.itemId);
                  return (
                    <tr key={t.id}>
                      <td style={{ ...s.td, fontWeight: 600 }}>
                        {item?.item || "Unknown"}
                      </td>
                      <td style={s.td}>
                        <span
                          style={s.chip(
                            t.type === "In" ? COLORS.accent : COLORS.warning
                          )}
                        >
                          {t.type === "In" ? "📥 In" : "📤 Out"}
                        </span>
                      </td>
                      <td
                        style={{
                          ...s.td,
                          fontWeight: 700,
                          color:
                            t.type === "In" ? COLORS.accent : COLORS.warning,
                        }}
                      >
                        {t.type === "In" ? "+" : "-"}
                        {t.quantity} {item?.unit}
                      </td>
                      <td style={s.td}>{t.date}</td>
                      <td style={{ ...s.td, fontSize: 12, color: "#94a3b8" }}>
                        {t.reason}
                      </td>
                      <td style={s.td}>{t.createdBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
        }}
        title={editingItem ? "Edit Item" : "Add New Inventory Item"}
        dark={dark}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Item Name *</label>
            <input
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              style={s.input}
              placeholder="e.g., Pasteurized Milk"
              disabled={submitting}
            />
          </div>
          <div>
            <label style={s.label}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={s.select}
              disabled={submitting}
            >
              <option>Raw Milk</option>
              <option>Processed Milk</option>
              <option>Dairy Products</option>
              <option>Packaging</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Current Quantity *</label>
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
            <label style={s.label}>Capacity *</label>
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              style={s.input}
              placeholder="1000"
              disabled={submitting}
            />
          </div>
          <div>
            <label style={s.label}>Unit</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              style={s.select}
              disabled={submitting}
            >
              <option>L</option>
              <option>kg</option>
              <option>pcs</option>
            </select>
          </div>
          <div>
            <label style={s.label}>Min Stock (Alert)</label>
            <input
              type="number"
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              style={s.input}
              placeholder="100"
              disabled={submitting}
            />
          </div>
          <div>
            <label style={s.label}>Price per Unit (₹)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              style={s.input}
              placeholder="50"
              disabled={submitting}
            />
          </div>
          <div>
            <label style={s.label}>Expiry Date *</label>
            <input
              type="date"
              value={form.expiry}
              onChange={(e) => setForm({ ...form, expiry: e.target.value })}
              style={s.input}
              disabled={submitting}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={s.label}>Storage Location</label>
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              style={s.select}
              disabled={submitting}
            >
              <option>Cold Storage 1</option>
              <option>Cold Storage 2</option>
              <option>Dry Storage</option>
              <option>Processing Unit</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
            <button
              onClick={handleSaveItem}
              style={{ ...s.btn(COLORS.primary), flex: 1 }}
              disabled={submitting}
            >
              ✓ {editingItem ? "Update" : "Save"} Item
            </button>
            <button
              onClick={() => {
                setShowAddModal(false);
                setEditingItem(null);
              }}
              style={{ ...s.btn(COLORS.primary, true), flex: 1 }}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Stock Transaction Modal */}
      <Modal
        open={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTransactionItem(null);
        }}
        title={`${transactionForm.type} Stock — ${selectedTransactionItem?.item || ""}`}
        dark={dark}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={s.label}>Transaction Type</label>
              <select
                value={transactionForm.type}
                onChange={(e) =>
                  setTransactionForm({ ...transactionForm, type: e.target.value })
                }
                style={s.select}
              >
                <option>In</option>
                <option>Out</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Quantity</label>
              <input
                type="number"
                value={transactionForm.quantity}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    quantity: e.target.value,
                  })
                }
                style={s.input}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label style={s.label}>Reason</label>
            <select
              value={transactionForm.reason}
              onChange={(e) =>
                setTransactionForm({
                  ...transactionForm,
                  reason: e.target.value,
                })
              }
              style={s.select}
            >
              <option value="">Select reason...</option>
              <option>Fresh collection</option>
              <option>Processing usage</option>
              <option>Sale to customer</option>
              <option>Damaged/Spillage</option>
              <option>Quality check discard</option>
              <option>Transfer between storage</option>
              <option>Other</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleTransaction}
              style={{ ...s.btn(COLORS.primary), flex: 1 }}
            >
              ✓ Confirm Transaction
            </button>
            <button
              onClick={() => {
                setShowTransactionModal(false);
                setSelectedTransactionItem(null);
              }}
              style={{ ...s.btn(COLORS.primary, true), flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
