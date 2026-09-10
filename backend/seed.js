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
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATEGORY_MAP = [
  { name: 'Cameras', slug: 'cameras' },
  { name: 'Storage', slug: 'storage' },
  { name: 'NVR', slug: 'nvr' },
  { name: 'DVR', slug: 'dvr' },
  { name: 'Power Supplies', slug: 'power-supplies' },
  { name: 'Cables & Connectors', slug: 'cables-connectors' },
  { name: 'Networking', slug: 'networking' },
  { name: 'Mounting & Enclosures', slug: 'mounting-enclosures' },
  { name: 'Accessories', slug: 'accessories' },
  { name: 'Displays', slug: 'displays' },
  { name: 'Services', slug: 'services' },
  { name: 'Bundles', slug: 'bundles' },
];

function loadCuratedProducts() {
  const productsFilePath = path.join(__dirname, '..', 'src', 'data', 'products.js');
  if (!fs.existsSync(productsFilePath)) {
    throw new Error(`Curated products file not found at ${productsFilePath}`);
  }
  const content = fs.readFileSync(productsFilePath, 'utf8');
  const match = content.match(/const products = (\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error('Failed to parse products array from products.js');
  }
  return JSON.parse(match[1]);
}

async function seed() {
  console.log('--- Starting Digitron Database Seed ---');

  // 1. Seed Categories
  for (const cat of CATEGORY_MAP) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug }
    });
  }
  console.log(`Seeded ${CATEGORY_MAP.length} categories.`);

  // 2. Load Curated Products
  const products = loadCuratedProducts();
  const dbCategories = await prisma.category.findMany();
  console.log(`Loaded ${products.length} curated products from catalog.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const p of products) {
    const categoryRecord = dbCategories.find(c => c.name.toLowerCase() === (p.category || '').toLowerCase())
      || dbCategories.find(c => c.slug === 'accessories');

    const productPayload = {
      legacyId: p.id,
      name: p.name,
      brand: p.brand || 'Generic',
      categoryId: categoryRecord.id,
      price: typeof p.price === 'number' ? p.price : 0,
      stockStatus: p.stock || 'In Stock',
      stockQty: typeof p.stock_qty === 'number' ? p.stock_qty : 10,
      barcode: p.barcode || null,
      gst: p.gst || '18%',
      indoorOutdoor: p.indoor_outdoor || null,
      resolution: p.resolution || null,
      type: p.type || null,
      specs: p.specs || {},
      images: Array.isArray(p.images) ? p.images : [],
      bestFor: Array.isArray(p.best_for) ? p.best_for : [],
    };

    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { legacyId: p.id },
          { name: p.name }
        ]
      }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: productPayload
      });
      updatedCount++;
    } else {
      await prisma.product.create({
        data: productPayload
      });
      createdCount++;
    }
  }

  console.log(`Database sync completed: ${createdCount} created, ${updatedCount} updated.`);
}

seed()
  .catch((err) => {
    console.error('Seed script error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
