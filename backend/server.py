from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import json
import logging
import os
from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from controllers.auth_controller import router as auth_router
from controllers.product_controller import router as product_router
from controllers.catalog_controller import router as catalog_router
from controllers.cart_controller import router as cart_router
from controllers.order_controller import router as order_router
from controllers.customer_controller import router as customer_router
from controllers.company_controller import router as company_router
from controllers.upload_controller import router as upload_router
from services.auth_service import seed_admin, ensure_indexes
from services.customer_service import ensure_customer_indexes
from services.catalog_service import seed_sample_catalog
from utils.db import close_client
from utils.ws import manager as ws_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("enamels")

app = FastAPI(title="Enamels E-Commerce API")

# Mount uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "Enamels E-Commerce API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


# Existing internal routes
api_router.include_router(auth_router)
api_router.include_router(product_router)

# New e-commerce routes
api_router.include_router(catalog_router)
api_router.include_router(cart_router)
api_router.include_router(order_router)
api_router.include_router(customer_router)
api_router.include_router(company_router)
api_router.include_router(upload_router)

app.include_router(api_router)


@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        await websocket.send_json({"event": "connected", "payload": {"ok": True}})
        while True:
            raw = await websocket.receive_text()
            # Handle channel subscriptions from clients
            try:
                msg = json.loads(raw)
                if msg.get("action") == "subscribe" and msg.get("channel"):
                    ws_manager.subscribe(websocket, msg["channel"])
                    await websocket.send_json({"event": "subscribed", "payload": {"channel": msg["channel"]}})
            except (json.JSONDecodeError, KeyError):
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)



@app.on_event("startup")
async def startup_event():
    await ensure_indexes()
    await ensure_customer_indexes()
    await seed_admin()
    await seed_sample_catalog()
    logger.info("Enamels E-Commerce API started. Admin seeded. Catalog ready.")


@app.on_event("shutdown")
async def shutdown_event():
    close_client()
