from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException

from models.order import (
    Order, OrderItem, OrderCreate, OrderStatus, OrderStatusEntry,
    OrderStatusUpdate, ORDER_STATUS_FLOW, CartItemForPOS, POSCheckoutRequest,
)
from utils.db import get_db


async def place_order(customer_id: str, data: OrderCreate) -> dict:
    db = get_db()
    cart = await db.carts.find_one({"user_id": customer_id})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")

    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0, "password_hash": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    now = datetime.now(timezone.utc)
    order_items = []
    subtotal = 0.0

    for ci in cart["items"]:
        prod = await db.catalog.find_one({"id": ci["product_id"]}, {"_id": 0})
        if not prod:
            continue
        price = ci.get("unit_price", prod.get("price", 0))
        qty = ci.get("quantity", 1)
        line = round(price * qty, 2)
        subtotal += line
        order_items.append(OrderItem(
            product_id=ci["product_id"], variant_id=ci.get("variant_id"),
            product_name=ci.get("product_name", prod.get("name", "")),
            product_image=ci.get("product_image"),
            variant_label=ci.get("variant_label"),
            unit_price=price, quantity=qty, line_total=line,
        ))
        # Deduct stock
        await db.catalog.update_one({"id": ci["product_id"]}, {"$inc": {"stock_qty": -qty, "total_sold": qty}})

    if not order_items:
        raise HTTPException(status_code=400, detail="No valid items")

    order = Order(
        customer_id=customer_id,
        customer_name=customer.get("name", ""),
        customer_email=customer.get("email", ""),
        customer_phone=customer.get("phone", ""),
        items=[oi.model_dump() for oi in order_items],
        shipping_address=data.shipping_address.model_dump(),
        subtotal=round(subtotal, 2),
        total=round(subtotal, 2),
        status=OrderStatus.PLACED,
        status_history=[OrderStatusEntry(status=OrderStatus.PLACED, changed_by="customer", changed_at=now).model_dump()],
        payment_method=data.payment_method,
        payment_status="pending",
        note=data.note,
        created_at=now, updated_at=now,
    )
    await db.orders.insert_one(order.model_dump())
    # Clear cart
    await db.carts.update_one({"user_id": customer_id}, {"$set": {"items": [], "updated_at": now}})
    return await get_order_by_id(order.id)


async def create_pos_order(data: POSCheckoutRequest, user_email: str) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    order_items = []
    subtotal = 0.0

    for ci in data.items:
        prod = await db.catalog.find_one({"id": ci.product_id}, {"_id": 0})
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product {ci.product_id} not found")
        price = prod.get("price", 0)
        img = prod["images"][0]["url"] if prod.get("images") else None
        line = round(price * ci.quantity, 2)
        subtotal += line
        order_items.append(OrderItem(
            product_id=ci.product_id, variant_id=ci.variant_id,
            product_name=prod.get("name", ""), product_image=img,
            unit_price=price, quantity=ci.quantity, line_total=line,
        ))
        await db.catalog.update_one({"id": ci.product_id}, {"$inc": {"stock_qty": -ci.quantity, "total_sold": ci.quantity}})

    order = Order(
        customer_id="pos",
        customer_name=data.customer_name or "Walk-in Customer",
        customer_phone=data.customer_phone or "",
        items=[oi.model_dump() for oi in order_items],
        subtotal=round(subtotal, 2), total=round(subtotal, 2),
        status=OrderStatus.DELIVERED,
        status_history=[OrderStatusEntry(status=OrderStatus.DELIVERED, changed_by=user_email, changed_at=now).model_dump()],
        payment_method=data.payment_method, payment_status="paid",
        note=data.note, is_pos_order=True,
        created_at=now, updated_at=now,
    )
    await db.orders.insert_one(order.model_dump())
    return await get_order_by_id(order.id)


async def get_order_by_id(order_id: str) -> dict:
    db = get_db()
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc


async def get_customer_orders(customer_id: str) -> List[dict]:
    db = get_db()
    cursor = db.orders.find({"customer_id": customer_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=500)


async def get_all_orders(status: Optional[str] = None, search: Optional[str] = None) -> List[dict]:
    db = get_db()
    query: dict = {}
    if status:
        query["status"] = status
    if search:
        regex = {"$regex": search, "$options": "i"}
        query["$or"] = [{"order_number": regex}, {"customer_name": regex}, {"customer_email": regex}]
    cursor = db.orders.find(query, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=1000)


async def update_order_status(order_id: str, data: OrderStatusUpdate, user_email: str) -> dict:
    db = get_db()
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] == data.status.value:
        raise HTTPException(status_code=400, detail="Already at this status")

    now = datetime.now(timezone.utc)
    entry = OrderStatusEntry(status=data.status, note=data.note, changed_by=user_email, changed_at=now).model_dump()
    update = {"status": data.status.value, "updated_at": now}
    if data.status == OrderStatus.DELIVERED:
        update["payment_status"] = "paid"

    await db.orders.update_one({"id": order_id}, {"$set": update, "$push": {"status_history": entry}})
    return await get_order_by_id(order_id)


async def get_order_analytics() -> dict:
    db = get_db()
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}, "revenue": {"$sum": "$total"}}}]
    results = await db.orders.aggregate(pipeline).to_list(length=50)
    by_status = {r["_id"]: {"count": r["count"], "revenue": r["revenue"]} for r in results}
    total_orders = sum(v["count"] for v in by_status.values())
    total_revenue = sum(v["revenue"] for v in by_status.values())
    return {"total_orders": total_orders, "total_revenue": round(total_revenue, 2), "by_status": by_status}
