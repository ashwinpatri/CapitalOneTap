const express = require('express');
const Transaction = require('../models/Transaction');
const Card = require('../models/Card');
const MerchantCategory = require('../models/MerchantCategory');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/transactions — get user's transactions
router.get('/', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const transactions = await Transaction.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(limit)
      .populate('cardId', 'productName lastFour visual');
    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/transactions — create a purchase
router.post('/', auth, async (req, res) => {
  try {
    const { cardId, merchant, amount } = req.body;

    const card = await Card.findOne({ _id: cardId, userId: req.userId, isActive: true });
    if (!card) return res.status(404).json({ error: 'Card not found' });

    // Resolve merchant category
    const merchantLower = merchant.toLowerCase().replace(/[^a-z]/g, '');
    const categories = await MerchantCategory.find();
    let merchantCategory = 'general';
    for (const mc of categories) {
      if (merchantLower.includes(mc.merchantPattern.replace(/[^a-z]/g, ''))) {
        merchantCategory = mc.category;
        break;
      }
    }

    // Find matching reward tier (first match wins, top-down)
    let matchedTier = card.rewardTiers[card.rewardTiers.length - 1]; // default: last tier (everything)
    for (const tier of card.rewardTiers) {
      if (tier.categories.includes(merchantCategory) || tier.categories.includes('everything')) {
        matchedTier = tier;
        break;
      }
    }

    // Calculate rewards
    let rewardsEarned;
    let rewardUnit;
    if (matchedTier.unit === 'miles') {
      rewardsEarned = Math.round(amount * matchedTier.rate);
      rewardUnit = 'miles';
    } else if (matchedTier.unit === 'percent_cashback') {
      rewardsEarned = parseFloat((amount * matchedTier.rate / 100).toFixed(2));
      rewardUnit = 'cash back';
    } else {
      rewardsEarned = Math.round(amount * matchedTier.rate);
      rewardUnit = 'points';
    }

    const confirmationNumber = `CO-${Date.now().toString(36).toUpperCase()}`;

    const transaction = new Transaction({
      userId: req.userId,
      cardId,
      merchant,
      merchantCategory,
      amount,
      rewardsEarned,
      rewardUnit,
      rewardTierUsed: { rate: matchedTier.rate, categories: matchedTier.categories },
      status: 'completed',
      confirmationNumber,
      date: new Date(),
    });
    await transaction.save();

    // Update card balance and rewards
    await Card.findByIdAndUpdate(cardId, {
      $inc: { balance: amount, rewardsBalance: rewardsEarned },
    });

    // Track intro offer progress
    if (card.introOffer && !card.introOffer.earned && card.introOffer.startDate) {
      const deadline = new Date(card.introOffer.startDate);
      deadline.setDate(deadline.getDate() + card.introOffer.timeframeDays);
      if (new Date() <= deadline) {
        const newSpent = card.introOffer.amountSpent + amount;
        const earned = newSpent >= card.introOffer.spendRequired;
        await Card.findByIdAndUpdate(cardId, {
          'introOffer.amountSpent': newSpent,
          'introOffer.earned': earned,
        });
      }
    }

    res.status(201).json({ transaction, confirmationNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
