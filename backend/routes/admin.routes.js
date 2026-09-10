const express = require('express');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {
  prisma,
  setHiddenProductIds,
  setSiteSettings,
  saveSettings,
  persistLoad,
  persistSave,
  mergeSettings
} = require('../config/state');
const { authenticateAdmin, adminLoginLimiter } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  findProductByIdentifier,
  mapProduct
} = require('../utils/helpers');

const logger = require('../utils/logger');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Zod Validation Schemas
const adminLoginSchema = z.object({
  username: z.string({ required_error: "Username is required" }).min(1, "Username is required"),
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required")
});

const adminSettingsSchema = z.object({
  storeName: z.string().optional(),
  storeTagline: z.string().optional(),
  whatsappNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().optional().nullable().or(z.literal('')),
  salesEmail: z.string().optional().nullable().or(z.literal('')),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  hours: z.object({
    weekday: z.string().optional(),
    weekend: z.string().optional(),
  }).optional(),
  social: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
  features: z.object({
    enableReviews: z.boolean().optional(),
    enableCalculator: z.boolean().optional(),
  }).optional()
}).optional();

const quoteUpdateSchema = z.object({
  status: z.string({ required_error: "Status is required" }).min(1, "Status is required")
});

const adminProductCreateSchema = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(1, "Name cannot be empty"),
  brand: z.string().optional().default('Generic'),
  category: z.string({ required_error: "Category is required" }).trim().min(1, "Category cannot be empty"),
  price: z.union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, "Price must be a positive number"),
  stock: z.string().optional().default('In Stock'),
});

const adminProductUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  brand: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  price: z.union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, "Price must be a positive number")
    .optional(),
  stock: z.string().optional().nullable(),
  stock_qty: z.union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, "Stock quantity must be a non-negative number")
    .optional().nullable(),
  indoor_outdoor: z.string().optional().nullable(),
  best_for: z.array(z.string()).optional()
});

// Admin Authentication Routes
router.post('/login', adminLoginLimiter, validate(adminLoginSchema), async (req, res) => {
  const { username, password } = req.body;
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedPasswordHash) {
    logger.error('ADMIN_PASSWORD_HASH is not set in backend/.env');
    return res.status(500).json({ error: 'Server authentication is misconfigured' });
  }

  if (username !== expectedUsername) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const match = await bcrypt.compare(password, expectedPasswordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('ae_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error in admin login:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

router.get('/me', authenticateAdmin, (req, res) => {
  res.json({ user: 'admin' });
});

router.post('/logout', (req, res) => {
  res.clearCookie('ae_admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out successfully' });
});

// Admin Site Settings Routes
router.put('/settings', authenticateAdmin, validate(adminSettingsSchema), async (req, res) => {
  try {
    const updatedSettings = mergeSettings(req.body);
    setSiteSettings(updatedSettings);
    saveSettings();
    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    logger.error('Error saving site settings:', error);
    res.status(500).json({ error: 'Error saving site settings' });
  }
});

router.delete('/settings', authenticateAdmin, async (req, res) => {
  try {
    const defaultSet = mergeSettings();
    setSiteSettings(defaultSet);
    const SETTINGS_FILE = require('../config/state').SETTINGS_FILE;
    const fs = require('fs');
    if (fs.existsSync(SETTINGS_FILE)) fs.unlinkSync(SETTINGS_FILE);
    saveSettings();
    res.json({ success: true, settings: defaultSet });
  } catch (error) {
    logger.error('Error resetting site settings:', error);
    res.status(500).json({ error: 'Error resetting site settings' });
  }
});

// Admin Quotes Routes
router.get('/quotes', authenticateAdmin, async (req, res) => {
  try {
    const quotes = await prisma.quoteRequest.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(quotes);
  } catch {
    res.status(500).json({ error: 'Error fetching quotes' });
  }
});

router.patch('/quotes/:id', authenticateAdmin, validate(quoteUpdateSchema), async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await prisma.quoteRequest.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(updated);
  } catch (error) {
    logger.error('Error updating quote status:', error);
    res.status(500).json({ error: 'Error updating quote status' });
  }
});

// Admin Products Routes
router.post('/products', authenticateAdmin, validate(adminProductCreateSchema), async (req, res) => {
  const { name, brand, category: categoryName, price, stock } = req.body;
  try {
    let category = await prisma.category.findFirst({
      where: { name: { equals: categoryName, mode: 'insensitive' } }
    });
    if (!category) {
      const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      category = await prisma.category.create({
        data: { name: categoryName, slug }
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        brand: brand || 'Generic',
        categoryId: category.id,
        price: parseFloat(price) || 0,
        stockStatus: stock || 'In Stock',
        stockQty: 0,
        images: [],
        bestFor: []
      },
      include: { category: true }
    });

    res.json(mapProduct(product));
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({ error: 'Error creating product' });
  }
});

router.patch('/products/:id', authenticateAdmin, validate(adminProductUpdateSchema), async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.stock) { data.stockStatus = data.stock; delete data.stock; }
    if (data.stock_qty !== undefined) { data.stockQty = data.stock_qty; delete data.stock_qty; }
    if (data.indoor_outdoor) { data.indoorOutdoor = data.indoor_outdoor; delete data.indoor_outdoor; }
    if (data.best_for) { data.bestFor = data.best_for; delete data.best_for; }

    const existing = await findProductByIdentifier(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const product = await prisma.product.update({
      where: { id: existing.id },
      data,
      include: { category: true }
    });
    res.json(mapProduct(product));
  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({ error: 'Error updating product' });
  }
});

router.delete('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await findProductByIdentifier(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Delete related reviews to prevent foreign key errors
    await prisma.review.deleteMany({ where: { productId: product.id } });

    await prisma.product.delete({
      where: { id: product.id }
    });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
  }
});

router.post('/products/:id/toggle-visibility', authenticateAdmin, async (req, res) => {
  try {
    const product = await findProductByIdentifier(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const pid = product.id;
    
    const hiddenIds = await persistLoad('hidden_products', []);
    const index = hiddenIds.indexOf(pid);
    if (index > -1) {
      hiddenIds.splice(index, 1);
    } else {
      hiddenIds.push(pid);
    }
    
    await persistSave('hidden_products', hiddenIds);
    setHiddenProductIds(hiddenIds);
    
    res.json({ success: true, is_visible: !hiddenIds.includes(pid) });
  } catch (error) {
    logger.error('Error toggling product visibility:', error);
    res.status(500).json({ error: 'Error toggling product visibility' });
  }
});

module.exports = router;
