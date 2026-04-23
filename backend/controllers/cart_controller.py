from fastapi import APIRouter, Depends

from models.cart import CartItemAdd, CartItemUpdate
from services import cart_service
from utils.auth import get_current_customer

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("")
async def get_cart(customer: dict = Depends(get_current_customer)):
    return await cart_service.get_or_create_cart(customer["id"])


@router.post("/items")
async def add_item(body: CartItemAdd, customer: dict = Depends(get_current_customer)):
    return await cart_service.add_item(customer["id"], body)


@router.patch("/items/{item_id}")
async def update_item(item_id: str, body: CartItemUpdate, customer: dict = Depends(get_current_customer)):
    return await cart_service.update_item_qty(customer["id"], item_id, body)


@router.delete("/items/{item_id}")
async def remove_item(item_id: str, customer: dict = Depends(get_current_customer)):
    return await cart_service.remove_item(customer["id"], item_id)


@router.delete("")
async def clear_cart(customer: dict = Depends(get_current_customer)):
    return await cart_service.clear_cart(customer["id"])
