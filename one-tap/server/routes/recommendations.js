const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const MOCK_SPENDING = {
  dining: 420,
  groceries: 310,
  travel: 890,
  streaming: 55,
  entertainment: 130,
  gas: 95,
  transit: 60,
  shopping: 275,
  hotels: 480,
};

const CARD_PRODUCTS = [
  {
    name: 'Venture X',
    annualFee: 395,
    rewardTiers: [
      { rate: 10, unit: 'miles', categories: ['hotels', 'car-rental'] },
      { rate: 5, unit: 'miles', categories: ['flights'] },
      { rate: 2, unit: 'miles', categories: ['everything'] },
    ],
  },
  {
    name: 'SavorOne',
    annualFee: 0,
    rewardTiers: [
      { rate: 3, unit: 'percent_cashback', categories: ['dining', 'entertainment', 'streaming', 'groceries'] },
      { rate: 1, unit: 'percent_cashback', categories: ['everything'] },
    ],
  },
  {
    name: 'Quicksilver',
    annualFee: 0,
    rewardTiers: [
      { rate: 1.5, unit: 'percent_cashback', categories: ['everything'] },
    ],
  },
  {
    name: 'Venture',
    annualFee: 95,
    rewardTiers: [
      { rate: 5, unit: 'miles', categories: ['hotels', 'car-rental'] },
      { rate: 2, unit: 'miles', categories: ['everything'] },
    ],
  },
  {
    name: 'Savor',
    annualFee: 95,
    rewardTiers: [
      { rate: 4, unit: 'percent_cashback', categories: ['dining', 'entertainment'] },
      { rate: 3, unit: 'percent_cashback', categories: ['streaming', 'groceries'] },
      { rate: 1, unit: 'percent_cashback', categories: ['everything'] },
    ],
  },
];

router.get('/', auth, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const spendingSummary = Object.entries(MOCK_SPENDING)
      .map(([cat, amt]) => `${cat}: $${amt}`)
      .join(', ');

    const cardList = CARD_PRODUCTS.map(c => {
      const tiers = c.rewardTiers.map(t =>
        `${t.rate}x ${t.unit === 'percent_cashback' ? '% cash back' : t.unit} on ${t.categories.join('/')}`
      ).join('; ');
      return `${c.name} ($${c.annualFee}/yr annual fee): ${tiers}`;
    }).join('\n');

    const prompt = `A user spent the following amounts last month: ${spendingSummary}.

Here are the available Capital One cards:
${cardList}

Based purely on which card earns the most rewards for this spending mix, respond with exactly one sentence in this format: "We recommend the [Card Name] because [reason]." Do not include anything else.`;

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

    res.json({ recommendation, spendingSummary: MOCK_SPENDING });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
