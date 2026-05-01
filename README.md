# StockFlow

StockFlow is organized as a small full-stack MVP with separate frontend and backend projects.

## Project Structure

```text
frontend/  # Vite + React + Tailwind app
backend/   # Express + Prisma + SQLite API
```

## Run Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend defaults to:

```text
http://localhost:4000
```

## Run Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend defaults to:

```text
http://localhost:5173
```

For local development, leave `VITE_API_URL` unset/commented in `frontend/.env` so Vite proxies `/api` requests to the backend.

## Demo Login

After seeding the backend:

```text
Email: demo@stockflow.io
Password: demo1234
```
