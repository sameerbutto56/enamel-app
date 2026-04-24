from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException

from models.catalog import (
    CatalogProduct,
    CatalogProductCreate,
    CatalogProductUpdate,
    ProductCategory,
    CategoryCreate,
    StockUpdateRequest,
)
from utils.db import get_db


# ── Categories ──────────────────────────────────────────────

async def create_category(data: CategoryCreate) -> dict:
    db = get_db()
    existing = await db.categories.find_one({"slug": data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists")
    category = ProductCategory(**data.model_dump())
    doc = category.model_dump()
    await db.categories.insert_one(doc)
    return await get_category_by_id(category.id)


async def list_categories() -> List[dict]:
    db = get_db()
    cursor = db.categories.find({"is_active": True}, {"_id": 0}).sort("sort_order", 1)
    return await cursor.to_list(length=200)


async def get_category_by_id(category_id: str) -> dict:
    db = get_db()
    doc = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found")
    return doc


# ── Logos ───────────────────────────────────────────────────

async def create_logo(data: dict) -> dict:
    db = get_db()
    from models.logo import Logo
    logo = Logo(**data)
    doc = logo.model_dump()
    await db.logos.insert_one(doc)
    return doc

async def list_logos() -> List[dict]:
    db = get_db()
    cursor = db.logos.find({"is_active": True}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=100)

async def delete_logo(logo_id: str) -> bool:
    db = get_db()
    result = await db.logos.delete_one({"id": logo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Logo not found")
    return True


# ── Products ────────────────────────────────────────────────

async def create_catalog_product(data: CatalogProductCreate, user_email: str) -> dict:
    db = get_db()
    existing = await db.catalog.find_one({"sku": data.sku.strip().upper()})
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")

    now = datetime.now(timezone.utc)
    product = CatalogProduct(
        name=data.name,
        description=data.description,
        short_description=data.short_description,
        category_id=data.category_id,
        price=data.price,
        compare_at_price=data.compare_at_price,
        sku=data.sku.strip().upper(),
        images=[img.model_dump() for img in data.images],
        variants=[v.model_dump() for v in data.variants],
        tags=data.tags,
        stock_qty=data.stock_qty,
        is_active=data.is_active,
        created_by=user_email,
        created_at=now,
        updated_at=now,
    )
    doc = product.model_dump()
    await db.catalog.insert_one(doc)
    return await get_catalog_product_by_id(product.id)


async def update_catalog_product(product_id: str, data: CatalogProductUpdate) -> dict:
    db = get_db()
    existing = await db.catalog.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Convert nested models to dicts
    if "images" in update_data and update_data["images"] is not None:
        update_data["images"] = [
            img if isinstance(img, dict) else img.model_dump()
            for img in update_data["images"]
        ]
    if "variants" in update_data and update_data["variants"] is not None:
        update_data["variants"] = [
            v if isinstance(v, dict) else v.model_dump()
            for v in update_data["variants"]
        ]

    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.catalog.update_one({"id": product_id}, {"$set": update_data})
    return await get_catalog_product_by_id(product_id)


async def delete_catalog_product(product_id: str) -> bool:
    db = get_db()
    result = await db.catalog.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return True


async def get_catalog_product_by_id(product_id: str) -> dict:
    db = get_db()
    doc = await db.catalog.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if "images" in doc:
        for img in doc["images"]:
            if "type" not in img:
                img["type"] = "image"
    return doc


async def list_catalog_products(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    tags: Optional[List[str]] = None,
    active_only: bool = True,
    featured_only: bool = False,
    page: int = 1,
    limit: int = 20,
) -> dict:
    db = get_db()
    query: dict = {}

    if active_only:
        query["is_active"] = True
    if featured_only:
        query["is_featured"] = True
    if category_id:
        query["category_id"] = category_id
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price"] = price_q
    if tags:
        query["tags"] = {"$in": tags}
    if search:
        regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"name": regex},
            {"description": regex},
            {"sku": regex},
            {"tags": regex},
        ]

    skip = (page - 1) * limit
    total = await db.catalog.count_documents(query)
    cursor = db.catalog.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)

    # Ensure backward compatibility for images
    for item in items:
        if "images" in item:
            for img in item["images"]:
                if "type" not in img:
                    img["type"] = "image"

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 0,
    }


async def update_stock(product_id: str, data: StockUpdateRequest) -> dict:
    db = get_db()
    product = await db.catalog.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    now = datetime.now(timezone.utc)
    if data.variant_id:
        # Update specific variant stock
        variants = product.get("variants", [])
        found = False
        for v in variants:
            if v.get("id") == data.variant_id:
                v["stock_qty"] = data.stock_qty
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Variant not found")
        await db.catalog.update_one(
            {"id": product_id},
            {"$set": {"variants": variants, "updated_at": now}},
        )
    else:
        await db.catalog.update_one(
            {"id": product_id},
            {"$set": {"stock_qty": data.stock_qty, "updated_at": now}},
        )
    return await get_catalog_product_by_id(product_id)


async def increment_product_stock(product_id: str, quantity: int, variant_id: Optional[str] = None):
    db = get_db()
    if variant_id:
        await db.catalog.update_one(
            {"id": product_id, "variants.id": variant_id},
            {"$inc": {"variants.$.stock_qty": quantity}}
        )
    else:
        await db.catalog.update_one(
            {"id": product_id},
            {"$inc": {"stock_qty": quantity}}
        )


