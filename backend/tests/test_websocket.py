"""WebSocket real-time broadcast tests for /api/ws."""
import asyncio
import json
import os
import uuid
import pytest
import requests
import websockets

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
# derive ws(s) URL from backend base
if BASE_URL.startswith("https://"):
    WS_URL = BASE_URL.replace("https://", "wss://") + "/api/ws"
else:
    WS_URL = BASE_URL.replace("http://", "ws://") + "/api/ws"


@pytest.fixture(scope="module")
def auth_headers():
    r = requests.post(f"{API}/auth/login", json={"email": "admin@enamels.com", "password": "admin123"})
    assert r.status_code == 200, r.text
    tok = r.json()["access_token"]
    return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}


async def _recv_event(ws, event_name, timeout=6.0):
    """Receive messages until a matching event or timeout."""
    end = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < end:
        remaining = end - asyncio.get_event_loop().time()
        try:
            raw = await asyncio.wait_for(ws.recv(), timeout=remaining)
        except asyncio.TimeoutError:
            return None
        try:
            data = json.loads(raw)
        except Exception:
            continue
        if data.get("event") == event_name:
            return data
    return None


class TestWebSocketConnection:
    """Connection handshake and initial frame."""

    @pytest.mark.asyncio
    async def test_ws_connects_and_receives_connected_frame(self):
        async with websockets.connect(WS_URL, open_timeout=5) as ws:
            raw = await asyncio.wait_for(ws.recv(), timeout=5)
            data = json.loads(raw)
            assert data["event"] == "connected"
            assert data["payload"]["ok"] is True


class TestWebSocketBroadcast:
    """Broadcasts on create and stage update."""

    @pytest.mark.asyncio
    async def test_product_created_broadcast(self, auth_headers):
        async with websockets.connect(WS_URL, open_timeout=5) as ws:
            # drain 'connected'
            await asyncio.wait_for(ws.recv(), timeout=5)

            pid = f"TEST-WS-{uuid.uuid4().hex[:8]}"
            # create in a background thread so WS can receive concurrently
            def _create():
                return requests.post(
                    f"{API}/products",
                    headers=auth_headers,
                    json={"name": "TEST WS Product", "product_id": pid, "batch_number": "TEST-WS-B1"},
                )
            create_task = asyncio.get_event_loop().run_in_executor(None, _create)

            evt = await _recv_event(ws, "product_created", timeout=6)
            resp = await create_task
            assert resp.status_code == 200, resp.text
            assert evt is not None, "product_created event not received"
            assert evt["payload"]["product_id"] == pid
            assert evt["payload"]["current_stage"] == "Order Received"

            # save for next test via class var
            TestWebSocketBroadcast.created_id = resp.json()["id"]

    @pytest.mark.asyncio
    async def test_product_updated_broadcast(self, auth_headers):
        assert getattr(TestWebSocketBroadcast, "created_id", None), "create test must run first"
        async with websockets.connect(WS_URL, open_timeout=5) as ws:
            await asyncio.wait_for(ws.recv(), timeout=5)  # drain connected

            pid = TestWebSocketBroadcast.created_id
            def _patch():
                return requests.patch(
                    f"{API}/products/{pid}/stage",
                    headers=auth_headers,
                    json={"stage": "Material Assigned", "note": "TEST ws advance"},
                )
            patch_task = asyncio.get_event_loop().run_in_executor(None, _patch)

            evt = await _recv_event(ws, "product_updated", timeout=6)
            resp = await patch_task
            assert resp.status_code == 200, resp.text
            assert evt is not None, "product_updated event not received"
            assert evt["payload"]["id"] == pid
            assert evt["payload"]["current_stage"] == "Material Assigned"
            assert len(evt["payload"]["history"]) >= 2

    @pytest.mark.asyncio
    async def test_multiple_clients_receive_broadcast(self, auth_headers):
        async with websockets.connect(WS_URL, open_timeout=5) as ws1, \
                   websockets.connect(WS_URL, open_timeout=5) as ws2, \
                   websockets.connect(WS_URL, open_timeout=5) as ws3:
            # drain 'connected' on each
            for w in (ws1, ws2, ws3):
                await asyncio.wait_for(w.recv(), timeout=5)

            pid = f"TEST-WS-MC-{uuid.uuid4().hex[:8]}"
            def _create():
                return requests.post(
                    f"{API}/products",
                    headers=auth_headers,
                    json={"name": "TEST WS MultiClient", "product_id": pid, "batch_number": "TEST-MC"},
                )
            task = asyncio.get_event_loop().run_in_executor(None, _create)

            results = await asyncio.gather(
                _recv_event(ws1, "product_created", timeout=6),
                _recv_event(ws2, "product_created", timeout=6),
                _recv_event(ws3, "product_created", timeout=6),
            )
            resp = await task
            assert resp.status_code == 200
            for idx, evt in enumerate(results):
                assert evt is not None, f"client {idx} did not receive event"
                assert evt["payload"]["product_id"] == pid

    @pytest.mark.asyncio
    async def test_disconnected_client_does_not_block_broadcast(self, auth_headers):
        # Open, then close one client; remaining client should still receive broadcast.
        ws_closed = await websockets.connect(WS_URL, open_timeout=5)
        await asyncio.wait_for(ws_closed.recv(), timeout=5)
        await ws_closed.close()

        async with websockets.connect(WS_URL, open_timeout=5) as ws_live:
            await asyncio.wait_for(ws_live.recv(), timeout=5)

            pid = f"TEST-WS-DC-{uuid.uuid4().hex[:8]}"
            def _create():
                return requests.post(
                    f"{API}/products",
                    headers=auth_headers,
                    json={"name": "TEST WS DeadSocket", "product_id": pid, "batch_number": "TEST-DC"},
                )
            task = asyncio.get_event_loop().run_in_executor(None, _create)

            evt = await _recv_event(ws_live, "product_created", timeout=6)
            resp = await task
            assert resp.status_code == 200, resp.text
            assert evt is not None
            assert evt["payload"]["product_id"] == pid
