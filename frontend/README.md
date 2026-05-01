# StockFlow Frontend

Vite + React + Tailwind frontend for StockFlow.

## Quick Start

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Backend API

In local development, leave `VITE_API_URL` unset/commented. The Vite dev server proxies `/api` and `/health` to the backend at `http://localhost:4000`.

If the API is hosted separately, set:

```env
VITE_API_URL="https://your-api.example.com"
```
