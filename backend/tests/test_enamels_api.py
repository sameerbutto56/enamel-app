"""Enamels Inventory API tests - auth and product flows."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": "admin@enamels.com", "password": "admin123"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data and data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# --- Auth module ---
class TestAuth:
    def test_login_bad_creds(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@enamels.com", "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_returns_user(self, auth_headers):
        r = requests.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == "admin@enamels.com"
        assert body["role"] == "admin"


# --- Products: stats / list / search / stage filter ---
class TestProductsRead:
    def test_stats_requires_auth(self):
        r = requests.get(f"{API}/products/stats")
        assert r.status_code == 401

    def test_stats_shape(self, auth_headers):
        r = requests.get(f"{API}/products/stats", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert "total" in d and isinstance(d["by_stage"], list) and len(d["by_stage"]) == 7
        assert len(d["stages"]) == 7

    def test_list_unauth(self):
        assert requests.get(f"{API}/products").status_code == 401

    def test_list_sorted_desc(self, auth_headers):
        r = requests.get(f"{API}/products", headers=auth_headers)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 3
        # sorted desc by created_at
        ts = [i["created_at"] for i in items]
        assert ts == sorted(ts, reverse=True)

    def test_search_filter(self, auth_headers):
        r = requests.get(f"{API}/products", headers=auth_headers, params={"search": "Cobalt"})
        assert r.status_code == 200
        items = r.json()
        assert any("cobalt" in p["name"].lower() for p in items)

    def test_stage_filter(self, auth_headers):
        r = requests.get(f"{API}/products", headers=auth_headers, params={"stage": "Stitching"})
        assert r.status_code == 200
        for p in r.json():
            assert p["current_stage"] == "Stitching"


# --- Products: create / duplicate / get ---
class TestProductCreate:
    created_id = None
    product_id_val = None

    def test_create_unauth(self):
        r = requests.post(f"{API}/products", json={"name": "x", "product_id": "x", "batch_number": "x"})
        assert r.status_code == 401

    def test_create_product(self, auth_headers):
        pid = f"TEST-{uuid.uuid4().hex[:8]}"
        r = requests.post(f"{API}/products", headers=auth_headers,
                          json={"name": "TEST Product", "product_id": pid, "batch_number": "TEST-BATCH-01"})
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["current_stage"] == "Order Received"
        assert len(p["history"]) == 1 and p["history"][0]["stage"] == "Order Received"
        assert p["history"][0]["changed_by"] == "admin@enamels.com"
        TestProductCreate.created_id = p["id"]
        TestProductCreate.product_id_val = pid

    def test_create_duplicate_rejected(self, auth_headers):
        assert TestProductCreate.product_id_val
        r = requests.post(f"{API}/products", headers=auth_headers,
                          json={"name": "dup", "product_id": TestProductCreate.product_id_val, "batch_number": "b"})
        assert r.status_code == 400

    def test_get_by_id(self, auth_headers):
        r = requests.get(f"{API}/products/{TestProductCreate.created_id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["id"] == TestProductCreate.created_id

    def test_get_unknown_404(self, auth_headers):
        r = requests.get(f"{API}/products/{uuid.uuid4()}", headers=auth_headers)
        assert r.status_code == 404


# --- Stage update flow ---
class TestStageUpdate:
    def test_invalid_stage_400(self, auth_headers):
        pid = TestProductCreate.created_id
        r = requests.patch(f"{API}/products/{pid}/stage", headers=auth_headers,
                           json={"stage": "Nope"})
        assert r.status_code == 400

    def test_advance_stage_appends_history(self, auth_headers):
        pid = TestProductCreate.created_id
        r = requests.patch(f"{API}/products/{pid}/stage", headers=auth_headers,
                           json={"stage": "Material Assigned", "note": "TEST advance"})
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["current_stage"] == "Material Assigned"
        assert len(p["history"]) == 2
        last = p["history"][-1]
        assert last["stage"] == "Material Assigned"
        assert last["note"] == "TEST advance"
        assert last["changed_by"] == "admin@enamels.com"
        assert "changed_at" in last

    def test_same_stage_rejected(self, auth_headers):
        pid = TestProductCreate.created_id
        r = requests.patch(f"{API}/products/{pid}/stage", headers=auth_headers,
                           json={"stage": "Material Assigned"})
        assert r.status_code == 400

    def test_unknown_product_404(self, auth_headers):
        r = requests.patch(f"{API}/products/{uuid.uuid4()}/stage", headers=auth_headers,
                           json={"stage": "Stitching"})
        assert r.status_code == 404
