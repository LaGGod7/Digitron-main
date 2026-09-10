const express = require('express');
const { prisma, persistLoad, persistSave, defaultSettings, mergeSettings, getSiteSettings } = require('../config/state');
const {
  isMongoId,
  numericId,
  findProductByIdentifier,
  mapProduct,
  logRouteError
} = require('../utils/helpers');

const logger = require('../utils/logger');

const router = express.Router();

router.get('/settings', async (req, res) => {
  try {
    const settings = mergeSettings(await persistLoad('site_settings', defaultSettings));
    res.json(settings);
  } catch {
    res.json(getSiteSettings());
  }
});


router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    logRouteError('Error fetching categories', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

router.get('/products', async (req, res) => {
  try {
    const { category, search, limit = 50, offset = 0, admin, includeReviews } = req.query;
    
    // Fetch latest hidden list and visits dynamically
    const hiddenIds = await persistLoad('hidden_products', []);
    const visits = await persistLoad('product_visits', {});

    const where = {};
    const andFilters = [];
    
    if (!admin && hiddenIds.length > 0) {
      const hiddenMongoIds = hiddenIds.filter(isMongoId);
      const hiddenLegacyIds = hiddenIds.map(numericId).filter(id => id !== null);
      if (hiddenMongoIds.length) andFilters.push({ id: { notIn: hiddenMongoIds } });
      if (hiddenLegacyIds.length) andFilters.push({ legacyId: { notIn: hiddenLegacyIds } });
    }

    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (andFilters.length) where.AND = andFilters;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          reviews: includeReviews === 'true' ? { where: { isApproved: true } } : false
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { id: 'asc' }
      }),
      prisma.product.count({ where })
    ]);

    // Track searches
    if (search && products.length > 0) {
      products.forEach(p => {
        visits[p.id] = (visits[p.id] || 0) + 1;
      });
      persistSave('product_visits', visits);
    }

    res.json({ products: products.map(p => mapProduct(p, hiddenIds)), total });
  } catch (error) {
    logRouteError('Error fetching products', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
});

router.get('/products/popular', async (req, res) => {
  try {
    const visits = await persistLoad('product_visits', {});
    const hiddenIds = await persistLoad('hidden_products', []);

    const sortedKeys = Object.entries(visits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
    const mongoIds = sortedKeys.filter(isMongoId);
    const legacyIds = sortedKeys.map(numericId).filter(id => id !== null);

    let products = [];
    if (sortedKeys.length > 0) {
      products = await prisma.product.findMany({
        where: {
          OR: [
            ...(mongoIds.length ? [{ id: { in: mongoIds } }] : []),
            ...(legacyIds.length ? [{ legacyId: { in: legacyIds } }] : [])
          ]
        },
        include: { category: true, reviews: { where: { isApproved: true } } }
      });
      products.sort((a, b) => {
        const aKey = visits[a.id] ? a.id : String(a.legacyId);
        const bKey = visits[b.id] ? b.id : String(b.legacyId);
        return sortedKeys.indexOf(aKey) - sortedKeys.indexOf(bKey);
      });
    } else {
      // Fallback: return top 5 products if no views yet
      products = await prisma.product.findMany({
        take: 5,
        include: { category: true, reviews: { where: { isApproved: true } } }
      });
    }
    
    res.json(products.map(p => ({
      ...mapProduct(p, hiddenIds),
      visits: visits[p.id] || visits[p.legacyId] || 0
    })));
  } catch (error) {
    logger.error('Popular products error:', error);
    res.status(500).json({ error: 'Error fetching popular products' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await findProductByIdentifier(req.params.id, { category: true, reviews: { where: { isApproved: true } } });
    if (!product) return res.status(404).json({ error: 'Not found' });

    // Track visit
    const visits = await persistLoad('product_visits', {});
    const hiddenIds = await persistLoad('hidden_products', []);
    visits[product.id] = (visits[product.id] || 0) + 1;
    persistSave('product_visits', visits);

    res.json(mapProduct(product, hiddenIds));
  } catch (error) {
    logRouteError('Error fetching product', error);
    res.status(500).json({ error: 'Error fetching product' });
  }
});

module.exports = router;
