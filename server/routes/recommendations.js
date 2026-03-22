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

    const prompt = `You are a financial assistant embedded inside a browser extension.

Your goal is to recommend the BEST credit card for this user and clearly explain WHY, using their actual spending behavior.

You are given:
- The user's past transaction history (by category and total spend)
- The available credit cards (including rewards, categories, fees, and benefits)
- The cards the user already owns

---

### USER SPENDING HISTORY

${spendingStr}

---

### AVAILABLE CARDS (do NOT recommend any card marked as already owned)

${cardListStr}

---

### ${ownedStr}

---

### TASK

1. Select the best card for this user based on their spending patterns.
2. Generate a clear, structured explanation.

---

### OUTPUT FORMAT (STRICT)

**Recommended Card:** [Exact card name from the available list above]

Why This Card Fits Your Spending:
<2–3 sentence summary that explains the recommendation using the user's actual spending patterns. Make it personalized and concrete. Include estimated reward if possible.>

Key Benefits:
- <2–4 bullet points highlighting the most relevant benefits for THIS user based on their spending>
- <Tie each benefit to actual behavior when possible>
- <Include reward percentages and categories>

Drawbacks:
- <Only include REAL tradeoffs or limitations>
- <Examples: annual fee (ONLY if non-zero), reward caps, missing categories, weaker earning vs other cards, foreign transaction fees>
- <DO NOT list something as a drawback if it is neutral or positive (e.g., "$0 annual fee")>

---

### IMPORTANT RULES

- Personalize everything using the user's spending history (e.g., "You spend heavily on dining and groceries each month")
- Quantify when possible (e.g., "This earns ~3% on your dining purchases")
- Compare implicitly or explicitly to other cards when relevant
- Only mention fees if they are actually a downside ($95 annual fee = drawback, $0 annual fee = do NOT include)
- Do NOT hallucinate card features — only use data from the card list above
- Do NOT be generic

---

### TONE

- Clear, concise, and smart
- Sounds like a helpful financial advisor
- No fluff, no marketing language

---

Now generate the recommendation.`;

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

    // Extract recommended card name from the response (strip any residual ** markdown)
    const cardNameMatch = recommendation.match(/\*\*Recommended Card:\*\*\s*(.+)/i);
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
