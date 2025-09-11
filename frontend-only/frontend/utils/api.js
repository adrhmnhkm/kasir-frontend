// Dynamic API URL getter to ensure we always get the latest value
const getAPIBaseURL = () => {
  const url = window.API_BASE_URL || '/api';
  console.log('🌐 Using API Base URL:', url);
  return url;
};

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${getAPIBaseURL()}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

const api = new ApiClient();
window.api = api;

// Product API
const productApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/products${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  updateStock: (id, data) => api.put(`/products/${id}/stock`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Sales API
const salesApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/sales${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/sales/${id}`),
  getDrafts: () => api.get('/sales/drafts'),
  getToday: () => api.get('/sales/today'),
  getSummary: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/sales/summary${queryString ? `?${queryString}` : ''}`);
  },
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  finalize: (id, data) => api.put(`/sales/${id}/finalize`, data),
  delete: (id) => api.delete(`/sales/${id}`),
};

// Categories API
const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Expenses API
const expenseApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/expenses${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/expenses/${id}`),
  getToday: () => api.get('/expenses/today'),
  getSummary: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/expenses/summary${queryString ? `?${queryString}` : ''}`);
  },
  getCategories: () => api.get('/expenses/categories'),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Settings API
const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Dashboard API
const dashboardApi = {
  getSummary: () => api.get('/dashboard'),
  getCashFlow: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/cash-flow${queryString ? `?${queryString}` : ''}`);
  },
};

// Assign all API objects to window for global access
api.products = productApi;
api.sales = salesApi;
api.categories = categoryApi;
api.expenses = expenseApi;
api.settings = settingsApi;
api.dashboard = dashboardApi; 