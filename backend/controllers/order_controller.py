from fastapi import APIRouter, Depends

from models.order import OrderCreate
from services import order_service
from utils.auth import get_current_customer
from utils.ws import manager as ws_manager

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("")
async def place_order(body: OrderCreate, customer: dict = Depends(get_current_customer)):
    order = await order_service.place_order(customer["id"], body)
    await ws_manager.broadcast("new_order", order)
    return order


@router.get("")
async def my_orders(customer: dict = Depends(get_current_customer)):
    return await order_service.get_customer_orders(customer["id"])


@router.get("/{order_id}")
async def get_order(order_id: str, customer: dict = Depends(get_current_customer)):
    order = await order_service.get_order_by_id(order_id)
    if order["customer_id"] != customer["id"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not your order")
    return order
