import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

// For Web, we use localhost. For Mobile, we use the computer's IP address.
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000/api' 
  : 'http://192.168.10.3:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor
api.interceptors.request.use(async (config) => {
  try {
    let token = null;
    if (Platform.OS === 'web') {
      token = typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
    } else {
      token = await SecureStore.getItemAsync('customer_token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Error reading token:', error);
  }
  return config;
});

export const catalogApi = {
  getCategories: () => api.get('/catalog/categories'),
  getProducts: (params?: any) => api.get('/catalog/products', { params }),
  getProduct: (id: string) => api.get(`/catalog/products/${id}`),
};

export const cartApi = {
  getCart: () => api.get('/cart'),
  addItem: (data: { product_id: string; variant_id?: string; quantity: number }) => 
    api.post('/cart/items', data),
  updateItem: (itemId: string, quantity: number) => 
    api.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
  clearCart: () => api.delete('/cart'),
};

export const orderApi = {
  placeOrder: (data: any) => api.post('/orders', data),
  getOrders: () => api.get('/orders'),
  getOrder: (id: string) => api.get(`/orders/${id}`),
};

export const customerApi = {
  register: (data: any) => api.post('/customer/register', data),
  login: (data: any) => api.post('/customer/login', data),
  getProfile: () => api.get('/customer/profile'),
  updateProfile: (data: any) => api.patch('/customer/profile', data),
  addAddress: (data: any) => api.post('/customer/addresses', data),
  removeAddress: (id: string) => api.delete(`/customer/addresses/${id}`),
};

export default api;
