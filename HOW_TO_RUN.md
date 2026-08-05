# 🚀 How to Run the Application

This application uses **Supabase** as the database backend. The app has a graceful fallback to in-memory data when Supabase is not configured, but for full functionality (user accounts, orders, persistent data) you must configure Supabase.

---

## 📋 Prerequisites

1. **Node.js** >= 14
2. A **Supabase** project (free at https://supabase.com)
   - Get your **Project URL** and **anon public key** from:
     `Supabase Dashboard → Project Settings → API`

---

## 🔧 Local Development

### 1. Configure Environment Variables

**Backend** — copy `backend/.env.example` to `backend/.env` and fill in real values:
```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env   # Mac/Linux
```
Edit `backend/.env`:
```env
PORT=5000
JWT_SECRET=velux_kicks_secret_key_2024
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...your-real-anon-key
ADMIN_EMAIL=admin@veluxkicks.com
ADMIN_PASSWORD=admin@12341
```

> ⚠️ **CRITICAL**: `SUPABASE_ANON_KEY` must be the JWT **anon public key** (a long string starting with `eyJ...`). It is **NOT** a URL like `https://...supabase.co/rest/v1/`. Using a URL here will silently disable the database.

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:
```bash
cd frontend
copy .env.example .env   # Windows
# cp .env.example .env   # Mac/Linux
```
Edit `frontend/.env`:
```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...your-real-anon-key
```

### 2. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Run the App

**Option A — Run both together (from project root):**
```bash
npm run dev
```

**Option B — Run separately:**

Backend (Terminal 1):
```bash
cd backend
npm start
```
Expected output:
```text
✅ Supabase Database Client initialized successfully
🚀 Server running on port 5000 (Connected to Supabase)
```

Frontend (Terminal 2):
```bash
cd frontend
npm start
```
Open: http://localhost:3000

---

## ☁️ Vercel Hosting Setup

### 1. Environment Variables (REQUIRED)

Since `.env` files are gitignored, you **must** set environment variables in the Vercel Dashboard:

`Vercel Dashboard → your project → Settings → Environment Variables`

Add these variables (for **Production**, **Preview**, and **Development** environments):

| Variable | Value | Notes |
|----------|-------|-------|
| `SUPABASE_URL` | `https://your-project-ref.supabase.co` | From Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | The JWT anon key (starts with `eyJ`). **NOT a URL!** |
| `JWT_SECRET` | `velux_kicks_secret_key_2024` | Or your own secret |
| `ADMIN_EMAIL` | `admin@veluxkicks.com` | Admin login email |
| `ADMIN_PASSWORD` | `admin@12341` | Admin login password |

> ⚠️ **Do NOT set `REACT_APP_API_BASE_URL` in Vercel.** The frontend automatically uses relative `/api` routes on Vercel (same-origin), which is correct.

### 2. Deploy

```bash
vercel --prod
```

Or push to your connected Git branch — Vercel will auto-deploy.

### 3. Verify

After deployment, check the health endpoint:
```
https://your-app.vercel.app/api/health
```
You should see:
```json
{
  "success": true,
  "supabase_connected": true,
  "database_status": "connected",
  ...
}
```

If `supabase_connected` is `false` or `database_status` is `disconnected`, your `SUPABASE_ANON_KEY` is missing or invalid.

---

## 🔍 Troubleshooting Database Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `supabase_connected: false` | `SUPABASE_ANON_KEY` missing or invalid | Set the real JWT anon key in Vercel env vars |
| `/api/health` returns 500 error | `SUPABASE_URL` not imported in code | ✅ Fixed in this update |
| App shows hardcoded products only | Supabase not connected (fallback mode) | Set correct `SUPABASE_ANON_KEY` |
| `SUPABASE_ANON_KEY` looks like a URL | Wrong value used | Use the JWT key from Supabase Dashboard → API → "anon public" |
| Admin login fails | Wrong `ADMIN_EMAIL`/`ADMIN_PASSWORD` | Set them in Vercel env vars |

---

## 👤 Admin Credentials

- **Email**: `admin@veluxkicks.com`
- **Password**: `admin@12341`

(Override with `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars)