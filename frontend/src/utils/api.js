const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Refresh the access token using the stored refresh token. Returns the new
// access token, or null if the refresh token is missing/invalid/expired.
// A shared in-flight promise dedupes concurrent 401s so we only hit the
// refresh endpoint once even when several requests fail at the same time.
let refreshingPromise = null;

async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access) return null;
    localStorage.setItem('access_token', data.access);
    // Some SimpleJWT configs rotate the refresh token; persist it if present.
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
    return data.access;
  } catch {
    return null;
  }
}

async function request(endpoint, options = {}) {
  const { isFormData, _retry, ...rest } = options;
  const config = {
    ...rest,
    headers: {
      ...getAuthHeaders(),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...rest.headers,
    },
  };

  let response = await fetch(`${API_BASE}${endpoint}`, config);

  // Access token expired (SimpleJWT returns 401 with code token_not_valid).
  // Refresh once and retry the original request with the new token.
  if (response.status === 401 && !_retry) {
    const newToken = await (refreshingPromise ??= refreshAccessToken());
    refreshingPromise = null;
    if (newToken) {
      const retryConfig = {
        ...config,
        headers: { ...config.headers, Authorization: `Bearer ${newToken}` },
      };
      response = await fetch(`${API_BASE}${endpoint}`, retryConfig);
    }
  }

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

// Build multipart FormData from a data object. Arrays (e.g. a list of File
// objects under the `images` key) are appended once per item so the backend
// can read them with request.data.getlist('images'); scalars are appended as-is.
function toFormData(data) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined && item !== '') formData.append(key, item);
      });
    } else {
      formData.append(key, value);
    }
  });
  return formData;
}

export const adminProductApi = {
  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/products/${query ? '?' + query : ''}`);
  },
  create(data) {
    const formData = toFormData(data);
    return request('/products/create/', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },
  update(id, data) {
    const formData = toFormData(data);
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
// Subcategory attributes (Public — attribute + values for a subcategory)
// -------------------------

export const subcategoryAttributesApi = {
  get(slug) {
    return request(`/subcategories/${encodeURIComponent(slug)}/attributes/`);
  },
};


//WishList
export const wishlistApi = {
  list: () => request("/wishlist/"),

  add: (productId) =>
    request("/wishlist/add/", {
      method: "POST",
      body: JSON.stringify({ product_id: productId }),
    }),

  remove: (productId) =>
    request(`/wishlist/remove/${productId}/`, {
      method: "DELETE",
    }),
};

// -------------------------
// Admin Categories (scoped to created_by)
// -------------------------

export const adminCategoryApi = {
  list(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/categories/${query ? '?' + query : ''}`);
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


export const authApi = {

  forgotPassword(data) {
    return request(
      "/forgot-password/",
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  },

  resetPassword(data) {
    return request(
      "/reset-password/",
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }

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
  // Razorpay: create a Razorpay order + pending Django order.
  razorpay(data) {
    return request('/checkoutRaz/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  // Razorpay: verify the payment signature and finalize the order.
  verifyRazorpay(data) {
    return request('/checkoutRaz/verify/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// -------------------------
// Order History (Customer)
// -------------------------

export const orderApi = {
  mine(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/orders/mine/${query ? '?' + query : ''}`);
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

export const adminOrderApi = orderApi;


export const variantApi = {
  list: (productId) => request(`/products/${productId}/variants/`),
  create: (productId, formData) => request(`/products/${productId}/variants/create/`, {
    method: 'POST',
    body: formData, // FormData with image, price, stock, sku, attributes
  }),
  update: (variantId, formData) => request(`/variants/${variantId}/update/`, {
    method: 'PUT',
    body: formData,
  }),
  delete: (variantId) => request(`/variants/${variantId}/delete/`, {
    method: 'DELETE',
  }),
};

// -------------------------
// Profile (logged-in user — any role)
// -------------------------

export const profileApi = {
  me() {
    return request('/profile/');
  },
  update(data) {
    return request('/profile/update/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
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



//SubCategory
export const adminSubcategoryApi = {
  list: (categoryId) =>
    request(`/categories/${categoryId}/subcategories/`),

  create: (categoryId, data) =>
    request(`/categories/${categoryId}/subcategories/create/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/subcategories/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/subcategories/${id}/delete/`, {
      method: 'DELETE',
    }),

  attributes: (slug) =>
    request(`/subcategories/${slug}/attributes/`),
};

export const adminAttributeApi = {
  create: (subcategoryId, data) =>
    request(`/subcategories/${subcategoryId}/attributes/create/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/attributes/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    request(`/attributes/${id}/delete/`, {
      method: 'DELETE',
    }),
};

export const adminAttributeValueApi = {
  create: (attributeId, data) =>
    request(`/attributes/${attributeId}/values/create/`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    request(`/values/${id}/update/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    request(`/values/${id}/delete/`, {
      method: 'DELETE',
    }),
};
// -------------------------
// Super Admin → admin account approval workflow
// Only the super_admin role can reach these endpoints (backend enforces it).
// -------------------------

export const superadminApi = {
  // List admin accounts; optional ?status=pending|active|rejected|suspended
  listAdmins(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/superadmin/admins/${query ? '?' + query : ''}`);
  },
  pendingAdmins() {
    return request('/superadmin/admins/pending/');
  },
  activateAdmin(id) {
    return request(`/superadmin/admins/${id}/activate/`, { method: 'POST' });
  },
  rejectAdmin(id) {
    return request(`/superadmin/admins/${id}/reject/`, { method: 'POST' });
  },
  suspendAdmin(id) {
    return request(`/superadmin/admins/${id}/suspend/`, { method: 'POST' });
  },
};

// -------------------------
// Ratings
// -------------------------

export const ratingApi = {
  create(data) {
    return request('/ratings/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  mine() {
    return request('/ratings/mine/');
  },
  forProduct(productId) {
    return request(`/products/${productId}/ratings/`);
  },
  // Admin: ratings for this admin's products
  adminList(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/ratings/${query ? '?' + query : ''}`);
  },
};

export default request;