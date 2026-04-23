from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException

from models.cart import Cart, CartItem, CartItemAdd, CartItemUpdate
from utils.db import get_db


async def get_or_create_cart(user_id: str) -> dict:
    db = get_db()
    cart = await db.carts.find_one({"user_id": user_id}, {"_id": 0})
    if not cart:
        new_cart = Cart(user_id=user_id)
        await db.carts.insert_one(new_cart.model_dump())
        return await _get_cart(user_id)
    return _recalc(cart)


async def _get_cart(user_id: str) -> dict:
    db = get_db()
    cart = await db.carts.find_one({"user_id": user_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    return _recalc(cart)


def _recalc(cart: dict) -> dict:
    items = cart.get("items", [])
    cart["subtotal"] = round(sum(i.get("unit_price", 0) * i.get("quantity", 0) for i in items), 2)
    cart["item_count"] = sum(i.get("quantity", 0) for i in items)
    return cart


async def add_item(user_id: str, data: CartItemAdd) -> dict:
    db = get_db()
    product = await db.catalog.find_one({"id": data.product_id, "is_active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    stock = product.get("stock_qty", 0)
    price = product.get("price", 0)
    name = product.get("name", "")
    img = product["images"][0]["url"] if product.get("images") else None
    vlabel = None

    if data.variant_id:
        v = next((v for v in product.get("variants", []) if v.get("id") == data.variant_id), None)
        if not v:
            raise HTTPException(status_code=404, detail="Variant not found")
        stock = v.get("stock_qty", 0)
        if v.get("price_override"):
            price = v["price_override"]
        parts = [p for p in [v.get("size"), v.get("color")] if p]
        vlabel = " / ".join(parts) if parts else None

    if data.quantity > stock:
        raise HTTPException(status_code=400, detail=f"Only {stock} in stock")

    await get_or_create_cart(user_id)
    cart = await db.carts.find_one({"user_id": user_id})
    now = datetime.now(timezone.utc)

    # Check if already in cart
    for idx, item in enumerate(cart.get("items", [])):
        if item.get("product_id") == data.product_id and item.get("variant_id") == data.variant_id:
            new_qty = item.get("quantity", 0) + data.quantity
            if new_qty > stock:
                raise HTTPException(status_code=400, detail=f"Only {stock} in stock")
            cart["items"][idx]["quantity"] = new_qty
            cart["items"][idx]["unit_price"] = price
            await db.carts.update_one({"user_id": user_id}, {"$set": {"items": cart["items"], "updated_at": now}})
            return await _get_cart(user_id)

    new_item = CartItem(
        product_id=data.product_id, variant_id=data.variant_id, quantity=data.quantity,
        product_name=name, product_image=img, unit_price=price, variant_label=vlabel, added_at=now,
    )
    await db.carts.update_one({"user_id": user_id}, {"$push": {"items": new_item.model_dump()}, "$set": {"updated_at": now}})
    return await _get_cart(user_id)


async def update_item_qty(user_id: str, item_id: str, data: CartItemUpdate) -> dict:
    db = get_db()
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    items = cart.get("items", [])
    now = datetime.now(timezone.utc)
    if data.quantity == 0:
        items = [i for i in items if i.get("id") != item_id]
    else:
        found = False
        for item in items:
            if item.get("id") == item_id:
                item["quantity"] = data.quantity
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Item not found")
    await db.carts.update_one({"user_id": user_id}, {"$set": {"items": items, "updated_at": now}})
    return await _get_cart(user_id)


async def remove_item(user_id: str, item_id: str) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    await db.carts.update_one({"user_id": user_id}, {"$pull": {"items": {"id": item_id}}, "$set": {"updated_at": now}})
    return await _get_cart(user_id)


async def clear_cart(user_id: str) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    await db.carts.update_one({"user_id": user_id}, {"$set": {"items": [], "updated_at": now}})
    return await _get_cart(user_id)
