const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore fallback if custom servers not allowed
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const logger = require('./utils/logger');

const { prisma, initializePersistence } = require('./config/state');
const { logRouteError, withTimeout } = require('./utils/helpers');

// Import routers
const authRouter = require('./routes/auth.routes');
const customerRouter = require('./routes/customer.routes');
const adminRouter = require('./routes/admin.routes');
const quotesRouter = require('./routes/quotes.routes');
const reviewsRouter = require('./routes/reviews.routes');
const productsRouter = require('./routes/products.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawFrontendUrl.split(',').map(s => s.trim()).filter(Boolean);
if (!allowedOrigins.includes('http://localhost:5173')) {
  allowedOrigins.push('http://localhost:5173');
}

const SESSION_MONGO_URL = process.env.MONGODB_URI || process.env.DATABASE_URL;
const GOOGLE_AUTH_CONFIGURED = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const USE_MONGO_SESSION_STORE = process.env.SESSION_STORE === 'mongo' && !(process.env.VERCEL || process.env.NOW_BUILDER);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive fallback for seamless client preview
  },
  credentials: true
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});

app.use(express.json());
app.use(cookieParser());

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'digitron-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
};

if (USE_MONGO_SESSION_STORE) {
  if (!SESSION_MONGO_URL) {
    throw new Error('SESSION_STORE=mongo requires MONGODB_URI or DATABASE_URL in backend/.env');
  }
  sessionConfig.store = MongoStore.create({ mongoUrl: SESSION_MONGO_URL });
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

if (GOOGLE_AUTH_CONFIGURED) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('Google account email is required'));

      let customer = await prisma.customer.findUnique({ where: { googleId: profile.id } });
      if (!customer) {
        const existingByEmail = await prisma.customer.findUnique({ where: { email } });
        customer = existingByEmail
          ? await prisma.customer.update({
              where: { id: existingByEmail.id },
              data: {
                googleId: profile.id,
                name: existingByEmail.name || profile.displayName,
                avatar: profile.photos?.[0]?.value || existingByEmail.avatar || null,
              }
            })
          : await prisma.customer.create({
              data: {
                googleId: profile.id,
                email,
                name: profile.displayName || email.split('@')[0],
                avatar: profile.photos?.[0]?.value || null,
              }
            });
      }
      return done(null, customer);
    } catch (err) {
      return done(err);
    }
  }));
} else {
  logger.warn('Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env to enable customer login.');
}

passport.serializeUser((customer, done) => done(null, customer.id));
passport.deserializeUser(async (id, done) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    done(null, customer);
  } catch (err) {
    done(err);
  }
});

logger.info('--- Server Configuration ---');
logger.info('Email User:', process.env.EMAIL_USER ? 'Configured' : 'Missing');
logger.info('Email Pass:', process.env.EMAIL_PASS ? 'Configured' : 'Missing');

// Run initialization in the background
initializePersistence();

// Health Check Route
app.get('/api/health', async (req, res) => {
  try {
    await withTimeout(
      prisma.$runCommandRaw({ ping: 1 }),
      5000,
      'MongoDB did not respond within 5 seconds. Check MONGODB_URI, network access, and Atlas IP allowlist.'
    );
    res.json({
      ok: true,
      database: 'connected',
      googleAuth: GOOGLE_AUTH_CONFIGURED ? 'configured' : 'missing credentials'
    });
  } catch (error) {
    logRouteError('Health check failed', error);
    res.status(500).json({
      ok: false,
      database: 'unreachable',
      error: error.message
    });
  }
});

// Mount routes
app.use('/api/auth', authRouter);
app.use('/api/customer', customerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api', productsRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;
