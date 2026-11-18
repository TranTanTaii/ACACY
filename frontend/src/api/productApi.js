const API_BASE = '/api';

export const productApi = {
  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Không thể tải danh sách sản phẩm');
    return res.json();
  },

  async getSuggestions(q, limit = 10) {
    if (!q || !q.trim()) return [];
    const res = await fetch(`${API_BASE}/products/suggest?q=${encodeURIComponent(q.trim())}&limit=${limit}`);
    if (!res.ok) return [];
    return res.json();
  },

  async batchLookup(codes = []) {
    if (!codes || codes.length === 0) return [];
    const res = await fetch(`${API_BASE}/products/batch-lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(codes)
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/products/stats`);
    if (!res.ok) throw new Error('Không thể tải số liệu thống kê');
    return res.json();
  },

  async getProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Không tìm thấy sản phẩm');
    return res.json();
  },

  async createProduct(data) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Lỗi khi tạo sản phẩm');
    }
    return res.json();
  },

  async updateProduct(id, data) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Lỗi khi cập nhật sản phẩm');
    }
    return res.json();
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Lỗi khi xóa sản phẩm');
    return res.json();
  },

  async uploadProductImage(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/products/${id}/image`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Lỗi khi upload hình ảnh');
    return res.json();
  },

  async removeProductImage(id) {
    const res = await fetch(`${API_BASE}/products/${id}/image`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Lỗi khi xóa hình ảnh');
    return res.json();
  },

  // Import
  async getWorkspaceFiles() {
    const res = await fetch(`${API_BASE}/import/workspace-files`);
    if (!res.ok) return [];
    return res.json();
  },

  async previewLocalFile(path) {
    const res = await fetch(`${API_BASE}/import/preview-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Lỗi khi đọc file Excel');
    }
    return res.json();
  },

  async uploadAndPreview(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/import/upload-and-preview`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Lỗi tải lên file');
    }
    return res.json();
  },

  async executeImport(payload) {
    const res = await fetch(`${API_BASE}/import/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Lỗi khi thực hiện import');
    }
    return res.json();
  }
};
