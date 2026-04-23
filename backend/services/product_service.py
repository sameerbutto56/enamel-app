from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import HTTPException

from models.product import (
    Product,
    ProductCreate,
    StageHistoryEntry,
    STAGES,
    WorkflowStageConfig,
    ProductWorkflowStep,
)
from utils.db import get_db


def _default_workflow() -> List[WorkflowStageConfig]:
    # Default sequence used until admin customizes workflow.
    return [
        WorkflowStageConfig(name="Order Received", department_id="order", deadline_hours=12),
        WorkflowStageConfig(name="Material Assigned", department_id="material", deadline_hours=24),
        WorkflowStageConfig(
            name="Cutting/Preparation", department_id="cutting", deadline_hours=24
        ),
        WorkflowStageConfig(name="Stitching", department_id="stitching", deadline_hours=48),
        WorkflowStageConfig(name="Quality Check", department_id="qc", deadline_hours=24),
        WorkflowStageConfig(name="Packaging", department_id="packaging", deadline_hours=24),
        WorkflowStageConfig(
            name="Ready/Dispatched", department_id="dispatch", deadline_hours=24
        ),
    ]


async def get_workflow() -> List[WorkflowStageConfig]:
    db = get_db()
    doc = await db.settings.find_one({"key": "workflow"}, {"_id": 0, "steps": 1})
    if not doc or not doc.get("steps"):
        return _default_workflow()
    return [WorkflowStageConfig(**step) for step in doc["steps"]]


async def set_workflow(steps: List[WorkflowStageConfig]) -> List[WorkflowStageConfig]:
    if len(steps) < 2:
        raise HTTPException(status_code=400, detail="Workflow must have at least 2 stages")
    stage_names = [s.name for s in steps]
    if len(set(stage_names)) != len(stage_names):
        raise HTTPException(status_code=400, detail="Stage names must be unique")

    db = get_db()
    await db.settings.update_one(
        {"key": "workflow"},
        {"$set": {"steps": [s.model_dump() for s in steps]}},
        upsert=True,
    )
    return steps


def _build_product_steps(
    workflow: List[WorkflowStageConfig], start_time: datetime
) -> List[ProductWorkflowStep]:
    built: List[ProductWorkflowStep] = []
    for idx, step in enumerate(workflow):
        deadline_at = (
            start_time + timedelta(hours=step.deadline_hours) if idx == 0 else None
        )
        built.append(
            ProductWorkflowStep(
                index=idx,
                stage=step.name,
                department_id=step.department_id,
                deadline_hours=step.deadline_hours,
                status="current" if idx == 0 else "pending",
                deadline_at=deadline_at,
            )
        )
    return built


def _normalize_product_document(doc: dict, workflow: List[WorkflowStageConfig]) -> dict:
    if not doc.get("order_number"):
        doc["order_number"] = doc.get("product_id") or doc.get("id")
    if not doc.get("workflow_steps"):
        # Backfill legacy documents so response models remain valid.
        created_at = doc.get("created_at") or datetime.now(timezone.utc)
        doc["workflow_steps"] = [
            s.model_dump()
            for s in _build_product_steps(workflow, created_at)
        ]
        current_stage = doc.get("current_stage", workflow[0].name)
        found_current = False
        for step in doc["workflow_steps"]:
            if step["stage"] == current_stage and not found_current:
                step["status"] = "current"
                found_current = True
            elif not found_current:
                step["status"] = "completed"
            else:
                step["status"] = "pending"
        if not found_current:
            doc["workflow_steps"][0]["status"] = "current"
    if not doc.get("current_department_id"):
        current_stage = doc.get("current_stage")
        mapping = {w.name: w.department_id for w in workflow}
        doc["current_department_id"] = mapping.get(current_stage, workflow[0].department_id)
    return doc


async def create_product(data: ProductCreate, user_email: str) -> dict:
    db = get_db()
    order_number = data.order_number.strip().upper()
    existing = await db.products.find_one({"order_number": order_number})
    if existing:
        raise HTTPException(status_code=400, detail="Order number already exists")

    workflow = await get_workflow()
    initial_stage = workflow[0].name
    now = datetime.now(timezone.utc)
    steps = _build_product_steps(workflow, now)
    product = Product(
        name=data.name,
        order_number=order_number,
        batch_number=data.batch_number,
        current_stage=initial_stage,
        current_department_id=workflow[0].department_id,
        workflow_steps=steps,
        history=[
            StageHistoryEntry(
                stage=initial_stage,
                note="Product created",
                changed_by=user_email,
                changed_at=now,
            )
        ],
        created_by=user_email,
        created_at=now,
        updated_at=now,
    )
    doc = product.model_dump()
    await db.products.insert_one(doc)
    return await get_product_by_id(product.id)


