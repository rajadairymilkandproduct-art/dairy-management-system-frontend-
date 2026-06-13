/**
 * API Utility — Production Level
 * Centralized API calls with JWT auth, logout support, and error handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Token / User storage ──────────────────────────────────────────────────────
const getAuthToken   = () => { try { return JSON.parse(localStorage.getItem('authToken')); } catch { return null; } };
const setAuthToken   = (t) => localStorage.setItem('authToken', JSON.stringify(t));
const clearAuthToken = ()  => { localStorage.removeItem('authToken'); localStorage.removeItem('userData'); };

export const getUserData = () => { try { return JSON.parse(localStorage.getItem('userData')); } catch { return null; } };
export const setUserData = (d) => localStorage.setItem('userData', JSON.stringify(d));

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { headers, ...options });

  // Auto-logout on 401 (expired / blacklisted token)
  if (response.status === 401) {
    clearAuthToken();
    window.location.href = '/';
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let error;
    try { error = await response.json(); } catch { error = { message: `HTTP ${response.status}` }; }
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export const apiGet    = (ep, params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined))
  ).toString();
  return apiCall(qs ? `${ep}?${qs}` : ep, { method: 'GET' });
};
export const apiPost   = (ep, data) => apiCall(ep, { method: 'POST',   body: JSON.stringify(data) });
export const apiPatch  = (ep, data) => apiCall(ep, { method: 'PATCH',  body: JSON.stringify(data) });
export const apiDelete = (ep)       => apiCall(ep, { method: 'DELETE' });

// ─── PDF download helper ───────────────────────────────────────────────────────
export const downloadPDF = async (endpoint, filename) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to generate PDF');
  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  /** Login — stores token + user on success */
  login: async (email, password) => {
    const result = await apiPost('/auth/login', { email, password });
    if (result.success && result.data?.token) {
      setAuthToken(result.data.token);
      setUserData(result.data.user);
    }
    return result;
  },

  /** Register — creates account and stores token + user on success */
  register: async (name, email, password, role = 'Staff') => {
    const result = await apiPost('/auth/register', { name, email, password, role });
    if (result.success && result.data?.token) {
      setAuthToken(result.data.token);
      setUserData(result.data.user);
    }
    return result;
  },

  /** Logout — calls server to blacklist token, then clears local storage */
  logout: async () => {
    try {
      await apiPost('/auth/logout', {});
    } catch {
      // Even if server call fails, clear local session
    } finally {
      clearAuthToken();
    }
  },

  isAuthenticated: () => !!getAuthToken(),
  getMe:           () => apiGet('/auth/me'),
  changePassword:  (d) => apiPatch('/auth/change-password', d),
  getUsers:        () => apiGet('/auth/users'),
  createUser:      (d) => apiPost('/auth/users', d),
  updateUser:      (id, d) => apiPatch(`/auth/users/${id}`, d),
};

// ─── Distributors ──────────────────────────────────────────────────────────────
export const distributorAPI = {
  getAll:  (p = {}) => apiGet('/distributors', p),
  getById: (id)     => apiGet(`/distributors/${id}`),
  create:  (d)      => apiPost('/distributors', d),
  update:  (id, d)  => apiPatch(`/distributors/${id}`, d),
  delete:  (id)     => apiDelete(`/distributors/${id}`),
};

// ─── Milk Collections ──────────────────────────────────────────────────────────
export const milkCollectionAPI = {
  getAll:  (p = {}) => apiGet('/milk-collections', p),
  create:  (d)      => apiPost('/milk-collections', d),
  delete:  (id)     => apiDelete(`/milk-collections/${id}`),
  downloadReceipt: (id) => downloadPDF(`/receipts/collection/${id}`, `collection-${id}.pdf`),
};

// ─── Payments ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  getAll:   (p = {})     => apiGet('/payments', p),
  create:   (d)          => apiPost('/payments', d),
  markPaid: (id, d = {}) => apiPatch(`/payments/${id}/mark-paid`, d),
  delete:   (id)         => apiDelete(`/payments/${id}`),
  downloadReceipt: (id)  => downloadPDF(`/receipts/payment/${id}`, `payment-${id}.pdf`),
};

