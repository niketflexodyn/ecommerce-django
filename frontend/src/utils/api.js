const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const { isFormData, ...rest } = options;
  const config = {
    ...rest,
    headers: {
      ...getAuthHeaders(),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...rest.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const error = new Error('Request failed');
    try {
      error.data = await response.json();
    } catch {
      error.data = { detail: response.statusText };
    }
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

// -------------------------
// Products (Public — all products for storefront)
// -------------------------

export const productApi = {
  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/products/${query ? '?' + query : ''}`);
  },
  get(id) {
    return request(`/products/${id}/`);
  },
};

// -------------------------
// Admin Products (scoped to created_by)
// -------------------------

export const adminProductApi = {
  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/products/${query ? '?' + query : ''}`);
  },
  create(data) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });
    return request('/products/create/', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },
  update(id, data) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });
    return request(`/products/${id}/update/`, {
      method: 'PUT',
      body: formData,
      isFormData: true,
    });
  },
  delete(id) {
    return request(`/products/${id}/delete/`, {
      method: 'DELETE',
    });
  },
};

// -------------------------
// Categories (Public — all categories for storefront)
// -------------------------

export const categoryApi = {
  list() {
    return request('/categories/');
  },
};

// -------------------------
// Admin Categories (scoped to created_by)
// -------------------------

export const adminCategoryApi = {
  list() {
    return request('/admin/categories/');
  },
  create(data) {
    return request('/categories/create/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id, data) {
    return request(`/categories/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete(id) {
    return request(`/categories/${id}/delete/`, {
      method: 'DELETE',
    });
  },
};

// -------------------------
// Checkout (Customer)
// -------------------------

export const checkoutApi = {
  place(data) {
    return request('/checkout/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// -------------------------
// Order History (Customer)
// -------------------------

export const orderApi = {
  mine() {
    return request('/orders/mine/');
  },
  mineDetail(id) {
    return request(`/orders/mine/${id}/`);
  },
  // Admin
  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/orders/${query ? '?' + query : ''}`);
  },
  get(id) {
    return request(`/orders/${id}/`);
  },
};

// -------------------------
// Dashboard (Admin)
// -------------------------

export const dashboardApi = {
  stats() {
    return request('/dashboard/stats/');
  },
};

export default request;