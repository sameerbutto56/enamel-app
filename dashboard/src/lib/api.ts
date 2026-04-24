import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('company_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const companyApi = {
  // Catalog
  getProducts: (params?: any) => api.get('/company/catalog', { params }),
  createProduct: (data: any) => api.post('/company/catalog', data),
  updateProduct: (id: string, data: any) => api.put(`/company/catalog/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/company/catalog/${id}`),
  updateStock: (id: string, data: any) => api.patch(`/company/catalog/${id}/stock`, data),
  
  // Categories
  getCategories: () => api.get('/company/categories'),
  createCategory: (data: any) => api.post('/company/categories', data),
  
  // Logos
  getLogos: () => api.get('/company/logos'),
  createLogo: (data: any) => api.post('/company/logos', data),
  deleteLogo: (id: string) => api.delete(`/company/logos/${id}`),
  
  // Orders
  getOrders: (params?: any) => api.get('/company/orders', { params }),
  getOrder: (id: string) => api.get(`/company/orders/${id}`),
  updateOrderStatus: (id: string, data: any) => api.patch(`/company/orders/${id}/status`, data),
  processReturn: (id: string) => api.post(`/company/orders/${id}/return`),
  
  // POS
  posCheckout: (data: any) => api.post('/company/pos/checkout', data),
  
  // Analytics
  getAnalytics: () => api.get('/company/analytics'),
  
  // Auth (Admin/Employee)
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export default api;
