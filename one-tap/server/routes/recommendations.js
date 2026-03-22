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

    // Build spending summary
    const spendingSummary = {};
    for (const tx of transactions) {
      const cat = tx.merchantCategory || 'general';
      spendingSummary[cat] = (spendingSummary[cat] || 0) + tx.amount;
    }
    for (const cat of Object.keys(spendingSummary)) {
      spendingSummary[cat] = Math.round(spendingSummary[cat]);
    }

    // For each spending category, find what rate the user's existing cards already cover
    function bestExistingRate(category) {
      let best = { rate: 0, cardName: null, unit: 'points' };
      for (const card of userCards) {
        for (const tier of (card.rewardTiers || [])) {
          if ((tier.categories || []).includes(category) || (tier.categories || []).includes('everything')) {
            if (tier.rate > best.rate) {
              best = { rate: tier.rate, cardName: card.productName, unit: tier.unit };
            }
          }
        }
      }
      return best;
    }

    // Build coverage analysis sorted by spend (highest first)
    const sortedSpend = Object.entries(spendingSummary).sort((a, b) => b[1] - a[1]);

    const coverageLines = sortedSpend.map(([cat, amt]) => {
      const existing = bestExistingRate(cat);
      const unitLabel = existing.unit === 'percent_cashback' || existing.unit === 'percent_back'
        ? '% cash back' : `x ${existing.unit}`;
      const coverage = existing.rate > 0
        ? `already earning ${existing.rate}${unitLabel} with ${existing.cardName}`
        : 'no existing card covers this';
      return `  ${cat}: $${amt} — ${coverage}`;
    }).join('\n');

    // Format available card products
    const cardListStr = availableProducts.map(c => {
      const tiers = c.rewardTiers.map(t => {
        const unitLabel = t.unit === 'percent_cashback' || t.unit === 'percent_back'
          ? '% cash back' : `x ${t.unit}`;
        const qualifier = t.qualifier ? ` (${t.qualifier})` : '';
        return `  - ${t.rate}${unitLabel} on: ${t.categories.join(', ')}${qualifier}`;
      }).join('\n');
      const fee = c.annualFee > 0 ? `$${c.annualFee}/year` : 'No annual fee';
      return [
        `Card: ${c.name} | Annual Fee: ${fee}`,
        `Rewards:\n${tiers}`,
      ].join('\n');
    }).join('\n\n---\n\n');

    const ownedCardsList = userCards.length
      ? [...ownedProductNames].join(', ')
      : 'none';

    const prompt = `You are an expert financial writer with perfect grammar and a sharp, concise voice.

CARDS THE USER ALREADY OWNS — DO NOT RECOMMEND ANY OF THESE:
${ownedCardsList}

SPENDING ANALYSIS (sorted by dollar amount, highest first — this is the priority order):
${coverageLines}

CARDS AVAILABLE TO RECOMMEND (these are the ONLY cards you may recommend — the user does NOT own any of these):
${cardListStr}

YOUR TASK:
You are recommending a NEW card the user does not yet have. Never recommend a card the user already owns.
Evaluate whether any of the available cards above would meaningfully improve the user's rewards on their HIGHEST spending categories. Base your decision primarily on the largest spend categories first.

- If the user's existing cards already cover their top spending categories well, say so — do NOT force a recommendation just to give one.
- Only recommend a card if it offers a clear, meaningful improvement on a high-spend category that isn't well-covered.

OUTPUT FORMAT (follow exactly):

**Recommended Card:** [Exact card name from the list, OR write "None — your current cards are well-optimized" if no card adds meaningful value]

Why This Card Fits Your Spending:
[ONE sentence only. State which top spending category this helps and what rate it earns. If recommending None, write one sentence explaining which existing card covers the top category and why no upgrade is needed.]

Key Benefits:
- [**Rate** on Category — one line only]
- [**Rate** on Category — one line only]
- [Optional third benefit — one line only]

Drawbacks:
- [One real tradeoff — annual fee if non-zero, missing a key category, etc.]
- [Omit this section entirely if no real drawbacks. Never list "$0 annual fee" as a drawback.]

RULES:
- Use plain $ signs (never LaTeX \\$)
- Bold all key rates and numbers using **like this**
- Every bullet is one line — no parenthetical notes, no elaboration
- Do NOT include spending dollar amounts in the output — only mention categories and reward rates
- Do NOT write things like "groceries ($94)" or "your $94 grocery spend" — just say "groceries"
- Perfect grammar and professional tone throughout
- Only use data from the card list above — no invented features`;


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
    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    // Strip spending amounts Gemini sometimes injects from context, e.g. "groceries ($94)" -> "groceries"
    // Also clean empty parens () or ($) that slip through
    const recommendation = raw
      .replace(/\s*\(\s*\$[\d,]*\s*\)/g, '')  // ($94) or ($0) or ($)
      .replace(/\s*\(\s*\)/g, '')              // empty ()
      .trim();

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
