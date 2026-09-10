const { prisma, getHiddenProductIds } = require('../config/state');
const logger = require('./logger');

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

const isMongoId = (value) => typeof value === 'string' && OBJECT_ID_RE.test(value);

const numericId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const productIdentifierWhere = (id) => {
  const clauses = [];
  if (isMongoId(id)) clauses.push({ id });
  const legacyId = numericId(id);
  if (legacyId !== null) clauses.push({ legacyId });
  return clauses.length ? { OR: clauses } : { legacyId: -1 };
};

const findProductByIdentifier = (id, include = {}) => {
  return prisma.product.findFirst({
    where: productIdentifierWhere(id),
    include
  });
};

const asArray = (value) => Array.isArray(value) ? value : [];

const sanitizeQuantity = (quantity) => Math.max(0, parseInt(quantity, 10) || 0);

const customerProfilePayload = (customer) => ({
  id: customer.id,
  email: customer.email,
  name: customer.name,
  avatar: customer.avatar,
  createdAt: customer.createdAt,
  addresses: asArray(customer.addresses)
});

const mapReview = (r) => ({
  id: r.id,
  product_id: r.productId,
  customerId: r.customerId,
  customerName: r.customerName,
  reviewer_name: r.reviewerName,
  rating: r.rating,
  review_text: r.reviewText,
  is_verified: r.isVerified,
  is_approved: r.isApproved,
  helpful_yes: r.helpfulYes,
  helpful_no: r.helpfulNo,
  created_at: r.createdAt
});

const mapProduct = (p, hiddenIds = getHiddenProductIds()) => {
  const reviewsMapped = p.reviews ? p.reviews.map(mapReview) : [];
  const avg_rating = reviewsMapped.length > 0
    ? parseFloat((reviewsMapped.reduce((sum, r) => sum + r.rating, 0) / reviewsMapped.length).toFixed(1))
    : 4.5;
  return {
    ...p,
    category: p.category?.name || 'Accessories',
    categoryId: p.categoryId,
    stock: p.stockStatus,
    stock_qty: p.stockQty,
    indoor_outdoor: p.indoorOutdoor,
    best_for: p.bestFor,
    reviews: reviewsMapped,
    avg_rating,
    review_count: reviewsMapped.length,
    is_visible: !hiddenIds.includes(p.id)
  };
};

const logRouteError = (label, error) => {
  logger.error(`${label}:`, error?.message || error);
};

const withTimeout = (promise, ms, message) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
]);

module.exports = {
  isMongoId,
  numericId,
  productIdentifierWhere,
  findProductByIdentifier,
  asArray,
  sanitizeQuantity,
  customerProfilePayload,
  mapReview,
  mapProduct,
  logRouteError,
  withTimeout
};
