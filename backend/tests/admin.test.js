const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Mock bcrypt compare function
const originalCompare = bcrypt.compare;
bcrypt.compare = async (password, hash) => {
  if (password === 'Admin@1234' && hash === 'mock-hash') {
    return true;
  }
  return originalCompare(password, hash);
};

// Set env variables for testing
process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = 'mock-hash';
process.env.JWT_SECRET = 'testsecret';

// Mock state/Prisma before loading server
const state = require('../config/state');
state.getDb = async () => null; // disable mongo
state.prisma.$runCommandRaw = async () => ({ ok: 1 });
state.prisma.product = {
  findMany: async () => [],
  findUnique: async () => null,
  findFirst: async () => null,
  create: async ({ data }) => ({
    id: 'mock-product-123',
    name: data.name,
    brand: data.brand || 'Generic',
    price: data.price,
    stockStatus: data.stockStatus || 'In Stock',
    stockQty: 0
  }),
  update: async ({ where, data }) => ({
    id: where.id,
    name: data.name,
    brand: data.brand,
    price: data.price,
    stockStatus: data.stockStatus,
    stockQty: data.stockQty
  }),
  delete: async () => ({ id: 'mock-product-123' })
};
state.prisma.category = {
  findFirst: async () => ({ id: 'mock-category-123', name: 'Cameras' }),
  create: async ({ data }) => ({ id: 'mock-category-123', name: data.name })
};
state.prisma.review = {
  deleteMany: async () => ({ count: 1 })
};

// Mock helper functions before loading server
const helpers = require('../utils/helpers');
helpers.findProductByIdentifier = async () => ({ id: 'mock-product-123', name: 'Test Cam' });

const app = require('../server');
const token = jwt.sign({ user: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

// Ensure env variables are overridden even if server.js loaded dotenv
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD_HASH = 'mock-hash';
process.env.JWT_SECRET = 'testsecret';

test('Admin Auth: rejects bad credentials', async () => {
  const res = await request(app)
    .post('/api/admin/login')
    .send({ username: 'testadmin', password: 'WrongPassword' });

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error, 'Invalid credentials');
});

test('Admin Auth: accepts good credentials', async () => {
  const res = await request(app)
    .post('/api/admin/login')
    .send({ username: 'testadmin', password: 'Admin@1234' });

  assert.strictEqual(res.status, 200);
  assert.ok(res.headers['set-cookie']);
  assert.ok(res.body.success);
});

test('Product CRUD: rejects unauthenticated requests', async () => {
  // Create
  let res = await request(app)
    .post('/api/admin/products')
    .send({ name: 'Test Cam', category: 'Cameras', price: 999 });
  assert.strictEqual(res.status, 401);

  // Update
  res = await request(app)
    .patch('/api/admin/products/123')
    .send({ name: 'Test Cam Updated' });
  assert.strictEqual(res.status, 401);

  // Delete
  res = await request(app)
    .delete('/api/admin/products/123');
  assert.strictEqual(res.status, 401);
});

test('Product CRUD: accepts authenticated requests and performs actions', async () => {
  // Create
  let res = await request(app)
    .post('/api/admin/products')
    .set('Cookie', [`ae_admin_token=${token}`])
    .send({ name: 'Test Cam', category: 'Cameras', price: 999 });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.name, 'Test Cam');
  assert.strictEqual(res.body.price, 999);

  // Update
  res = await request(app)
    .patch('/api/admin/products/mock-product-123')
    .set('Cookie', [`ae_admin_token=${token}`])
    .send({ name: 'Test Cam Updated', price: 1099 });

  assert.strictEqual(res.status, 200);

  // Delete
  res = await request(app)
    .delete('/api/admin/products/mock-product-123')
    .set('Cookie', [`ae_admin_token=${token}`]);

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.success);
});

test('Input validation: rejects malformed product payloads', async () => {
  // Missing category, price is negative
  const res = await request(app)
    .post('/api/admin/products')
    .set('Cookie', [`ae_admin_token=${token}`])
    .send({ name: 'Invalid Cam', price: -50 });

  assert.strictEqual(res.status, 400);
  assert.ok(res.body.error);
});

test('Admin Auth: respects rate limiting', async () => {
  // Make multiple bad requests to trigger the rate limiter.
  // The limiter max is 5. If we hit it, it should return 429.
  let rateLimited = false;
  for (let i = 0; i < 8; i++) {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'testadmin', password: 'WrongPassword' });

    if (res.status === 429) {
      rateLimited = true;
      assert.ok(res.body.error.includes('Too many login attempts'));
      break;
    }
  }
  assert.ok(rateLimited, 'Rate limiter was not triggered');
});

test('cleanup', () => {
  state.prisma.$disconnect();
  setTimeout(() => {
    process.exit(0);
  }, 200);
});
