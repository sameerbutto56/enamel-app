from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
import uuid


class CartItemAdd(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0, le=99)  # 0 means remove


class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = 1
    # snapshot of product info at time of adding
    product_name: str = ""
    product_image: Optional[str] = None
    unit_price: float = 0.0
    variant_label: Optional[str] = None  # e.g. "Large / Red"
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = []
    item_count: int = 0
    subtotal: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
