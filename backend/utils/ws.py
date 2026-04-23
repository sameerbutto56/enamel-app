import json
import logging
from typing import Set, Dict
from fastapi import WebSocket

logger = logging.getLogger("enamels.ws")


class ConnectionManager:
    def __init__(self) -> None:
        self._active: Set[WebSocket] = set()
        self._channels: Dict[str, Set[WebSocket]] = {}  # channel -> set of websockets

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._active.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self._active.discard(ws)
        for channel in list(self._channels.keys()):
            self._channels[channel].discard(ws)
            if not self._channels[channel]:
                del self._channels[channel]

    def subscribe(self, ws: WebSocket, channel: str) -> None:
        if channel not in self._channels:
            self._channels[channel] = set()
        self._channels[channel].add(ws)

    async def broadcast(self, event: str, payload: dict) -> None:
        """Broadcast to ALL connected clients."""
        if not self._active:
            return
        message = json.dumps({"event": event, "payload": payload}, default=str)
        dead = []
        for ws in list(self._active):
            try:
                await ws.send_text(message)
            except Exception as e:
                logger.warning("ws send failed: %s", e)
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def send_to_channel(self, channel: str, event: str, payload: dict) -> None:
        """Send to clients subscribed to a specific channel (e.g. order:abc123)."""
        subs = self._channels.get(channel, set())
        if not subs:
            return
        message = json.dumps({"event": event, "payload": payload}, default=str)
        dead = []
        for ws in list(subs):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()
