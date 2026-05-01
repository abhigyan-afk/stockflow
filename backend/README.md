# StockFlow Backend

Express + Node.js API for StockFlow MVP.

## Stack

- Runtime: Node.js 20+
- Framework: Express 4
- Auth: JWT bearer tokens + bcrypt password hashing
- DB: SQLite for MVP speed
- ORM: Prisma
- Validation: zod

## Quick Start

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

The API runs on `http://localhost:4000` by default.

Demo credentials after seed:

- Email: `demo@stockflow.io`
- Password: `demo1234`

## Environment

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

## API Overview

All protected routes require:

```http
Authorization: Bearer <token>
```

### Health

- `GET /health`

### Auth

- `POST /api/auth/signup`

```json
{
  "email": "owner@example.com",
  "password": "secret123",
  "organizationName": "Acme Store"
}
```

- `POST /api/auth/login`

```json
{
  "email": "owner@example.com",
  "password": "secret123"
}
```

- `GET /api/auth/me`

### Products

- `GET /api/products?q=shirt`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/:id/adjust`

Product create/update payload:

```json
{
  "name": "Classic White Tee",
  "sku": "TEE-WHT-M",
  "description": "Crew-neck cotton t-shirt",
  "quantityOnHand": 120,
  "costPrice": 8.5,
  "sellingPrice": 24.99,
  "lowStockThreshold": 20
}
```

Stock adjustment payload:

```json
{
  "delta": -3,
  "note": "Damaged units removed"
}
```

### Dashboard

- `GET /api/dashboard`

Returns total products, total quantity, low-stock count/items, and inventory value.

### Settings

- `GET /api/settings`
- `PUT /api/settings`

```json
{
  "defaultLowStockThreshold": 10
}
```

## Tenant Scoping

Signup creates one organization and links the user to it. Protected routes derive `organizationId` from the JWT and scope all product/dashboard/settings operations to that organization.
