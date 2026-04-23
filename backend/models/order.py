from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
import uuid
import random
import string


class OrderStatus(str, Enum):
    PLACED = "placed"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    RETURNED = "returned"


ORDER_STATUS_FLOW = [
    OrderStatus.PLACED,
    OrderStatus.CONFIRMED,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.OUT_FOR_DELIVERY,
    OrderStatus.DELIVERED,
]

ORDER_STATUS_LABELS = {
    OrderStatus.PLACED: "Order Placed",
    OrderStatus.CONFIRMED: "Order Confirmed",
    OrderStatus.PROCESSING: "Processing",
    OrderStatus.SHIPPED: "Shipped",
    OrderStatus.OUT_FOR_DELIVERY: "Out for Delivery",
    OrderStatus.DELIVERED: "Delivered",
    OrderStatus.CANCELLED: "Cancelled",
    OrderStatus.REFUNDED: "Refunded",
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
    unit_price: float
    quantity: int
    line_total: float = 0.0


class OrderStatusEntry(BaseModel):
    status: OrderStatus
    note: Optional[str] = None
    changed_by: str = "system"
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(BaseModel):
    shipping_address: ShippingAddress
    payment_method: str = "cod"  # cod = cash on delivery
    note: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: Optional[str] = None


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
    status: OrderStatus = OrderStatus.PLACED
    status_history: List[OrderStatusEntry] = []
    payment_method: str = "cod"
    payment_status: str = "pending"  # pending, paid, refunded
    note: Optional[str] = None
    is_pos_order: bool = False  # True for in-store POS orders
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
