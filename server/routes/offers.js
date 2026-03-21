const express = require('express');
const Offer = require('../models/Offer');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/offers — get user's offers
router.get('/', auth, async (req, res) => {
  try {
    const offers = await Offer.find({ userId: req.userId });
    res.json({ offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/offers/:id/activate — toggle offer activation
router.put('/:id/activate', auth, async (req, res) => {
  try {
    const offer = await Offer.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { activated: true },
      { new: true }
    );
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    res.json({ offer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
