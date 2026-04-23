import os
from datetime import datetime, timezone
from fastapi import HTTPException

from models.user import UserInDB, UserPublic, EmployeeUpsertRequest
from utils.auth import hash_password, verify_password, create_access_token
from utils.db import get_db


async def seed_admin() -> None:
    db = get_db()
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@enamels.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        user = UserInDB(
            email=admin_email,
            name="Admin",
            role="admin",
            password_hash=hash_password(admin_password),
        )
        await db.users.insert_one(user.model_dump())
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )


async def authenticate(email: str, password: str) -> dict:
    db = get_db()
    email_norm = email.lower()
    user = await db.users.find_one({"email": email_norm})
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user["id"], user["email"], user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserPublic(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            department_id=user.get("department_id"),
            created_at=user["created_at"],
        ).model_dump(),
    }


async def upsert_employee(data: EmployeeUpsertRequest) -> dict:
    db = get_db()
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        await db.users.update_one(
            {"email": email},
            {
                "$set": {
                    "name": data.name,
                    "role": "employee",
                    "department_id": data.department_id,
                    "password_hash": hash_password(data.password),
                }
            },
        )
    else:
        user = UserInDB(
            email=email,
            name=data.name,
            role="employee",
            department_id=data.department_id,
            password_hash=hash_password(data.password),
        )
        await db.users.insert_one(user.model_dump())
    saved = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
    return saved


async def list_employees() -> list[dict]:
    db = get_db()
    cursor = (
        db.users.find({"role": "employee"}, {"_id": 0, "password_hash": 0})
        .sort("created_at", -1)
    )
    return await cursor.to_list(length=1000)


async def ensure_indexes() -> None:
    db = get_db()
    await db.users.create_index("email", unique=True)
    await db.users.create_index("department_id")
    await db.products.create_index("id", unique=True)
    await db.products.create_index("order_number", unique=True)
    await db.products.create_index("batch_number")
    await db.products.create_index("current_stage")
    await db.products.create_index("current_department_id")
    await db.settings.create_index("key", unique=True)
