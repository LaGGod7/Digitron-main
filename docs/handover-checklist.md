# Client Handover Checklist — Digitron Associates

Use this checklist to verify everything is working before handing the project to the client.

---

## ✅ Pre-Handoff Checklist

### Infrastructure
- [ ] MongoDB Atlas cluster is running and accessible
- [ ] Atlas IP whitelist includes Vercel's IPs (`0.0.0.0/0`)
- [ ] MongoDB database user credentials are set in `backend/.env`
- [ ] Health check endpoint returns `{"ok":true}`: `GET /api/health`

### Google OAuth
- [ ] Google Cloud Console project created for client
- [ ] OAuth Consent Screen filled in with client's details
- [ ] OAuth App **Published** (not in Test mode)
- [ ] Both redirect URIs added (production + localhost for dev)
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in Vercel env vars
- [ ] Sign-in with Google tested and working on production URL

### Email (SMTP)
- [ ] Gmail 2FA enabled on client's account
- [ ] Gmail App Password generated and set as `EMAIL_PASS`
- [ ] Contact form tested — email received in inbox
- [ ] Quote request form tested — email received

### Admin Panel
- [ ] Admin URL given to client: `https://digitronx.vercel.app/admin`
- [ ] Admin password changed to a new secure password
- [ ] New `ADMIN_PASSWORD_HASH` generated and deployed
- [ ] Client logged into admin panel successfully
- [ ] Store name, phone, WhatsApp number updated in Settings
- [ ] Address and business hours updated in Settings

### Frontend
- [ ] Homepage loads with correct store branding
- [ ] All product categories browseable
- [ ] Product images load correctly (no broken images)
- [ ] WhatsApp floating button shows correct number
- [ ] Mobile responsive layout verified
- [ ] Google Sign-In button works from homepage

### Security
- [ ] `.env` file NOT committed to Git (check `.gitignore`)
- [ ] Session secret changed to a long random string (not default)
- [ ] Admin password changed from any demo/test value
- [ ] MongoDB credentials not exposed in any public file

---

## 🔑 Credentials to Hand Off to Client

Give the client these details in a secure way (password manager, encrypted email, etc.):

| Item | Value |
|------|-------|
| Site URL | `https://digitronx.vercel.app` |
| Admin Panel URL | `https://digitronx.vercel.app/admin` |
| Admin Username | `admin` |
| Admin Password | *(set new one before handoff)* |
| Vercel Dashboard | `https://vercel.com` (invite client to Vercel team) |
| MongoDB Atlas | `https://cloud.mongodb.com` (invite client as org member) |
| Google Cloud Console | `https://console.cloud.google.com` (transfer ownership or add client) |

---

## 📋 What the Client Can Do via Admin Panel

| Feature | How to Access |
|---------|--------------|
| Update store name, tagline | Admin → Settings → Store Info |
| Change WhatsApp number | Admin → Settings → Contact Info |
| Update phone / email | Admin → Settings → Contact Info |
| Change address & hours | Admin → Settings → Contact Info |
| Enable/disable Reviews | Admin → Settings → Features |
| Enable/disable Calculator | Admin → Settings → Features |
| Hide/show products | Admin → Products → Toggle visibility |
| View customer quotes | Admin → Quotes |
| View customer reviews | Admin → Dashboard |
| Manage display banners | Admin → Display Manager |

---

## 📞 Support Notes

If the client encounters issues:

1. **Products not loading** → Check MongoDB Atlas (cluster may have paused on free tier after 60 days idle)
2. **Google login broken** → OAuth credentials may need renewal or redirect URI mismatch
3. **Emails not arriving** → Gmail App Password may have been revoked; regenerate it
4. **Admin can't login** → Regenerate `ADMIN_PASSWORD_HASH` and redeploy
5. **Site down** → Check Vercel dashboard for deployment errors; re-deploy from dashboard

---

## 🚀 How to Redeploy After Changes

If the client or developer makes changes:

```bash
# Make changes, then commit
git add .
git commit -m "your change description"
git push origin main

# Vercel auto-deploys on push to main
# Or manually: vercel --prod
```

---

*Handover completed by: _________________ on Date: _________________*
*Received by client: _________________ on Date: _________________*
