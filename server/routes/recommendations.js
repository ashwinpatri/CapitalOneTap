const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const CardProduct = require('../models/CardProduct');
const Card = require('../models/Card');

// GET /api/recommendations/spending — spending breakdown from real transactions
router.get('/spending', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.userId,
      status: 'completed',
    });

    const spendingSummary = {};
    for (const tx of transactions) {
      const cat = tx.merchantCategory || 'general';
      spendingSummary[cat] = (spendingSummary[cat] || 0) + tx.amount;
    }
    for (const cat of Object.keys(spendingSummary)) {
      spendingSummary[cat] = Math.round(spendingSummary[cat]);
    }

    res.json({ spendingSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/recommendations — Gemini AI recommendation
router.get('/', auth, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Pull transactions, existing user cards, and all available products in parallel
    const [transactions, userCards, cardProducts] = await Promise.all([
      Transaction.find({ userId: req.userId, status: 'completed' }),
      Card.find({ userId: req.userId, isActive: true }),
      CardProduct.find({ isAvailable: true }),
    ]);

    if (!transactions.length) {
      return res.json({
        recommendation: 'No transaction history yet — make some purchases to get a personalized recommendation.',
        recommendedCardName: null,
        potentialSavings: 0,
        actualEarned: 0,
        additionalValue: 0,
      });
    }

    // Filter out cards the user already owns
    const ownedProductNames = new Set(userCards.map(c => c.productName));
    const availableProducts = cardProducts.filter(p => !ownedProductNames.has(p.name));

    if (!availableProducts.length) {
      return res.json({
        recommendation: 'You already have all available Capital One cards!',
        recommendedCardName: null,
        potentialSavings: 0,
        actualEarned: 0,
        additionalValue: 0,
      });
    }

    // Build spending summary for prompt
    const spendingSummary = {};
    for (const tx of transactions) {
      const cat = tx.merchantCategory || 'general';
      spendingSummary[cat] = (spendingSummary[cat] || 0) + tx.amount;
    }
    for (const cat of Object.keys(spendingSummary)) {
      spendingSummary[cat] = Math.round(spendingSummary[cat]);
    }

    const spendingStr = Object.entries(spendingSummary)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `${cat}: $${amt}`)
      .join(', ');

    // Format available card products with full details for the prompt
    const cardListStr = availableProducts.map(c => {
      const tiers = c.rewardTiers.map(t => {
        const unitLabel = t.unit === 'percent_cashback' || t.unit === 'percent_back'
          ? '% cash back' : `x ${t.unit}`;
        const qualifier = t.qualifier ? ` (${t.qualifier})` : '';
        return `  - ${t.rate}${unitLabel} on: ${t.categories.join(', ')}${qualifier}`;
      }).join('\n');
      const fee = c.annualFee > 0 ? `$${c.annualFee}/year` : 'No annual fee';
      const intro = c.defaultIntroOffer ? `Intro offer: ${c.defaultIntroOffer.description}` : null;
      const desc = c.description ? `Description: ${c.description}` : null;
      return [
        `Card: ${c.name}`,
        `Annual Fee: ${fee}`,
        `Network: ${c.network}`,
        `Credit Level: ${c.creditLevel || 'not specified'}`,
        `Rewards:\n${tiers}`,
        intro,
        desc,
      ].filter(Boolean).join('\n');
    }).join('\n\n---\n\n');

    const ownedStr = userCards.length
      ? `Cards this customer already owns (do NOT recommend these): ${[...ownedProductNames].join(', ')}`
      : 'This customer has no Capital One cards yet.';

    const prompt = `You are a credit card advisor in a browser extension. Be brief and direct.

USER SPENDING (by category):
${spendingStr}

${ownedStr}

AVAILABLE CARDS:
${cardListStr}

OUTPUT RULES:
- Use plain dollar signs like $94, never LaTeX like \\$94
- Keep every bullet to ONE line, no sub-explanations
- 2-3 sentences max for the summary — be concise
- Only list real drawbacks (skip "$0 annual fee", skip anything neutral or positive)
- Do NOT hallucinate features — only use data from the card list above

OUTPUT FORMAT (copy exactly, replace bracketed placeholders):

**Recommended Card:** [Exact card name from the list above]

Why This Card Fits Your Spending:
[2-3 sentences. Name the top spending categories, state the reward rates, give one estimated dollar figure. No filler.]

Key Benefits:
- [Rate + category, tied to user's actual spend — one line]
- [Another benefit — one line]
- [Optional third benefit — one line]

Drawbacks:
- [Only real tradeoffs. Skip if none. Do NOT mention $0 annual fee.]`;


    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!geminiRes.ok) {
      return res.status(502).json({ error: `Gemini request failed: ${geminiRes.status}` });
    }

    const geminiData = await geminiRes.json();
    const recommendation = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Extract recommended card name — handle bold or plain, strip ** markers
    const cardNameMatch = recommendation.match(/(?:\*\*)?Recommended Card:(?:\*\*)?\s*\*{0,2}([^\n*]+)\*{0,2}/i);
    const recommendedCardName = cardNameMatch
      ? cardNameMatch[1].replace(/\*\*/g, '').trim()
      : null;

    // Find the recommended product for savings calculation
    const recommendedProduct = recommendedCardName
      ? availableProducts.find(p =>
          p.name.toLowerCase() === recommendedCardName.toLowerCase() ||
          p.name.toLowerCase().includes(recommendedCardName.toLowerCase()) ||
          recommendedCardName.toLowerCase().includes(p.name.toLowerCase())
        )
      : null;

    function toRewardDollars(rewardsEarned, rewardUnit) {
      return rewardUnit === 'cash back' ? rewardsEarned : rewardsEarned * 0.01;
    }

    function getBestTierForCategory(product, category) {
      let bestRate = 0;
      let bestUnit = 'points';
      for (const tier of (product?.rewardTiers || [])) {
        if (tier.categories.includes(category) || tier.categories.includes('everything')) {
          if (tier.rate > bestRate) {
            bestRate = tier.rate;
            bestUnit = tier.unit;
          }
        }
      }
      return { rate: bestRate, unit: bestUnit };
    }

    function calcDollarValue(amount, rate, unit) {
      if (unit === 'percent_cashback' || unit === 'percent_back') return amount * rate / 100;
      return amount * rate * 0.01;
    }

    let actualEarned = 0;
    let potentialSavings = 0;

    for (const tx of transactions) {
      actualEarned += toRewardDollars(tx.rewardsEarned, tx.rewardUnit);
      if (recommendedProduct) {
        const { rate, unit } = getBestTierForCategory(recommendedProduct, tx.merchantCategory || 'general');
        potentialSavings += calcDollarValue(tx.amount, rate, unit);
      }
    }

    actualEarned = Math.round(actualEarned * 100) / 100;
    potentialSavings = Math.round(potentialSavings * 100) / 100;
    const additionalValue = Math.max(0, Math.round((potentialSavings - actualEarned) * 100) / 100);

    res.json({ recommendation, recommendedCardName, potentialSavings, actualEarned, additionalValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
