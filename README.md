# Digitron Associates — CCTV & Security Solutions

> **Full-stack e-commerce storefront** for a CCTV/security products dealer. Built with React + Vite (frontend), Node.js + Express (backend), MongoDB Atlas (database), and Google OAuth (customer login).

🔗 **Live site**: [digitronx.vercel.app](https://digitronx.vercel.app)  
🛠 **Admin panel**: [digitronx.vercel.app/admin](https://digitronx.vercel.app/admin)  
📚 **Full docs**: [`docs/deployment.md`](./docs/deployment.md)

---

## Features

- 📦 **Product Catalogue** — 110 curated CCTV products across 11 categories
- 🔍 **Filter & Compare** — filter by category, brand, resolution, type
- 🛒 **Cart & Quote Request** — add to cart, submit quote requests via email
- 🔐 **Google Sign-In** — customers can login with their Google account
- 📋 **Admin Dashboard** — manage products, view quotes, customize store settings
- 📱 **WhatsApp Integration** — floating WhatsApp button for instant support
- 📧 **Email Notifications** — quote request emails sent via Gmail SMTP
- 🌙 **Responsive Design** — works on mobile, tablet, and desktop

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas (via Prisma) |
| Auth | Google OAuth 2.0 (Passport.js) |
| Email | Nodemailer + Gmail SMTP |
| Deployment | Vercel |

---

## Quick Start (Local Development)

### 1. Install dependencies

```bash
# Install frontend packages
npm install

# Install backend packages
cd backend && npm install && cd ..
```

### 2. Configure environment

Edit `backend/.env` — all required values are already set for the current deployment. For local testing, change `GOOGLE_CALLBACK_URL`:

```env
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
FRONTEND_URL="http://localhost:5173"
```

### 3. Start the servers

```bash
# Terminal 1 — Backend
cd backend
npm start
# → Server running on port 5000

# Terminal 2 — Frontend
npm run dev
# → Local: http://localhost:5173
```

### 4. Verify

```bash
curl http://localhost:5000/api/health
# → {"ok":true,"database":"connected","googleAuth":"configured"}
```

---

## Admin Access

| URL | `http://localhost:5173/admin` (local) |
|-----|--------------------------------------|
| Username | `admin` |
| Password | See `backend/.env` → `ADMIN_PASSWORD_HASH` |

To generate a new password hash:
```bash
cd backend
node -e "const bcrypt=require('bcrypt'); bcrypt.hash('YOUR_PASSWORD',10).then(h=>console.log(h));"
```

---

## Deployment

See [`docs/deployment.md`](./docs/deployment.md) for the complete guide including:
- MongoDB Atlas setup
- Vercel deployment
- Google OAuth configuration
- Gmail SMTP setup
- Environment variable reference

---

## Documentation

| Doc | Description |
|-----|-------------|
| [`docs/deployment.md`](./docs/deployment.md) | Complete deployment guide (Step 1 → Live) |
| [`docs/google-oauth.md`](./docs/google-oauth.md) | Google OAuth setup guide |
| [`docs/handover-checklist.md`](./docs/handover-checklist.md) | Client handover checklist |

---

## Project Structure

```
digitron/
├── src/                    # Frontend (React)
│   ├── pages/              # Page components
│   ├── components/         # Reusable UI components
│   ├── context/            # React context (Cart, Auth)
│   ├── services/           # API service functions
│   ├── data/               # Product catalogue data
│   └── styles/             # Global CSS
├── backend/                # Backend (Express)
│   ├── routes/             # API route handlers
│   ├── config/             # Database & state config
│   ├── utils/              # Helpers & logger
│   └── prisma/             # Prisma schema
├── public/                 # Static assets
│   └── productImages/      # Product photos (14 images)
├── docs/                   # Documentation
└── vercel.json             # Vercel routing config
```

---

## License

Proprietary — built for Digitron Associates. All rights reserved.
