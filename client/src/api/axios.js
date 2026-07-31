import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request Interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect
      localStorage.removeItem('gms_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Named service helpers ────────────────────────────────────────────────────
export const authService = {
  login:  (data)        => api.post('/auth/login', data),
  logout: ()            => api.post('/auth/logout'),
  getMe:  ()            => api.get('/auth/me'),
  verify: ()            => api.get('/auth/verify'),
};

export const productService = {
  getAll:        (params) => api.get('/products', { params }),
  getOne:        (id)     => api.get(`/products/${id}`),
  create:        (data)   => api.post('/products', data),
  update:        (id, d)  => api.put(`/products/${id}`, d),
  remove:        (id)     => api.delete(`/products/${id}`),
  updateStock:   (id, d)  => api.patch(`/products/${id}/stock`, d),
  getLowStock:   ()       => api.get('/products/alerts/low-stock'),
  getCategories: ()       => api.get('/products/meta/categories'),
};

export const billService = {
  getAll:  (params) => api.get('/bills', { params }),
  getOne:  (id)     => api.get(`/bills/${id}`),
  create:  (data)   => api.post('/bills', data),
  remove:  (id)     => api.delete(`/bills/${id}`),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};