// ─── Expenses ──────────────────────────────────────────────────────────────────
export const expenseAPI = {
  getAll:  (p = {}) => apiGet('/expenses', p),
  create:  (d)      => apiPost('/expenses', d),
  update:  (id, d)  => apiPatch(`/expenses/${id}`, d),
  delete:  (id)     => apiDelete(`/expenses/${id}`),
};

// ─── Inventory ──────────────────────────────────────────────────────────────────
export const inventoryAPI = {
  getAll:  (p = {}) => apiGet('/inventory', p),
  getById: (id)     => apiGet(`/inventory/${id}`),
  create:  (d)      => apiPost('/inventory', d),
  update:  (id, d)  => apiPatch(`/inventory/${id}`, d),
  delete:  (id)     => apiDelete(`/inventory/${id}`),
};

// ─── Clients ──────────────────────────────────────────────────────────────────
// Supports full address fields: addressLine1, addressLine2, landmark,
// city, state, pincode (added alongside legacy `address` string).
export const clientAPI = {
  getAll:         (p = {}) => apiGet('/clients', p),
  getById:        (id)     => apiGet(`/clients/${id}`),
  getCredit:      (id)     => apiGet(`/clients/${id}/credit`),
  getStatement:   (id, p = {}) => apiGet(`/clients/${id}/statement`, p),
  create:         (d)      => apiPost('/clients', d),
  update:         (id, d)  => apiPatch(`/clients/${id}`, d),
  delete:         (id)     => apiDelete(`/clients/${id}`),
};

// ─── Sales ────────────────────────────────────────────────────────────────────
export const salesAPI = {
  getAll:      (p = {}) => apiGet('/sales', p),
  getById:     (id)     => apiGet(`/sales/${id}`),
  byClient:    (p = {}) => apiGet('/sales/by-client', p),
  byProduct:   (p = {}) => apiGet('/sales/by-product', p),
  create:      (d)      => apiPost('/sales', d),
  markPaid:    (id, d)  => apiPatch(`/sales/${id}/pay`, d),
  delete:      (id)     => apiDelete(`/sales/${id}`),
  downloadInvoice: (id, ref) => downloadPDF(`/receipts/sale/${id}`, `invoice-${ref || id}.pdf`),

  // ✅ NEW: Aggregated sales data for daily/weekly/monthly/yearly charts
  getAggregated: ({ startDate, endDate, groupBy }) =>
    apiGet('/sales/aggregated', { startDate, endDate, groupBy }),
};

// ─── Production ───────────────────────────────────────────────────────────────
export const productionAPI = {
  getAll:  (p = {}) => apiGet('/production', p),
  getById: (id)     => apiGet(`/production/${id}`),
  stats:   ()       => apiGet('/production/stats'),
  create:  (d)      => apiPost('/production', d),
  update:  (id, d)  => apiPatch(`/production/${id}`, d),
  delete:  (id)     => apiDelete(`/production/${id}`),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  dashboard:  ()       => apiGet('/analytics/dashboard'),
  monthly:    ()       => apiGet('/analytics/monthly'),
  daily:      ()       => apiGet('/analytics/daily'),
  profitLoss: (p = {}) => apiGet('/analytics/profit-loss', p),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsAPI = {
  downloadProfitLoss: (startDate, endDate) =>
    downloadPDF(`/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`, 'profit-loss-report.pdf'),
  downloadInventory: () => downloadPDF('/reports/inventory', 'inventory-report.pdf'),
  salesSummary: (p = {}) => apiGet('/reports/sales-summary', p),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:   () => apiGet('/notifications'),
  markRead: (id)  => apiPatch(`/notifications/${id}/read`, {}),
  markAllRead: () => apiPatch('/notifications/read-all', {}),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsAPI = {
  getBusinessSettings:    () => apiGet('/settings/business'),
  updateBusinessSettings: (d) => apiPatch('/settings/business', d),
  updateProductionLevel:  (d) => apiPatch('/settings/production-level', d),
  getUserProfile:         () => apiGet('/settings/profile'),
  changePassword:         (d) => apiPatch('/settings/change-password', d),
};

// Backward-compat exports
export { getAuthToken, setAuthToken, clearAuthToken };