async def seed_sample_catalog() -> None:
    """Seed some sample products if catalog is empty."""
    db = get_db()
    count = await db.catalog.count_documents({})
    if count > 0:
        return

    # Seed categories
    categories = [
        CategoryCreate(name="Scrubs", slug="scrubs", icon="🩺", sort_order=1),
        CategoryCreate(name="Lab Coats", slug="lab-coats", icon="🥼", sort_order=2),
        CategoryCreate(name="Surgical Caps", slug="surgical-caps", icon="🧢", sort_order=3),
        CategoryCreate(name="Shoes", slug="shoes", icon="👟", sort_order=4),
        CategoryCreate(name="Accessories", slug="accessories", icon="🎒", sort_order=5),
    ]
    cat_ids = {}
    for cat_data in categories:
        cat = ProductCategory(**cat_data.model_dump())
        cat_ids[cat_data.slug] = cat.id
        await db.categories.insert_one(cat.model_dump())

    # Seed products
    sample_products = [
        {
            "name": "Classic Navy Scrub Set",
            "description": "Premium cotton-blend scrub set with modern slim fit. Features multiple pockets, stretch fabric for comfort during long shifts, and antimicrobial treatment.",
            "short_description": "Comfortable navy scrub set with stretch fabric",
            "category_id": cat_ids["scrubs"],
            "price": 4500.0,
            "compare_at_price": 5500.0,
            "sku": "SCR-NAV-001",
            "tags": ["scrubs", "navy", "bestseller"],
            "stock_qty": 150,
            "is_featured": True,
            "images": [{"url": "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=600", "alt": "Navy scrub set"}],
        },
        {
            "name": "Surgical Green Scrub Top",
            "description": "Breathable surgical green scrub top with V-neck design. Perfect for operating rooms and clinical settings.",
            "short_description": "Classic surgical green V-neck top",
            "category_id": cat_ids["scrubs"],
            "price": 2500.0,
            "sku": "SCR-GRN-002",
            "tags": ["scrubs", "green", "surgical"],
            "stock_qty": 200,
            "images": [{"url": "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600", "alt": "Green scrub top"}],
        },
        {
            "name": "Premium White Lab Coat",
            "description": "Professional-grade white lab coat with full-length design. Made from wrinkle-resistant fabric with side vents for mobility.",
            "short_description": "Professional white lab coat, wrinkle-resistant",
            "category_id": cat_ids["lab-coats"],
            "price": 6500.0,
            "compare_at_price": 8000.0,
            "sku": "LAB-WHT-001",
            "tags": ["lab-coat", "white", "premium"],
            "stock_qty": 80,
            "is_featured": True,
            "images": [{"url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600", "alt": "White lab coat"}],
        },
        {
            "name": "Printed Surgical Cap - Floral",
            "description": "Fun and stylish surgical cap with floral print. Adjustable tie-back design with sweat-absorbing inner lining.",
            "short_description": "Floral print surgical cap with tie-back",
            "category_id": cat_ids["surgical-caps"],
            "price": 800.0,
            "sku": "CAP-FLR-001",
            "tags": ["cap", "surgical", "floral", "printed"],
            "stock_qty": 300,
            "images": [{"url": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600", "alt": "Floral surgical cap"}],
        },
        {
            "name": "Anti-Fatigue Medical Clogs",
            "description": "Ergonomic medical clogs with arch support and slip-resistant soles. Lightweight EVA construction for all-day comfort.",
            "short_description": "Ergonomic clogs with arch support",
            "category_id": cat_ids["shoes"],
            "price": 3500.0,
            "compare_at_price": 4200.0,
            "sku": "SHO-CLG-001",
            "tags": ["shoes", "clogs", "anti-fatigue"],
            "stock_qty": 120,
            "is_featured": True,
            "images": [{"url": "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600", "alt": "Medical clogs"}],
        },
        {
            "name": "Stethoscope Holder Lanyard",
            "description": "Premium leather stethoscope holder with adjustable lanyard. Available in multiple colors.",
            "short_description": "Leather stethoscope holder lanyard",
            "category_id": cat_ids["accessories"],
            "price": 1200.0,
            "sku": "ACC-LAN-001",
            "tags": ["accessories", "stethoscope", "leather"],
            "stock_qty": 250,
            "images": [{"url": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600", "alt": "Stethoscope holder"}],
        },
        {
            "name": "Burgundy Jogger Scrub Pants",
            "description": "Modern jogger-style scrub pants in rich burgundy. Elastic waistband with drawstring, tapered leg, and cargo pockets.",
            "short_description": "Jogger-style scrub pants in burgundy",
            "category_id": cat_ids["scrubs"],
            "price": 2800.0,
            "sku": "SCR-BRG-003",
            "tags": ["scrubs", "burgundy", "jogger", "pants"],
            "stock_qty": 175,
            "images": [{"url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600", "alt": "Burgundy scrub pants"}],
        },
        {
            "name": "Embroidered Medical Badge Reel",
            "description": "Retractable badge reel with custom medical embroidery. Clip-on design fits all ID badges.",
            "short_description": "Retractable badge reel with medical design",
            "category_id": cat_ids["accessories"],
            "price": 450.0,
            "sku": "ACC-BDG-001",
            "tags": ["accessories", "badge", "embroidered"],
            "stock_qty": 500,
            "images": [{"url": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600", "alt": "Badge reel"}],
        },
    ]

    now = datetime.now(timezone.utc)
    for p in sample_products:
        product = CatalogProduct(
            name=p["name"],
            description=p.get("description"),
            short_description=p.get("short_description"),
            category_id=p.get("category_id"),
            price=p["price"],
            compare_at_price=p.get("compare_at_price"),
            sku=p["sku"],
            images=p.get("images", []),
            tags=p.get("tags", []),
            stock_qty=p.get("stock_qty", 0),
            is_featured=p.get("is_featured", False),
            is_active=True,
            created_by="system",
            created_at=now,
            updated_at=now,
        )
        await db.catalog.insert_one(product.model_dump())
