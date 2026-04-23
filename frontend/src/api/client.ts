import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

function resolveBackendBase(): string {
  const configured = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  if (configured) {
    // Allow either "...:8000" or "...:8000/api" in env.
    return configured.replace(/\/+$/, "").replace(/\/api$/i, "");
  }

  // Default for local development when env var is missing.
  if (Platform.OS === "web") return "http://localhost:8000";
  return "http://10.0.2.2:8000";
}

const BASE = resolveBackendBase();
const TOKEN_KEY = "enamels_token";

export const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 20000,
});

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }
  return await SecureStore.getItemAsync(key);
}
async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    } catch {}
    return;
  }
  await SecureStore.setItemAsync(key, value);
}
async function storageDel(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getToken(): Promise<string | null> {
  return storageGet(TOKEN_KEY);
}
export async function setToken(token: string): Promise<void> {
  await storageSet(TOKEN_KEY, token);
}
export async function clearToken(): Promise<void> {
  await storageDel(TOKEN_KEY);
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export function extractError(err: any): string {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map((e: any) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .join(" ");
  }
  return err?.message || "Something went wrong";
}