async def list_products(
    search: Optional[str] = None,
    stage: Optional[str] = None,
    department_id: Optional[str] = None,
) -> List[dict]:
    db = get_db()
    query: dict = {}
    if stage and stage != "All":
        query["current_stage"] = stage
    if department_id:
        query["current_department_id"] = department_id
    if search:
        regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"name": regex},
            {"order_number": regex},
            {"batch_number": regex},
        ]
    cursor = db.products.find(query, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=1000)
    workflow = await get_workflow()
    return [_normalize_product_document(i, workflow) for i in items]


async def get_product_by_id(product_id: str) -> dict:
    db = get_db()
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    workflow = await get_workflow()
    return _normalize_product_document(product, workflow)


async def get_product_by_order_number(order_number: str) -> dict:
    db = get_db()
    normalized = order_number.strip().upper()
    product = await db.products.find_one({"order_number": normalized}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Order not found")
    workflow = await get_workflow()
    return _normalize_product_document(product, workflow)


async def update_product_stage(
    product_id: str, new_stage: str, note: Optional[str], user_email: str
) -> dict:
    workflow = await get_workflow()
    allowed = [w.name for w in workflow]
    if new_stage not in allowed:
        raise HTTPException(status_code=400, detail="Invalid stage")

    db = get_db()
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product["current_stage"] == new_stage:
        raise HTTPException(status_code=400, detail="Product is already at this stage")

    now = datetime.now(timezone.utc)
    entry = StageHistoryEntry(
        stage=new_stage,
        note=note,
        changed_by=user_email,
        changed_at=now,
    ).model_dump()

    await db.products.update_one(
        {"id": product_id},
        {
            "$set": {
                "current_stage": new_stage,
                "current_department_id": next(
                    (w.department_id for w in workflow if w.name == new_stage),
                    product.get("current_department_id", ""),
                ),
                "updated_at": now,
            },
            "$push": {"history": entry},
        },
    )
    return await get_product_by_id(product_id)


async def complete_current_step(product_id: str, user: dict, note: Optional[str]) -> dict:
    db = get_db()
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    steps = product.get("workflow_steps", [])
    if not steps:
        raise HTTPException(status_code=400, detail="Workflow is not configured on product")

    current_idx = next((i for i, s in enumerate(steps) if s.get("status") == "current"), -1)
    if current_idx < 0:
        raise HTTPException(status_code=400, detail="No current step found")

    current = steps[current_idx]
    is_admin = user.get("role") == "admin"
    if (not is_admin) and user.get("department_id") != current.get("department_id"):
        raise HTTPException(status_code=403, detail="You can only complete your department step")

    now = datetime.now(timezone.utc)
    steps[current_idx]["status"] = "completed"
    steps[current_idx]["completed_at"] = now
    steps[current_idx]["completed_by"] = user.get("email")

    next_stage = None
    next_department_id = current.get("department_id")
    if current_idx + 1 < len(steps):
        steps[current_idx + 1]["status"] = "current"
        steps[current_idx + 1]["deadline_at"] = now + timedelta(
            hours=int(steps[current_idx + 1]["deadline_hours"])
        )
        next_stage = steps[current_idx + 1]["stage"]
        next_department_id = steps[current_idx + 1]["department_id"]
    else:
        next_stage = steps[current_idx]["stage"]

    entry = StageHistoryEntry(
        stage=next_stage,
        note=note,
        changed_by=user.get("email", "system"),
        changed_at=now,
    ).model_dump()

    await db.products.update_one(
        {"id": product_id},
        {
            "$set": {
                "workflow_steps": steps,
                "current_stage": next_stage,
                "current_department_id": next_department_id,
                "updated_at": now,
            },
            "$push": {"history": entry},
        },
    )
    return await get_product_by_id(product_id)


async def stage_stats(user: Optional[dict] = None) -> dict:
    db = get_db()
    query = {}
    if user and user.get("role") != "admin":
        query["current_department_id"] = user.get("department_id")
    pipeline = []
    if query:
        pipeline.append({"$match": query})
    pipeline.append({"$group": {"_id": "$current_stage", "count": {"$sum": 1}}})
    results = await db.products.aggregate(pipeline).to_list(length=50)
    counts = {r["_id"]: r["count"] for r in results}
    total = sum(counts.values())
    workflow = await get_workflow()
    stage_names = [w.name for w in workflow]
    by_stage = [{"stage": s, "count": counts.get(s, 0)} for s in stage_names]
    payload = {"total": total, "by_stage": by_stage, "stages": stage_names}
    if user and user.get("role") != "admin":
        payload["department_id"] = user.get("department_id")
        payload["pending_in_department"] = total
    return payload
