from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
import uuid


STAGES: List[str] = [
    "Order Received",
    "Material Assigned",
    "Cutting/Preparation",
    "Stitching",
    "Quality Check",
    "Packaging",
    "Ready/Dispatched",
]


class StageHistoryEntry(BaseModel):
    stage: str
    note: Optional[str] = None
    changed_by: str  # user email
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WorkflowStageConfig(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    department_id: str = Field(..., min_length=1, max_length=40)
    deadline_hours: int = Field(..., ge=1, le=720)


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    order_number: str = Field(..., min_length=1, max_length=60)
    batch_number: str = Field(..., min_length=1, max_length=60)


class StageUpdateRequest(BaseModel):
    stage: str
    note: Optional[str] = None


class ProductCompleteStepRequest(BaseModel):
    note: Optional[str] = None


class ProductWorkflowStep(BaseModel):
    index: int
    stage: str
    department_id: str
    deadline_hours: int
    status: str = "pending"  # pending|current|completed
    deadline_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None


class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    order_number: str
    batch_number: str
    current_stage: str = STAGES[0]
    current_department_id: str = "order"
    workflow_steps: List[ProductWorkflowStep] = []
    history: List[StageHistoryEntry] = []
    created_by: str  # user email
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
