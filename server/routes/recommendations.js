const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const CardProduct = require('../models/CardProduct');

router.get('/', auth, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // ── 1. Aggregate user's real spending by category ─────────────────────────
    const transactions = await Transaction.find({
      userId: req.user.id,
      status: 'completed',
    });

    if (!transactions.length) {
      return res.json({
        recommendation: 'No transaction history yet — make some purchases to get a personalized recommendation.',
        spendingSummary: {},
      });
    }

    const spendingSummary = {};
    for (const tx of transactions) {
      const cat = tx.merchantCategory || 'general';
      spendingSummary[cat] = (spendingSummary[cat] || 0) + tx.amount;
    }
    // Round to whole dollars
    for (const cat of Object.keys(spendingSummary)) {
      spendingSummary[cat] = Math.round(spendingSummary[cat]);
    }

    // ── 2. Pull all available card products from MongoDB ──────────────────────
    const cardProducts = await CardProduct.find({ isAvailable: true });

    if (!cardProducts.length) {
      return res.status(500).json({ error: 'No card products found in database' });
    }

    // ── 3. Build Gemini prompt from real data ─────────────────────────────────
    const spendingStr = Object.entries(spendingSummary)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `${cat}: $${amt}`)
      .join(', ');

    const cardList = cardProducts.map(c => {
      const tiers = c.rewardTiers.map(t => {
        const unit = t.unit === 'percent_cashback' || t.unit === 'percent_back'
          ? '% cash back' : t.unit;
        return `${t.rate}x ${unit} on ${t.categories.join('/')}`;
      }).join('; ');
      return `${c.name} ($${c.annualFee}/yr annual fee): ${tiers}`;
    }).join('\n');

    const prompt = `A Capital One customer has the following spending history: ${spendingStr}.

Here are all available Capital One cards:
${cardList}

Based purely on which card earns the most rewards for this specific spending mix, respond with exactly one sentence in this format: "We recommend the [Card Name] because [reason]." Do not include anything else.`;

    // ── 4. Call Gemini ────────────────────────────────────────────────────────
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      return res.status(502).json({ error: `Gemini request failed: ${geminiRes.status} — ${JSON.stringify(err)}` });
    }

    const geminiData = await geminiRes.json();
    const recommendation = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    res.json({ recommendation, spendingSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
