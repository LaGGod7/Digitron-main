# Digitron — Full Deployment Guide

Step-by-step instructions from zero to a live production site handed off to the client.

---

## Overview

| Layer | Technology | Platform |
|-------|-----------|----------|
| Frontend | React + Vite | Vercel |
| Backend API | Node.js + Express | Vercel (serverless) |
| Database | MongoDB Atlas | Atlas Free Tier |
| Auth | Google OAuth 2.0 | Google Cloud Console |
| Email | Gmail SMTP + Nodemailer | Gmail App Password |

---

## Step 1 — Prerequisites

Install these tools before starting:

```bash
# Node.js 18+
node --version   # should be >= 18.0.0

# npm 9+
npm --version    # should be >= 9.0.0

# Git
git --version
```

---

## Step 2 — Clone & Install Dependencies

```bash
# Clone the repo
git clone <your-repo-url> digitron
cd digitron

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

---

## Step 3 — MongoDB Atlas Setup

1. Create a free account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a new **Cluster** (Free tier M0)
3. Create a **Database User**:
   - Username: `digitron_db_user`
   - Password: (generate a strong password)
   - Role: `Atlas Admin`
4. Whitelist IPs:
   - For local dev: add your current IP
   - For Vercel production: add `0.0.0.0/0`
5. Get the connection string: Click **Connect → Drivers** and copy the URI
6. Replace `<username>` and `<password>` in the URI

Your URI will look like:
```
mongodb+srv://digitron_db_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/digitron?retryWrites=true&w=majority
```

---

## Step 4 — Configure Environment Variables

Create/edit `backend/.env` with all required values:

```env
# MongoDB
MONGODB_URI="mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/digitron?retryWrites=true&w=majority"

# Email (Gmail SMTP)
EMAIL_USER="your-gmail@gmail.com"
EMAIL_PASS="your-app-password"    # 16-char Gmail App Password (NOT your normal Gmail password)

# Sessions
SESSION_SECRET="replace-with-long-random-string-min-32-chars"
SESSION_STORE="mongo"
PORT=5000

# Frontend URL
FRONTEND_URL="https://your-vercel-deployment.vercel.app"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"
GOOGLE_CALLBACK_URL="https://your-vercel-deployment.vercel.app/api/auth/google/callback"

# Admin Panel Access
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="$2b$10$..."   # bcrypt hash of admin password (see below)
```

### Generate Admin Password Hash

```bash
cd backend
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YOUR_ADMIN_PASSWORD',10).then(h=>console.log(h));"
```

Copy the output and paste it as `ADMIN_PASSWORD_HASH` in `.env`.

### Generate Gmail App Password

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Factor Authentication** if not already
3. Search for **"App Passwords"**
4. Generate one for **Mail** → copy the 16-character password
5. Use it as `EMAIL_PASS` in `.env`

---

## Step 5 — Run Prisma Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

This sets up the MongoDB schema (customers, reviews, quotes collections).

---

## Step 6 — Test Locally

### Start Backend
```bash
cd backend
npm start
# Should print: Server running on port 5000
```

### Start Frontend (in a new terminal)
```bash
cd ..          # back to project root
npm run dev
# Should print: Local: http://localhost:5173
```

### Verify Health Check
```bash
curl http://localhost:5000/api/health
# Expected: {"ok":true,"database":"connected","googleAuth":"configured"}
```

### Test Google Login
1. Open `http://localhost:5173`
2. Click **Sign in with Google**
3. Should redirect to Google and back to `/profile`

> ⚠️ For local Google login: temporarily change `GOOGLE_CALLBACK_URL` in `.env` to:
> `http://localhost:5000/api/auth/google/callback`

---

## Step 7 — Build Frontend for Production

```bash
# In project root
npm run build
# Output goes to /dist folder
```

---

## Step 8 — Deploy to Vercel

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from project root
vercel

# For production deployment
vercel --prod
```

### Option B: Vercel Dashboard (GitHub Integration)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repository
4. Set **Framework Preset** to **Vite**
5. Set **Build Command** to `npm run build`
6. Set **Output Directory** to `dist`

### Configure Environment Variables in Vercel

In Vercel Dashboard → Your Project → **Settings → Environment Variables**, add all variables from `backend/.env`:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your Atlas connection string |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASS` | Gmail App Password |
| `SESSION_SECRET` | Long random string |
| `SESSION_STORE` | `mongo` |
| `FRONTEND_URL` | `https://your-project.vercel.app` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://your-project.vercel.app/api/auth/google/callback` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of admin password |

### The `vercel.json` Routes

The project already has a `vercel.json` that routes all `/api/*` requests to the backend and all other requests to the frontend. No extra configuration needed.

---

## Step 9 — Post-Deployment Verification

After deploying, verify each of these:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Expected response:
# {"ok":true,"database":"connected","googleAuth":"configured"}
```

1. ✅ Homepage loads correctly
2. ✅ Products display with images
3. ✅ Google Sign-In works (redirects correctly)
4. ✅ Admin panel accessible at `/admin`
5. ✅ Contact form sends email
6. ✅ Quote request form works
7. ✅ WhatsApp button shows correct number

---

## Step 10 — Admin Panel Access

The admin panel is at: `https://your-domain.vercel.app/admin`

Default credentials:
- **Username**: `admin`
- **Password**: The password you used when generating `ADMIN_PASSWORD_HASH`

> 🔐 Change the admin password before handoff. Generate a new hash and update the env variable.

---

## Maintenance Notes

### Adding New Products
1. Edit `backend/site_settings.json` via the Admin Panel → **Settings** tab
2. Or update product data through the Admin → **Products** tab

### Updating Store Settings
1. Login to admin panel at `/admin`
2. Go to **Settings** tab
3. Update store name, phone, WhatsApp number, address, business hours, etc.

### MongoDB Backup
Enable Atlas automated backups:
1. Atlas Dashboard → Clusters → your cluster → **Backup**
2. Enable **Continuous Cloud Backup**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` on MongoDB | Check Atlas IP whitelist, add `0.0.0.0/0` for Vercel |
| Google OAuth "redirect_uri_mismatch" | Add production callback URL to Google Cloud Console Credentials |
| Emails not sending | Verify Gmail App Password (not regular password), check `EMAIL_USER` |
| Admin login fails | Re-generate `ADMIN_PASSWORD_HASH` with the correct password |
| Build fails | Run `npm install` in root AND `backend/` separately |
| Vercel 404 on page refresh | Confirm `vercel.json` has rewrite rule for SPA routing |
