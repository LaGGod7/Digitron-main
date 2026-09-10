const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { MongoClient } = require('mongodb');

const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const HIDDEN_FILE = isVercel ? path.join('/tmp', 'hidden_products.json') : path.join(__dirname, '..', 'hidden_products.json');
const SETTINGS_FILE = isVercel ? path.join('/tmp', 'site_settings.json') : path.join(__dirname, '..', 'site_settings.json');

if (isVercel) {
  const filesToCopy = ['hidden_products.json', 'site_settings.json'];
  filesToCopy.forEach(file => {
    const src = path.join(__dirname, '..', file);
    const dest = path.join('/tmp', file);
    if (!fs.existsSync(dest) && fs.existsSync(src)) {
      try {
        fs.copyFileSync(src, dest);
      } catch (err) {
        console.error(`Failed to copy ${file} to /tmp:`, err);
      }
    }
  });
}

// Fallback DB url config
const getDatabaseUrl = () => {
  const raw = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/digitron_fallback";
  return raw.trim().replace(/^["']|["']$/g, '');
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  log: ['error']
});

let dbClient = null;
let db = null;

async function getDb() {
  if (db) return db;
  if (!process.env.MONGODB_URI) return null;
  try {
    dbClient = new MongoClient(process.env.MONGODB_URI.trim().replace(/^["']|["']$/g, ''));
    await dbClient.connect();
    db = dbClient.db();
    return db;
  } catch (err) {
    console.error("MongoClient connection error:", err);
    return null;
  }
}

async function persistLoad(key, defaultValue) {
  const database = await getDb();
  if (!database) return defaultValue;
  try {
    const col = database.collection('key_value_store');
    const doc = await col.findOne({ key });
    return doc ? doc.value : defaultValue;
  } catch (err) {
    console.error(`Error loading key ${key} from MongoDB:`, err);
    return defaultValue;
  }
}

async function persistSave(key, value) {
  const database = await getDb();
  if (!database) return;
  try {
    const col = database.collection('key_value_store');
    await col.updateOne({ key }, { $set: { value } }, { upsert: true });
  } catch (err) {
    console.error(`Error saving key ${key} to MongoDB:`, err);
  }
}

const defaultSettings = {
  storeName: "Digitron Associates",
  storeTagline: "CCTV & Security Solutions",
  whatsappNumber: "919876543210",
  phoneNumber: "+91 98765 43210",
  email: "info@digitronassociates.in",
  salesEmail: "sales@digitronassociates.in",
  address: {
    line1: "Shop No. 12, Electronics Hub",
    line2: "Lamington Road, Hubbali",
    state: "Karnataka - 580029",
  },
  hours: {
    weekday: "Mon-Sat: 9 AM - 7 PM",
    weekend: "Sunday: 10 AM - 4 PM",
  },
  social: {
    facebook: "#",
    instagram: "#",
    youtube: "#",
  },
  features: {
    enableReviews: true,
    enableCalculator: true,
  }
};

const mergeSettings = (settings = {}) => ({
  ...defaultSettings,
  ...settings,
  address: { ...defaultSettings.address, ...(settings.address || {}) },
  hours: { ...defaultSettings.hours, ...(settings.hours || {}) },
  social: { ...defaultSettings.social, ...(settings.social || {}) },
  features: { ...defaultSettings.features, ...(settings.features || {}) },
});

let hiddenProductIds = [];
try {
  if (fs.existsSync(HIDDEN_FILE)) {
    hiddenProductIds = JSON.parse(fs.readFileSync(HIDDEN_FILE, 'utf8'));
  }
} catch (err) {
  console.error('Error loading hidden products:', err);
}

const loadSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return mergeSettings(JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')));
    }
  } catch (err) {
    console.error('Error loading site settings:', err);
  }
  return mergeSettings();
};

let siteSettings = loadSettings();

const getHiddenProductIds = () => hiddenProductIds;
const setHiddenProductIds = (val) => { hiddenProductIds = val; };

const getSiteSettings = () => siteSettings;
const setSiteSettings = (val) => { siteSettings = val; };

const saveSettings = () => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(siteSettings, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving site settings locally:', err);
  }
  persistSave('site_settings', siteSettings);
};

async function initializePersistence() {
  try {
    const dbHidden = await persistLoad('hidden_products', null);
    if (dbHidden) hiddenProductIds = dbHidden;

    const dbSettings = await persistLoad('site_settings', null);
    if (dbSettings) siteSettings = mergeSettings(dbSettings);

    console.log('MongoDB settings persistence initialized successfully');
  } catch (err) {
    console.error('Failed to initialize MongoDB persistence:', err);
  }
}

module.exports = {
  prisma,
  getDb,
  persistLoad,
  persistSave,
  defaultSettings,
  mergeSettings,
  getHiddenProductIds,
  setHiddenProductIds,
  getSiteSettings,
  setSiteSettings,
  saveSettings,
  initializePersistence,
  SETTINGS_FILE
};
