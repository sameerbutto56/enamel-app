from fastapi import APIRouter, Depends

from models.user import LoginRequest, LoginResponse, UserPublic, EmployeeUpsertRequest
from services.auth_service import authenticate, upsert_employee, list_employees
from utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    return await authenticate(body.email, body.password)


@router.get("/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return user


@router.post("/employees")
async def create_or_update_employee(
    body: EmployeeUpsertRequest, _: dict = Depends(require_admin)
):
    return await upsert_employee(body)


@router.get("/employees")
async def get_employees(_: dict = Depends(require_admin)):
    return await list_employees()


@router.get("/employees/list")
async def get_employees_list(_: dict = Depends(require_admin)):
    return await list_employees()
