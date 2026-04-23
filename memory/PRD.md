# Enamels — Inventory & Production Tracking System

## Overview
Internal mobile app for the "Enamels" manufacturing company to track products through 7 production stages in real time. Admins can create products, advance stages (with optional notes), and watch updates propagate live to every connected device via WebSockets.

## Stack
- **Frontend**: Expo (React Native, expo-router, SDK 54)
- **Backend**: FastAPI (MVC-style: models / services / controllers / utils)
- **DB**: MongoDB (Motor async driver)
- **Real-time**: Native FastAPI WebSocket (`/api/ws`) + RN `WebSocket` client with auto-reconnect

## Production Stages (fixed workflow)
1. Order Received  2. Material Assigned  3. Cutting/Preparation  4. Stitching  5. Quality Check  6. Packaging  7. Ready/Dispatched

## Auth
JWT (Bearer) — admin seeded on startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars.
Default: `admin@enamels.com` / `admin123` (see `/app/memory/test_credentials.md`).

## REST API (`/api` prefix)
- `POST /auth/login`, `GET /auth/me`
- `POST /products`, `GET /products?search=&stage=`, `GET /products/{id}`
- `PATCH /products/{id}/stage` (body: `{stage, note?}`)
- `GET /products/stats` — dashboard counts per stage
- `GET /products/stages` — ordered list of 7 stages

## WebSocket Events
Connect: `wss://<host>/api/ws`
Server → Client events:
- `connected` — handshake
- `product_created` — after POST /products
- `product_updated` — after PATCH /products/{id}/stage
Payload: full product document (id, name, product_id, batch_number, current_stage, history[], created_by, created_at, updated_at).

## Frontend Screens
- `/login` — admin login
- `/(tabs)/dashboard` — stats bento + pipeline breakdown + LIVE indicator
- `/(tabs)/products` — search + 8 stage filter chips + list
- `/(tabs)/create` — new product form (name, product_id, batch_number)
- `/(tabs)/profile` — user info + sign out
- `/product/[id]` — stage chip, progress dots, advance/change stage modal, full reverse-chronological timeline with notes

## Real-time Flow
Admin PATCH /products/{id}/stage → service updates Mongo → controller awaits `ws_manager.broadcast("product_updated", product)` → every connected client's `onmessage` fires → dashboard refetches stats, products list refetches, product detail replaces its state if the id matches → UI updates with **no manual refresh**.

## Project Structure
```
/app/backend
  server.py              # FastAPI app, startup (seed admin + indexes), WS endpoint
  models/                # Pydantic: user, product (+ STAGES, StageHistoryEntry)
  services/              # auth_service, product_service (CRUD + stats)
  controllers/           # auth_controller, product_controller (REST routes + WS broadcast)
  utils/                 # db, auth (JWT/bcrypt), ws (ConnectionManager)
/app/frontend
  app/
    _layout.tsx          # AuthProvider + SafeArea + gesture root
    index.tsx            # auth-aware redirect
    login.tsx
    (tabs)/              # dashboard, products, create, profile + _layout
    product/[id].tsx     # detail + timeline + stage modal
  src/
    api/client.ts        # axios + token storage (SecureStore / localStorage)
    api/AuthContext.tsx  # login/logout + auto WS connect/disconnect
    api/socket.ts        # WebSocket singleton + pub/sub + reconnect
    components/StageChip.tsx
    theme.ts             # Swiss high-contrast industrial palette + stage colors
```

## Business Enhancement Hook
The stats endpoint and timeline data are structured for straightforward ERP expansion — stage SLAs, throughput metrics, and per-stage bottleneck reports can be added on top of `stage_history` without schema migration.

## Environment Variables
Backend `.env`: `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
Frontend `.env`: `EXPO_PUBLIC_BACKEND_URL` (protected, pre-configured)
