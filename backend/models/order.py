from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
import uuid
import random
import string


class DispatchMethod(str, Enum):
    SHOPIFY = "shopify"
    PERSONAL_TAHIR = "personal_tahir"
    OUTSIDE_TCS = "outside_tcs"
    SHOP_JL = "shop_jl"
    SHOP_JT = "shop_jt"
    NONE = "none"

class OrderStatus(str, Enum):
    ONLINE_ORDER = "online_order"
    SHOP_ORDER = "shop_order"
    ADVANCE_PENDING = "advance_pending"
    ADVANCE_RECEIVED = "advance_received"
    NAME_LOGO_DESIGN = "name_logo_design"
    CUSTOM_LOGO_APPROVAL = "custom_logo_approval"
    CUTTING_STITCHING = "cutting_stitching"
    QUALITY_CONTROL = "quality_control"
    PRESS_PACK = "press_pack"
    READY_TO_DISPATCH = "ready_to_dispatch"
    DISPATCHED = "dispatched"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"

ORDER_STATUS_FLOW = [
    OrderStatus.ONLINE_ORDER,
    OrderStatus.ADVANCE_PENDING,
    OrderStatus.ADVANCE_RECEIVED,
    OrderStatus.NAME_LOGO_DESIGN,
    OrderStatus.CUSTOM_LOGO_APPROVAL,
    OrderStatus.CUTTING_STITCHING,
    OrderStatus.QUALITY_CONTROL,
    OrderStatus.PRESS_PACK,
    OrderStatus.READY_TO_DISPATCH,
    OrderStatus.DISPATCHED,
    OrderStatus.DELIVERED,
]

ORDER_STATUS_LABELS = {
    OrderStatus.ONLINE_ORDER: "Online Order",
    OrderStatus.SHOP_ORDER: "Shop Order",
    OrderStatus.ADVANCE_PENDING: "Advance Pending",
    OrderStatus.ADVANCE_RECEIVED: "Advance Received",
    OrderStatus.NAME_LOGO_DESIGN: "Name / Logo Design",
    OrderStatus.CUSTOM_LOGO_APPROVAL: "Custom Logo Approval",
    OrderStatus.CUTTING_STITCHING: "Cutting / Stitching",
    OrderStatus.QUALITY_CONTROL: "Quality Control (QC)",
    OrderStatus.PRESS_PACK: "Press / Pack",
    OrderStatus.READY_TO_DISPATCH: "Ready to Dispatch",
    OrderStatus.DISPATCHED: "Dispatched",
    OrderStatus.DELIVERED: "Delivered",
    OrderStatus.CANCELLED: "Cancelled",
    OrderStatus.RETURNED: "Returned & Restocked",
}


def generate_order_number() -> str:
    prefix = "EN-"
    part1 = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    part2 = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}{part1}-{part2}"


class ShippingAddress(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)
    phone: str = Field(..., min_length=5, max_length=20)
    street: str = Field(..., min_length=1, max_length=300)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    zip_code: str = Field(..., min_length=3, max_length=20)
    country: str = Field(default="Pakistan", max_length=60)


class OrderItem(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    product_name: str
    product_image: Optional[str] = None
    variant_label: Optional[str] = None
    quantity: int
    line_total: float = 0.0
    customizations: Optional[dict] = None


class OrderStatusEntry(BaseModel):
    status: OrderStatus
    note: Optional[str] = None
    changed_by: str = "system"
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(BaseModel):
    shipping_address: ShippingAddress
    payment_method: str = "cod"  # cod = cash on delivery
    note: Optional[str] = None
    appointment: Optional[dict] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: Optional[str] = None
    dispatch_method: Optional[DispatchMethod] = None
    cancellation_remark: Optional[str] = None


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = Field(default_factory=generate_order_number)
    customer_id: str
    customer_name: str = ""
    customer_email: str = ""
    customer_phone: str = ""
    items: List[OrderItem] = []
    shipping_address: Optional[ShippingAddress] = None
    subtotal: float = 0.0
    shipping_fee: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    status: OrderStatus = OrderStatus.ONLINE_ORDER
    status_history: List[OrderStatusEntry] = []
    payment_method: str = "cod"
    payment_status: str = "pending"  # pending, paid, refunded
    note: Optional[str] = None
    is_pos_order: bool = False  # True for in-store POS orders
    dispatch_method: DispatchMethod = DispatchMethod.NONE
    cancellation_remark: Optional[str] = None
    appointment: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CartItemForPOS(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int = Field(default=1, ge=1)


class POSCheckoutRequest(BaseModel):
    items: List[CartItemForPOS] = []
    payment_method: str = "cash"
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    note: Optional[str] = None
