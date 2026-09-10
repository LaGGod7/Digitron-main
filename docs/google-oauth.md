# Google OAuth Setup Guide

This guide explains how to configure Google Sign-In for Digitron.

---

## 1. Google Cloud Console Setup

### Step 1: Create or select a project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown → **New Project**
3. Name it **Digitron** → Click **Create**

### Step 2: Enable the Google+ API / People API
1. Navigate to **APIs & Services → Library**
2. Search for **"Google People API"** → Enable it

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** → Click Create
3. Fill in:
   - **App name**: `Digitron Associates`
   - **User support email**: `laggod717@gmail.com` (or client's preferred email)
   - **Developer contact email**: same email
4. Click **Save and Continue** through all steps
5. Under **Test users**, add any Gmail addresses you need to test with during development

### Step 4: Create OAuth 2.0 Credentials
1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth 2.0 Client IDs**
3. Set **Application type** to **Web application**
4. Name it: `Digitron Web Client`
5. Under **Authorised redirect URIs**, add **BOTH**:
   ```
   https://digitronx.vercel.app/api/auth/google/callback
   http://localhost:5000/api/auth/google/callback
   ```
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

---

## 2. Update `backend/.env`

Open `Digitron-main/backend/.env` and set:

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"
GOOGLE_CALLBACK_URL="https://digitronx.vercel.app/api/auth/google/callback"
```

For **local development**, temporarily change `GOOGLE_CALLBACK_URL`:
```env
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"
```

> ⚠️ Remember to switch back to the production URL before deploying.

---

## 3. Current Credentials (already configured)

| Key | Value |
|-----|-------|
| Client ID | `386607643312-66rhnfs15un6doir1qc8mms7fv4h15o5.apps.googleusercontent.com` |
| Callback (production) | `https://digitronx.vercel.app/api/auth/google/callback` |
| Gmail Account | `laggod717@gmail.com` |

> 🔐 The Client Secret is stored in `backend/.env` and must **never** be committed to Git.

---

## 4. Verify Google Auth Works

1. Start the backend: `cd backend && npm start`
2. Start the frontend: `npm run dev`
3. Open `http://localhost:5173`
4. Click **Sign in with Google**
5. You should be redirected to Google's login page → after login, redirected back to `/profile`

### Troubleshooting

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Add `http://localhost:5000/api/auth/google/callback` to Google Cloud Console → Credentials → Redirect URIs |
| `Internal Server Error` | MongoDB not connected — check `MONGODB_URI` in `.env` and ensure your IP is whitelisted in Atlas |
| `Google login is not configured` | `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` missing from `.env` |
| `access_denied` | App is in Test mode — add your email to Test users in OAuth Consent Screen |

---

## 5. MongoDB Atlas IP Whitelist

Google OAuth requires sessions, which are stored in MongoDB. If the DB is unreachable, auth will fail.

1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Go to **Network Access → IP Access List**
3. Click **Add IP Address**
4. For development: add your current IP
5. For production (Vercel): add `0.0.0.0/0` (allow all) — Vercel uses dynamic IPs

---

## 6. Publishing the OAuth App (Before Client Handoff)

When you're ready for production:
1. Go to **OAuth Consent Screen**
2. Click **Publish App**
3. This removes the "Test users only" restriction and allows any Google user to sign in
