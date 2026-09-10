const express = require('express');
const { z } = require('zod');
const { prisma } = require('../config/state');
const { requireCustomer } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  asArray,
  findProductByIdentifier,
  customerProfilePayload
} = require('../utils/helpers');

const router = express.Router();

// Zod Validation Schemas
const cartAddSchema = z.object({
  productId: z.string({ required_error: "Product ID is required" }).min(1, "Product ID is required"),
  quantity: z.union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1, "Quantity must be at least 1")
    .optional()
    .default(1)
});

const cartQtySchema = z.object({
  quantity: z.union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, "Quantity must be at least 0")
});

const wishlistToggleSchema = z.object({
  productId: z.string({ required_error: "Product ID is required" }).min(1, "Product ID is required")
});

const profileUpdateSchema = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(2, "Name must be at least 2 characters")
});

const addressSchema = z.object({
  label: z.string().optional().default('Home'),
  line1: z.string({ required_error: "Line 1 is required" }).trim().min(1, "Line 1 is required"),
  line2: z.string().optional().default(''),
  city: z.string({ required_error: "City is required" }).trim().min(1, "City is required"),
  state: z.string({ required_error: "State is required" }).trim().min(1, "State is required"),
  pincode: z.string({ required_error: "Pincode is required" }).trim().min(1, "Pincode is required"),
  phone: z.string({ required_error: "Phone is required" }).trim().min(1, "Phone is required")
});

// Apply requireCustomer to all routes in this router
router.use(requireCustomer);

// Cart Routes
router.get('/cart', (req, res) => {
  res.json(asArray(req.user.cart));
});

router.post('/cart', validate(cartAddSchema), async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await findProductByIdentifier(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const cart = asArray(req.user.cart);
  const existing = cart.find((item) => item.productId === product.id);
  if (existing) {
    existing.quantity = quantity;
  } else {
    cart.push({ productId: product.id, quantity, addedAt: new Date().toISOString() });
  }

  const customer = await prisma.customer.update({ where: { id: req.user.id }, data: { cart } });
  req.user = customer;
  res.json(asArray(customer.cart));
});

router.delete('/cart/:productId', async (req, res) => {
  const cart = asArray(req.user.cart).filter((item) => item.productId !== req.params.productId);
  const customer = await prisma.customer.update({ where: { id: req.user.id }, data: { cart } });
  req.user = customer;
  res.json(asArray(customer.cart));
});

router.put('/cart/:productId/quantity', validate(cartQtySchema), async (req, res) => {
  const { quantity } = req.body;
  let cart = asArray(req.user.cart);
  if (quantity === 0) {
    cart = cart.filter((item) => item.productId !== req.params.productId);
  } else {
    cart = cart.map((item) => item.productId === req.params.productId ? { ...item, quantity } : item);
  }
  const customer = await prisma.customer.update({ where: { id: req.user.id }, data: { cart } });
  req.user = customer;
  res.json(asArray(customer.cart));
});

router.delete('/cart', async (req, res) => {
  const customer = await prisma.customer.update({ where: { id: req.user.id }, data: { cart: [] } });
  req.user = customer;
  res.json([]);
});

// Wishlist Routes
router.get('/wishlist', (req, res) => {
  res.json(asArray(req.user.wishlist));
});

router.post('/wishlist', validate(wishlistToggleSchema), async (req, res) => {
  const { productId } = req.body;
  const product = await findProductByIdentifier(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const current = asArray(req.user.wishlist);
  const wishlisted = !current.includes(product.id);
  const wishlist = wishlisted ? [...current, product.id] : current.filter((id) => id !== product.id);
  
  const customer = await prisma.customer.update({ where: { id: req.user.id }, data: { wishlist } });
  req.user = customer;
  res.json({ wishlisted, wishlist: asArray(customer.wishlist) });
});

// Profile Routes
router.get('/profile', (req, res) => {
  res.json(customerProfilePayload(req.user));
});

router.put('/profile', validate(profileUpdateSchema), async (req, res) => {
  const { name } = req.body;
  const customer = await prisma.customer.update({ where: { id: req.user.id }, data: { name } });
  req.user = customer;
  res.json(customerProfilePayload(customer));
});

// Address Routes
router.post('/addresses', validate(addressSchema), async (req, res) => {
  const addresses = asArray(req.user.addresses);
  if (addresses.length >= 5) return res.status(400).json({ error: 'Maximum 5 addresses allowed' });

  const address = req.body;
  const customer = await prisma.customer.update({
    where: { id: req.user.id },
    data: { addresses: [...addresses, address] }
  });
  req.user = customer;
  res.json(asArray(customer.addresses));
});

router.delete('/addresses/:index', async (req, res) => {
  const index = parseInt(req.params.index, 10);
  const addresses = asArray(req.user.addresses);
  if (!Number.isInteger(index) || index < 0 || index >= addresses.length) {
    return res.status(400).json({ error: 'Invalid address index' });
  }
  addresses.splice(index, 1);
  const customer = await prisma.customer.update({ where: { id: req.user.id }, data: { addresses } });
  req.user = customer;
  res.json(asArray(customer.addresses));
});

// Reviews Route
router.get('/reviews', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { customerId: req.user.id },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(reviews.map((review) => ({
    productId: review.productId,
    productName: review.product?.name || 'Product',
    rating: review.rating,
    text: review.reviewText,
    createdAt: review.createdAt
  })));
});

module.exports = router;
