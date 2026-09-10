const express = require('express');
const { z } = require('zod');
const { prisma } = require('../config/state');
const { requireCustomer } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { findProductByIdentifier, mapReview } = require('../utils/helpers');

const router = express.Router();

// Zod Validation Schemas
const reviewCreateSchema = z.object({
  productId: z.string({ required_error: "Product ID is required" }).min(1, "Product ID is required"),
  rating: z.union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 5, "Rating must be between 1 and 5"),
  reviewText: z.string({ required_error: "Review text is required" }).trim().min(1, "Review text cannot be empty"),
});

const reviewUpdateSchema = z.object({
  rating: z.union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 5, "Rating must be between 1 and 5")
    .optional(),
  reviewText: z.string().trim().min(1, "Review text cannot be empty").optional(),
  text: z.string().trim().min(1, "Review text cannot be empty").optional(),
});

router.post('/', (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Please login to submit a review' });
  }
  next();
}, validate(reviewCreateSchema), async (req, res) => {
  const { productId, rating, reviewText } = req.body;
  try {
    const product = await findProductByIdentifier(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        customerId: req.user.id,
        customerName: req.user.name,
        reviewerName: req.user.name,
        rating: parseInt(rating),
        reviewText,
        isVerified: true,
        isApproved: true // Auto-approved!
      }
    });
    res.json({ success: true, review: mapReview(review) });
  } catch {
    res.status(500).json({ error: 'Error saving review' });
  }
});

router.patch('/:id', requireCustomer, validate(reviewUpdateSchema), async (req, res) => {
  const { rating, reviewText, text } = req.body;
  try {
    const existing = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Review not found' });
    if (existing.customerId !== req.user.id) return res.status(403).json({ error: 'You can only edit your own review' });

    const updateData = {};
    if (rating !== undefined) updateData.rating = parseInt(rating);
    if (reviewText !== undefined || text !== undefined) {
      updateData.reviewText = reviewText || text;
    }

    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ success: true, review: mapReview(review) });
  } catch {
    res.status(500).json({ error: 'Error updating review' });
  }
});

module.exports = router;
