from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException

from models.product import (
    Product,
    ProductCreate,
    StageUpdateRequest,
    WorkflowStageConfig,
    ProductCompleteStepRequest,
)
from services import product_service
from utils.auth import require_admin, get_current_user
from utils.ws import manager as ws_manager

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/stages")
async def get_stages():
    workflow = await product_service.get_workflow()
    return {"stages": [s.name for s in workflow], "workflow": workflow}


@router.put("/workflow")
async def update_workflow(
    body: List[WorkflowStageConfig], _: dict = Depends(require_admin)
):
    steps = await product_service.set_workflow(body)
    return {"workflow": steps}


@router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    return await product_service.stage_stats(user)


@router.post("", response_model=Product)
async def create(body: ProductCreate, user: dict = Depends(require_admin)):
    product = await product_service.create_product(body, user["email"])
    await ws_manager.broadcast("product_created", product)
    return product


@router.get("", response_model=List[Product])
async def list_all(
    search: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    department_id = None if user.get("role") == "admin" else user.get("department_id")
    return await product_service.list_products(
        search=search, stage=stage, department_id=department_id
    )


@router.get("/order/{order_number}/status", response_model=Product)
async def get_by_order(order_number: str, _: dict = Depends(get_current_user)):
    return await product_service.get_product_by_order_number(order_number)


@router.get("/{product_id}", response_model=Product)
async def get_one(product_id: str, user: dict = Depends(get_current_user)):
    product = await product_service.get_product_by_id(product_id)
    if user.get("role") != "admin":
        if product.get("current_department_id") != user.get("department_id"):
            raise HTTPException(status_code=403, detail="Not allowed for your department")
    return product


@router.patch("/{product_id}/stage", response_model=Product)
async def update_stage(
    product_id: str,
    body: StageUpdateRequest,
    user: dict = Depends(require_admin),
):
    product = await product_service.update_product_stage(
        product_id, body.stage, body.note, user["email"]
    )
    await ws_manager.broadcast("product_updated", product)
    return product


@router.post("/{product_id}/complete-step", response_model=Product)
async def complete_step(
    product_id: str,
    body: ProductCompleteStepRequest,
    user: dict = Depends(get_current_user),
):
    product = await product_service.complete_current_step(product_id, user, body.note)
    await ws_manager.broadcast("product_updated", product)
    return product
