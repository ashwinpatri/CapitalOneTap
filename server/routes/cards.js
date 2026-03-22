const express = require('express');
const Card = require('../models/Card');
const CardProduct = require('../models/CardProduct');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/cards — get all user's active cards
router.get('/', auth, async (req, res) => {
  try {
    const cards = await Card.find({ userId: req.userId, isActive: true }).sort({ isDefault: -1, createdAt: 1 });
    res.json({ cards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cards — add a new card
router.post('/', auth, async (req, res) => {
  try {
    const { productName, lastFour, nickname, balance, rewardsBalance } = req.body;

    // Look up the card product template
    const product = await CardProduct.findOne({ name: productName });
    if (!product) {
      return res.status(400).json({ error: `Unknown card product: ${productName}` });
    }

    // Check if user already has a default card
    const hasDefault = await Card.findOne({ userId: req.userId, isActive: true, isDefault: true });

    const card = new Card({
      userId: req.userId,
      productName: product.name,
      nickname: nickname || null,
      lastFour,
      network: product.network,
      annualFee: product.annualFee,
      rewardTiers: product.rewardTiers,
      introOffer: product.defaultIntroOffer ? {
        ...product.defaultIntroOffer.toObject(),
        startDate: new Date(),
        amountSpent: 0,
        earned: false,
      } : null,
      visual: product.visual,
      imageUrl: product.imageUrl || null,
      balance: balance || 0,
      rewardsBalance: rewardsBalance || 0,
      isDefault: !hasDefault, // first card is default
    });

    await card.save();
    const cards = await Card.find({ userId: req.userId, isActive: true }).sort({ isDefault: -1, createdAt: 1 });
    res.status(201).json({ card, cards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cards/:id — soft delete a card
router.delete('/:id', auth, async (req, res) => {
  try {
    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: false },
      { new: true }
    );
    if (!card) return res.status(404).json({ error: 'Card not found' });

    // If deleted card was default, make another card default
    if (card.isDefault) {
      const nextCard = await Card.findOne({ userId: req.userId, isActive: true });
      if (nextCard) {
        nextCard.isDefault = true;
        await nextCard.save();
      }
    }

    const cards = await Card.find({ userId: req.userId, isActive: true }).sort({ isDefault: -1, createdAt: 1 });
    res.json({ cards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cards/:id/default — set a card as default
router.put('/:id/default', auth, async (req, res) => {
  try {
    await Card.updateMany({ userId: req.userId }, { isDefault: false });
    await Card.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { isDefault: true });
    const cards = await Card.find({ userId: req.userId, isActive: true }).sort({ isDefault: -1, createdAt: 1 });
    res.json({ cards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cards/products — list available card products
router.get('/products', async (req, res) => {
  try {
    const products = await CardProduct.find({ isAvailable: true });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
