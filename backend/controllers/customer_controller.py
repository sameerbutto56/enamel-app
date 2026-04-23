from fastapi import APIRouter, Depends

from models.customer import CustomerRegister, CustomerLogin, CustomerProfileUpdate, SavedAddress
from services import customer_service
from utils.auth import get_current_customer

router = APIRouter(prefix="/customer", tags=["customer"])


@router.post("/register")
async def register(body: CustomerRegister):
    return await customer_service.register_customer(body)


@router.post("/login")
async def login(body: CustomerLogin):
    return await customer_service.login_customer(body)


@router.get("/profile")
async def profile(customer: dict = Depends(get_current_customer)):
    return await customer_service.get_customer_profile(customer["id"])


@router.patch("/profile")
async def update_profile(body: CustomerProfileUpdate, customer: dict = Depends(get_current_customer)):
    return await customer_service.update_customer_profile(customer["id"], body)


@router.post("/addresses")
async def add_address(body: SavedAddress, customer: dict = Depends(get_current_customer)):
    return await customer_service.add_address(customer["id"], body)


@router.delete("/addresses/{address_id}")
async def remove_address(address_id: str, customer: dict = Depends(get_current_customer)):
    return await customer_service.remove_address(customer["id"], address_id)
