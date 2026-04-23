import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { customerApi, cartApi } from './api';

interface AuthState {
  customer: any | null;
  token: string | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

import { Platform } from 'react-native';

const setToken = async (token: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.setItem('customer_token', token);
  } else {
    await SecureStore.setItemAsync('customer_token', token);
  }
};

const getToken = async () => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
  } else {
    return await SecureStore.getItemAsync('customer_token');
  }
};

const removeToken = async () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.removeItem('customer_token');
  } else {
    await SecureStore.deleteItemAsync('customer_token');
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  token: null,
  isLoading: true,
  login: async (data) => {
    const res = await customerApi.login(data);
    const { access_token, customer } = res.data;
    await setToken(access_token);
    set({ token: access_token, customer, isLoading: false });
  },
  register: async (data) => {
    const res = await customerApi.register(data);
    const { access_token, customer } = res.data;
    await setToken(access_token);
    set({ token: access_token, customer, isLoading: false });
  },
  logout: async () => {
    await removeToken();
    set({ token: null, customer: null });
  },
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await getToken();
      if (token) {
        const res = await customerApi.getProfile();
        set({ token, customer: res.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },
}));

interface CartState {
  cart: any | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (data: any) => Promise<void>;
  updateItem: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,
  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await cartApi.getCart();
      set({ cart: res.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },
  addItem: async (data) => {
    const res = await cartApi.addItem(data);
    set({ cart: res.data });
  },
  updateItem: async (itemId, qty) => {
    const res = await cartApi.updateItem(itemId, qty);
    set({ cart: res.data });
  },
  removeItem: async (itemId) => {
    const res = await cartApi.removeItem(itemId);
    set({ cart: res.data });
  },
  clearCart: async () => {
    const res = await cartApi.clearCart();
    set({ cart: res.data });
  },
}));
