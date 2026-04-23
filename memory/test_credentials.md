# Test Credentials

## Admin
- Email: `admin@enamels.com`
- Password: `admin123`
- Role: `admin`

## Auth Endpoints
- POST `/api/auth/login` — body: `{ "email": "...", "password": "..." }` → returns `{ access_token, token_type, user }`
- GET `/api/auth/me` — requires `Authorization: Bearer <token>` header → returns current user

## Product Endpoints (all require Bearer token for admin)
- GET `/api/products/stages` (public) — returns list of 7 stages
- GET `/api/products/stats` — dashboard counts per stage
- POST `/api/products` — body: `{ name, product_id, batch_number }`
- GET `/api/products?search=&stage=` — list with filters
- GET `/api/products/{id}` — product detail
- PATCH `/api/products/{id}/stage` — body: `{ stage, note? }`

## Stages (in order)
1. Order Received
2. Material Assigned
3. Cutting/Preparation
4. Stitching
5. Quality Check
6. Packaging
7. Ready/Dispatched
