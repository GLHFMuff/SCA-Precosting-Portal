// Frontend API Client for Cloth Precosting Backend

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const precostingApi = {
  // Check backend server status
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      if (!res.ok) throw new Error('API not ok');
      return await res.json();
    } catch {
      return null;
    }
  },

  // Get all precostings with optional filter / sort / search
  async getAll(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`${API_BASE}/precostings${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Populate PrecostingHeader table in database
  async populateHeader(items = null) {
    const res = await fetch(`${API_BASE}/precostings/populate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Get schema mapping metadata
  async getHeaderMapping() {
    const res = await fetch(`${API_BASE}/precostings/header-mapping`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Get single precosting by ID
  async getById(id) {
    const res = await fetch(`${API_BASE}/precostings/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Create new precosting
  async create(data) {
    const res = await fetch(`${API_BASE}/precostings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Update precosting
  async update(id, data) {
    const res = await fetch(`${API_BASE}/precostings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Delete precosting
  async delete(id) {
    const res = await fetch(`${API_BASE}/precostings/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Approve precosting
  async approve(id, notes = '', approverName = '') {
    const res = await fetch(`${API_BASE}/precostings/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, approverName }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Reject / Request Revision
  async reject(id, notes = '', reviewerName = '') {
    const res = await fetch(`${API_BASE}/precostings/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, reviewerName }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Add Remark
  async addRemark(id, { author, role, text }) {
    const res = await fetch(`${API_BASE}/precostings/${id}/remarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, role, text }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Get Dashboard KPI Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // Login
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login gagal');
    }
    return await res.json();
  },
};
