from typing import Optional
from fastapi import APIRouter, Depends, Query

from models.catalog import CatalogProductCreate, CatalogProductUpdate, CategoryCreate, StockUpdateRequest
from models.order import OrderStatusUpdate, POSCheckoutRequest
from services import catalog_service, order_service
from utils.auth import require_admin
from utils.ws import manager as ws_manager

router = APIRouter(prefix="/company", tags=["company"])


# ── Catalog Management ──────────────────────────────────────

@router.get("/catalog")
async def list_products(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    _: dict = Depends(require_admin),
):
    return await catalog_service.list_catalog_products(search=search, active_only=False)


@router.post("/catalog")
async def create_product(body: CatalogProductCreate, user: dict = Depends(require_admin)):
    product = await catalog_service.create_catalog_product(body, user["email"])
    return product


@router.patch("/catalog/{product_id}")
async def update_product(product_id: str, body: CatalogProductUpdate, _: dict = Depends(require_admin)):
    product = await catalog_service.update_catalog_product(product_id, body)
    await ws_manager.broadcast("catalog_updated", {"action": "updated", "product": product})
    return product


@router.delete("/catalog/{product_id}")
async def delete_product(product_id: str, _: dict = Depends(require_admin)):
    await catalog_service.delete_catalog_product(product_id)
    await ws_manager.broadcast("catalog_updated", {"action": "deleted", "product_id": product_id})
    return {"ok": True}


@router.patch("/catalog/{product_id}/stock")
async def update_stock(product_id: str, body: StockUpdateRequest, _: dict = Depends(require_admin)):
    return await catalog_service.update_stock(product_id, body)


# ── Categories ──────────────────────────────────────────────

@router.post("/categories")
async def create_category(body: CategoryCreate, _: dict = Depends(require_admin)):
    return await catalog_service.create_category(body)


@router.get("/categories")
async def list_categories(_: dict = Depends(require_admin)):
    return await catalog_service.list_categories()


# ── Logos ───────────────────────────────────────────────────

@router.get("/logos")
async def list_logos_company(_: dict = Depends(require_admin)):
    return await catalog_service.list_logos()

@router.post("/logos")
async def create_logo(body: dict, _: dict = Depends(require_admin)):
    return await catalog_service.create_logo(body)

@router.delete("/logos/{logo_id}")
async def delete_logo(logo_id: str, _: dict = Depends(require_admin)):
    return await catalog_service.delete_logo(logo_id)


# ── Orders ──────────────────────────────────────────────────

@router.get("/orders")
async def list_orders(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    _: dict = Depends(require_admin),
):
    return await order_service.get_all_orders(status=status, search=search)


@router.get("/orders/{order_id}")
async def get_order(order_id: str, _: dict = Depends(require_admin)):
    return await order_service.get_order_by_id(order_id)


@router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, body: OrderStatusUpdate, user: dict = Depends(require_admin)):
    order = await order_service.update_order_status(order_id, body, user["email"])
    await ws_manager.broadcast("order_updated", order)
    await ws_manager.send_to_channel(f"order:{order_id}", "order_status", order)
    return order


@router.post("/orders/{order_id}/return")
async def process_return(order_id: str, user: dict = Depends(require_admin)):
    order = await order_service.get_order_by_id(order_id)
    if not order:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("status") == "returned":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Already returned")

    # Mark as returned in DB
    updated_order = await order_service.update_order_status(order_id, OrderStatusUpdate(status="returned"), user["email"])
    
    # Auto-restock items
    for item in updated_order.get("items", []):
        await catalog_service.increment_product_stock(
            product_id=item["product_id"],
            quantity=item["quantity"],
            variant_id=item.get("variant_id")
        )
    
    await ws_manager.broadcast("order_updated", updated_order)
    return updated_order


# ── POS ─────────────────────────────────────────────────────

@router.post("/pos/checkout")
async def pos_checkout(body: POSCheckoutRequest, user: dict = Depends(require_admin)):
    order = await order_service.create_pos_order(body, user["email"])
    await ws_manager.broadcast("new_order", order)
    return order


# ── Analytics ───────────────────────────────────────────────

@router.get("/analytics")
async def analytics(_: dict = Depends(require_admin)):
    return await order_service.get_order_analytics()
