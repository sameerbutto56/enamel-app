import { create } from 'zustand';
import { companyApi } from './api';

interface AuthState {
  user: any | null;
  token: string | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  login: async (data) => {
    const res = await companyApi.login(data);
    const { access_token, user } = res.data;
    localStorage.setItem('company_token', access_token);
    set({ token: access_token, user });
  },
  logout: () => {
    localStorage.removeItem('company_token');
    set({ token: null, user: null });
  },
  checkAuth: async () => {
    const token = localStorage.getItem('company_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await companyApi.getMe();
      set({ token, user: res.data, isLoading: false });
    } catch (err) {
      localStorage.removeItem('company_token');
      set({ token: null, user: null, isLoading: false });
    }
  },
}));

interface DashboardState {
  orders: any[];
  isLoading: boolean;
  fetchOrders: (params?: any) => Promise<void>;
  updateOrderStatus: (id: string, status: string, note?: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  orders: [],
  isLoading: false,
  fetchOrders: async (params) => {
    set({ isLoading: true });
    try {
      const res = await companyApi.getOrders(params);
      set({ orders: res.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },
  updateOrderStatus: async (id, status, note) => {
    const res = await companyApi.updateOrderStatus(id, { status, note });
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? res.data : o)),
    }));
  },
}));
