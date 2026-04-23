import { Platform } from "react-native";

type Handler = (payload: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Handler>> = new Map();
  private reconnectTimer: any = null;
  private shouldConnect = false;
  private statusListeners: Set<(connected: boolean) => void> = new Set();
  private _connected = false;

  get connected() {
    return this._connected;
  }

  private wsUrl(): string {
    const base = (process.env.EXPO_PUBLIC_BACKEND_URL || "")
      .trim()
      .replace(/\/+$/, "")
      .replace(/\/api$/i, "");
    if (base.startsWith("https://")) return base.replace("https://", "wss://") + "/api/ws";
    if (base.startsWith("http://")) return base.replace("http://", "ws://") + "/api/ws";
    // Fallback for local development backend.
    return `ws://localhost:8000/api/ws`;
  }

  connect() {
    this.shouldConnect = true;
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) return;
    try {
      const url = this.wsUrl();
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.setConnected(true);
      };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(typeof e.data === "string" ? e.data : "");
          if (data && data.event) {
            this.emit(data.event, data.payload);
          }
        } catch {
          // ignore malformed
        }
      };
      ws.onclose = () => {
        this.setConnected(false);
        this.scheduleReconnect();
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.setConnected(false);
  }

  private scheduleReconnect() {
    if (!this.shouldConnect) return;
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  private setConnected(val: boolean) {
    this._connected = val;
    this.statusListeners.forEach((l) => {
      try {
        l(val);
      } catch {}
    });
  }

  on(event: string, handler: Handler): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  onStatus(handler: (connected: boolean) => void): () => void {
    this.statusListeners.add(handler);
    handler(this._connected);
    return () => {
      this.statusListeners.delete(handler);
    };
  }

  private emit(event: string, payload: any) {
    this.listeners.get(event)?.forEach((h) => {
      try {
        h(payload);
      } catch {}
    });
  }
}

export const socket = new SocketClient();
// suppress unused Platform warning — kept for future platform-specific tweaks
void Platform;
