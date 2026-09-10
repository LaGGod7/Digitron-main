const express = require('express');
const passport = require('passport');
const { customerProfilePayload } = require('../utils/helpers');

const router = express.Router();

const GOOGLE_AUTH_CONFIGURED = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();

router.get('/google', (req, res, next) => {
  if (!GOOGLE_AUTH_CONFIGURED) {
    return res.status(503).json({ error: 'Google login is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env.' });
  }
  req.session.returnTo = req.query.returnTo || '/profile';
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
  (req, res, next) => {
    if (!GOOGLE_AUTH_CONFIGURED) {
      return res.redirect(`${FRONTEND_URL}/?auth=google-not-configured`);
    }
    next();
  },
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        console.error('[Google OAuth Error]:', err);
        return res.status(500).json({
          error: 'Google authentication failed',
          message: err.message,
          details: err.oauthError ? err.oauthError.data : (err.toString ? err.toString() : err)
        });
      }
      if (!user) {
        console.warn('[Google OAuth] No user returned:', info);
        return res.redirect(`${FRONTEND_URL}/?auth=failed`);
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('[Google OAuth Login Error]:', loginErr);
          return res.status(500).json({ error: 'Session login failed', message: loginErr.message });
        }
        const returnTo = req.session.returnTo || '/profile';
        delete req.session.returnTo;
        return res.redirect(`${FRONTEND_URL}${returnTo.startsWith('/') ? returnTo : '/profile'}`);
      });
    })(req, res, next);
  }
);

router.get('/me', (req, res) => {
  res.json({ user: req.user ? customerProfilePayload(req.user) : null });
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ ok: true });
    });
  });
});

module.exports = router;
