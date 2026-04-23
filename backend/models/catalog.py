from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
import uuid


class ProductCategory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=80)
    slug: str = Field(..., min_length=1, max_length=80)
    description: Optional[str] = None
    icon: Optional[str] = None  # emoji or icon name
    image_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductVariant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    size: Optional[str] = None
    color: Optional[str] = None
    color_hex: Optional[str] = None
    sku: str = Field(..., min_length=1, max_length=60)
    price_override: Optional[float] = None  # if None, use base price
    stock_qty: int = Field(default=0, ge=0)
    is_active: bool = True


class ProductMedia(BaseModel):
    url: str
    type: str = "image"  # "image" or "video"
    alt: Optional[str] = None
    sort_order: int = 0


class CatalogProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=300)
    category_id: Optional[str] = None
    price: float = Field(..., gt=0)
    compare_at_price: Optional[float] = None  # original price for showing discount
    sku: str = Field(..., min_length=1, max_length=60)
    images: List[ProductMedia] = []
    variants: List[ProductVariant] = []
    tags: List[str] = []
    stock_qty: int = Field(default=0, ge=0)
    is_active: bool = True


class CatalogProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=300)
    category_id: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    compare_at_price: Optional[float] = None
    sku: Optional[str] = Field(None, min_length=1, max_length=60)
    images: Optional[List[ProductMedia]] = None
    variants: Optional[List[ProductVariant]] = None
    tags: Optional[List[str]] = None
    stock_qty: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class CatalogProduct(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    category_id: Optional[str] = None
    price: float
    compare_at_price: Optional[float] = None
    sku: str
    images: List[ProductMedia] = []
    variants: List[ProductVariant] = []
    tags: List[str] = []
    stock_qty: int = 0
    total_sold: int = 0
    average_rating: float = 0.0
    review_count: int = 0
    is_active: bool = True
    is_featured: bool = False
    created_by: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    slug: str = Field(..., min_length=1, max_length=80)
    description: Optional[str] = None
    icon: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int = 0


class StockUpdateRequest(BaseModel):
    stock_qty: int = Field(..., ge=0)
    variant_id: Optional[str] = None  # if updating a specific variant
