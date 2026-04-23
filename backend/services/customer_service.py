import os
from datetime import datetime, timezone
from fastapi import HTTPException

from models.customer import CustomerInDB, CustomerPublic, CustomerRegister, CustomerLogin, CustomerProfileUpdate, SavedAddress
from utils.auth import hash_password, verify_password, create_customer_token
from utils.db import get_db


async def register_customer(data: CustomerRegister) -> dict:
    db = get_db()
    email = data.email.lower()
    existing = await db.customers.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    customer = CustomerInDB(
        email=email, name=data.name, phone=data.phone,
        password_hash=hash_password(data.password),
    )
    await db.customers.insert_one(customer.model_dump())
    return await _login_response(customer.model_dump())


async def login_customer(data: CustomerLogin) -> dict:
    db = get_db()
    email = data.email.lower()
    user = await db.customers.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account deactivated")
    return await _login_response(user)


async def _login_response(user: dict) -> dict:
    token = create_customer_token(user["id"], user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": CustomerPublic(
            id=user["id"], email=user["email"], name=user["name"],
            phone=user.get("phone"), addresses=user.get("addresses", []),
            created_at=user["created_at"],
        ).model_dump(),
    }


async def get_customer_profile(customer_id: str) -> dict:
    db = get_db()
    doc = await db.customers.find_one({"id": customer_id}, {"_id": 0, "password_hash": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    return doc


async def update_customer_profile(customer_id: str, data: CustomerProfileUpdate) -> dict:
    db = get_db()
    update = data.model_dump(exclude_unset=True)
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await db.customers.update_one({"id": customer_id}, {"$set": update})
    return await get_customer_profile(customer_id)


async def add_address(customer_id: str, address: SavedAddress) -> dict:
    db = get_db()
    doc = address.model_dump()
    if address.is_default:
        # Unset other defaults
        await db.customers.update_one(
            {"id": customer_id},
            {"$set": {"addresses.$[].is_default": False}},
        )
    await db.customers.update_one({"id": customer_id}, {"$push": {"addresses": doc}})
    return await get_customer_profile(customer_id)


async def remove_address(customer_id: str, address_id: str) -> dict:
    db = get_db()
    await db.customers.update_one({"id": customer_id}, {"$pull": {"addresses": {"id": address_id}}})
    return await get_customer_profile(customer_id)


async def ensure_customer_indexes() -> None:
    db = get_db()
    await db.customers.create_index("email", unique=True)
    await db.customers.create_index("id", unique=True)
    await db.carts.create_index("user_id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("order_number", unique=True)
    await db.orders.create_index("customer_id")
    await db.orders.create_index("status")
    await db.catalog.create_index("id", unique=True)
    await db.catalog.create_index("sku", unique=True)
    await db.catalog.create_index("category_id")
    await db.catalog.create_index([("name", "text"), ("description", "text"), ("tags", "text")])
    await db.categories.create_index("id", unique=True)
    await db.categories.create_index("slug", unique=True)
