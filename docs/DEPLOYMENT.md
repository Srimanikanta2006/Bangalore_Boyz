# ClimateShield — Production Deployment Guide

## 1. System Architecture

```text
                    ┌─────────────────────┐
                    │      VERCEL         │
                    │ React/Vite Frontend │
                    └──────────┬──────────┘
                               │ HTTPS
                               ▼
                    ┌─────────────────────┐
                    │       RENDER        │
                    │ ClimateShield API   │
                    │ Express Backend     │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
           Supabase        Gemini API      Rescue API
          PostgreSQL        server-side       │
                                               ▼
                                            Render
                                         Rescue Service
```

---

## 2. Deployment Blueprint & Services

### A. Managed Database: Supabase PostgreSQL
- **Database Engine**: Hosted PostgreSQL (Supabase)
- **Runtime Pooler URL (`DATABASE_URL`)**: `postgresql://postgres.[REF]:[PASS]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Direct Migration URL (`DIRECT_URL`)**: `postgresql://postgres.[REF]:[PASS]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`
- **Migrations Command**: `npx prisma migrate deploy`
- **Seed Command**: `npx prisma db seed`

### B. Primary Express API: Render Web Service
- **Service Name**: `climateshield-backend`
- **Root Directory**: `cline_backend`
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Health Endpoint**: `/api/health`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: (Provided automatically by Render)
  - `DATABASE_URL`: (Supabase pooled URL)
  - `DIRECT_URL`: (Supabase direct migration URL)
  - `JWT_SECRET`: (Long random secret string)
  - `GEMINI_API_KEY`: (Google AI Studio key for live orchestration, or empty for deterministic fallback)
  - `CORS_ORIGIN`: `*` (or your production Vercel URL `https://climateshield.vercel.app`)

### C. Tactical Rescue Microservice: Render Web Service
- **Service Name**: `climateshield-rescue`
- **Root Directory**: `backend`
- **Environment**: Node
- **Start Command**: `npx tsx src/rescueServer.ts`
- **Health Endpoint**: `/health`
- **Port**: Auto-assigned by Render (`process.env.PORT`)

### D. Single Page Application (SPA) Frontend: Vercel
- **Framework**: Vite / React
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**:
  - `VITE_API_URL`: `https://climateshield-api.onrender.com` (Your deployed Render backend URL)

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Render Deployment (Backend & Rescue)
1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect the `Bangalore_Boyz` GitHub repository (branch: `feature/climateshield-mvp`).
4. Render will automatically detect `render.yaml` and prompt for required environment secrets (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `GEMINI_API_KEY`).
5. Click **Apply**.
6. Once deployed, note down the backend URL (e.g. `https://climateshield-backend.onrender.com`).

### Step 2: Vercel Deployment (Frontend)
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import the `Bangalore_Boyz` repository.
4. Set **Root Directory** to `client`.
5. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: `https://climateshield-backend.onrender.com` (Your Render API URL)
6. Click **Deploy**.

---

## 4. Post-Deployment Verification & Smoke Tests

### Backend Health Check
```bash
curl https://climateshield-backend.onrender.com/api/health
```
Expected Output:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

### Full E2E Integration Audit
Run the automated end-to-end audit against your live production endpoints:
```bash
E2E_GOV_URL=https://climateshield-backend.onrender.com/api \
E2E_RESCUE_URL=https://climateshield-rescue.onrender.com/api \
python scripts/run_e2e_full_audit.py
```
Expected Output: `12/12 Steps PASSED [100%]`.
