// Card selection algorithm — picks the best Capital One card for a purchase
const MERCHANT_CATEGORIES = {
  // Dining
  'chipotle': 'dining', 'mcdonald': 'dining', 'starbucks': 'dining', 'doordash': 'dining',
  'ubereats': 'dining', 'grubhub': 'dining', 'dominos': 'dining', 'subway': 'dining',
  'restaurant': 'dining', 'cafe': 'dining', 'pizza': 'dining', 'sushi': 'dining',
  // Groceries
  'wholefood': 'groceries', 'kroger': 'groceries', 'walmart': 'groceries', 'target': 'groceries',
  'costco': 'groceries', 'trader': 'groceries', 'aldi': 'groceries', 'publix': 'groceries',
  // Travel
  'delta': 'travel', 'united': 'travel', 'american airlines': 'travel', 'southwest': 'travel',
  'airline': 'flights', 'flight': 'flights', 'booking': 'hotels', 'expedia': 'travel',
  'marriott': 'hotels', 'hilton': 'hotels', 'hyatt': 'hotels', 'airbnb': 'hotels',
  'hertz': 'car-rental', 'enterprise': 'car-rental', 'avis': 'car-rental',
  // Entertainment
  'netflix': 'streaming', 'spotify': 'streaming', 'hulu': 'streaming', 'disney': 'streaming',
  'hbo': 'streaming', 'youtube': 'streaming', 'apple tv': 'streaming',
  'amc': 'entertainment', 'cinema': 'entertainment', 'concert': 'entertainment',
};

export function selectBestCard(merchant, amount, cards, offers) {
  if (!cards || cards.length === 0) return null;

  const merchantLower = (merchant || '').toLowerCase().replace(/[^a-z]/g, '');

  // Determine merchant category
  let category = 'general';
  for (const [key, cat] of Object.entries(MERCHANT_CATEGORIES)) {
    if (merchantLower.includes(key.replace(/[^a-z]/g, ''))) {
      category = cat;
      break;
    }
  }

  // Score each card
  const scored = cards.map(card => {
    let score = card.rewardRate;

    // Bonus if card's categories match merchant
    if (card.categories.includes(category)) {
      score = card.bonusRate;
    }
    if (card.categories.includes('everything')) {
      score = Math.max(score, card.bonusRate);
    }

    // Bonus for matching active offers
    const matchingOffer = (offers || []).find(o =>
      o.cardId === card.id &&
      o.activated &&
      o.merchant.toLowerCase().replace(/[^a-z]/g, '').includes(merchantLower.slice(0, 4))
    );
    if (matchingOffer) {
      score += matchingOffer.discount * 10;
    }

    // Small bonus for being the default card (tiebreaker)
    if (card.isDefault) score += 0.1;

    return { card, score, category, matchingOffer };
  });

  scored.sort((a, b) => b.score - a.score);

  return {
    ...scored[0].card,
    _score: scored[0].score,
    _category: scored[0].category,
    _matchingOffer: scored[0].matchingOffer,
    _reason: scored[0].category !== 'general'
      ? `Best for ${scored[0].category} — earns ${scored[0].score}x`
      : `Earns ${scored[0].card.rewardRate}x on this purchase`,
  };
}
