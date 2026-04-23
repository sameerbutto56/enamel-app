from typing import Optional, List
from fastapi import APIRouter, Query

from services import catalog_service

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/categories")
async def list_categories():
    return await catalog_service.list_categories()


@router.get("/products")
async def list_products(
    search: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    featured: bool = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return await catalog_service.list_catalog_products(
        search=search, category_id=category_id,
        min_price=min_price, max_price=max_price,
        featured_only=featured, page=page, limit=limit,
    )


@router.get("/products/{product_id}")
async def get_product(product_id: str):
    return await catalog_service.get_catalog_product_by_id(product_id)
