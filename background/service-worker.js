// One Tap Background Service Worker — MongoDB backend
import * as api from './api.js';

// Load data from API and cache in storage
async function refreshData() {
  try {
    const loggedIn = await api.isLoggedIn();
    if (!loggedIn) {
      console.log('[One Tap] Not logged in, skipping refresh');
      return { cards: [], offers: [], transactions: [], settings: {} };
    }

    const [cards, offers, transactions] = await Promise.all([
      api.fetchCards(),
      api.fetchOffers().catch(() => []),
      api.fetchTransactions().catch(() => []),
    ]);

    const settings = (await chrome.storage.local.get('settings')).settings || {
      autoDetect: true,
      showFloatingButton: true,
      notifications: true,
      defaultCardId: cards[0]?._id || null,
    };

    await chrome.storage.local.set({ cards, offers, transactions, settings });
    console.log(`[One Tap] Data refreshed — ${cards.length} cards, ${transactions.length} transactions`);
    return { cards, offers, transactions, settings };
  } catch (err) {
    console.error('[One Tap] Refresh failed:', err);
    return chrome.storage.local.get(['cards', 'offers', 'transactions', 'settings']);
  }
}

chrome.runtime.onInstalled.addListener(() => refreshData());

// Message handler
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true;
});

async function handleMessage(message) {
  switch (message.type) {
    // ===== Auth =====
    case 'GOOGLE_LOGIN': {
      try {
        const CLIENT_ID = '196802038272-qusfgtfsl6n515seqh22cqf28koh7b6t.apps.googleusercontent.com';
        const REDIRECT_URI = 'https://iglldahcailcddegenopplhmeoebhohh.chromiumapp.org/';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=email%20profile`;
        const redirectUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true });
        const params = new URLSearchParams(new URL(redirectUrl).hash.slice(1));
        const googleToken = params.get('access_token');
        if (!googleToken) return { success: false, error: 'No token received' };
        const data = await api.googleLogin(googleToken);
        await refreshData();
        return { success: true, user: data.user };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    case 'LOGIN': {
      try {
        const { username, password } = message.payload;
        const data = await api.login(username, password);
        await refreshData();
        return { success: true, user: data.user };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    case 'REGISTER': {
      try {
        const { username, email, password, firstName, lastName } = message.payload;
        const data = await api.register(username, email, password, firstName, lastName);
        await refreshData();
        return { success: true, user: data.user };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    case 'LOGOUT': {
      await api.logout();
      await chrome.storage.local.clear();
      return { success: true };
    }

    case 'CHECK_AUTH': {
      const loggedIn = await api.isLoggedIn();
      const userData = (await chrome.storage.local.get('user')).user || null;
      return { loggedIn, user: userData };
    }

    // ===== Cards =====
    case 'GET_ALL_CARDS': {
      const data = await chrome.storage.local.get('cards');
      return { cards: data.cards || [] };
    }

    case 'ADD_CARD': {
      try {
        const { productName, lastFour, balance, fullNumber, expMonth, expYear, cvv, cardholderName } = message.payload;
        const data = await api.addCard(productName, lastFour, balance, fullNumber, expMonth, expYear, cvv, cardholderName);
        await chrome.storage.local.set({ cards: data.cards });
        return { success: true, cards: data.cards };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    case 'EDIT_CARD': {
      try {
        const { cardId, updates } = message.payload;
        const data = await api.editCard(cardId, updates);
        await chrome.storage.local.set({ cards: data.cards });
        return { success: true, cards: data.cards };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    case 'DELETE_CARD': {
      try {
        const data = await api.deleteCard(message.payload.cardId);
        await chrome.storage.local.set({ cards: data.cards });
        return { success: true, cards: data.cards };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    case 'SET_DEFAULT_CARD': {
      try {
        const data = await api.setDefaultCard(message.payload.cardId);
        await chrome.storage.local.set({ cards: data.cards });
        return { success: true, cards: data.cards };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    case 'GET_CARD_PRODUCTS': {
      try {
        const products = await api.fetchCardProducts();
        return { products };
      } catch (e) {
        return { products: [], error: e.message };
      }
    }

    // ===== Transactions =====
    case 'GET_TRANSACTIONS': {
      const data = await chrome.storage.local.get('transactions');
      return { transactions: data.transactions || [] };
    }

    case 'PROCESS_PAYMENT': {
      try {
        const { cardId, amount, merchant } = message.payload;
        const data = await api.createTransaction(cardId, merchant, amount);
        // Refresh to get updated balances
        await refreshData();
        return { success: true, transaction: data.transaction, confirmationNumber: data.confirmationNumber };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    // ===== Offers =====
    case 'GET_OFFERS': {
      const data = await chrome.storage.local.get('offers');
      return { offers: data.offers || [] };
    }

    case 'ACTIVATE_OFFER': {
      try {
        await api.activateOffer(message.payload.offerId);
        await refreshData();
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    // ===== Settings =====
    case 'GET_SETTINGS': {
      const data = await chrome.storage.local.get('settings');
      return { settings: data.settings || {} };
    }

    case 'UPDATE_SETTINGS': {
      try {
        const data = await api.updateSettings(message.payload);
        await chrome.storage.local.set({ settings: data.settings });
        return { settings: data.settings };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    // ===== Checkout =====
    case 'CHECKOUT_DETECTED': {
      const { cards, offers } = await chrome.storage.local.get(['cards', 'offers']);
      if (!cards || cards.length === 0) return { bestCard: null, offers: [], allCards: [] };

      const { merchant } = message.payload;
      const { bestCard, allScoredCards } = selectBestCard(merchant, cards);
      const matchingOffers = (offers || []).filter(o =>
        o.merchant.toLowerCase() === merchant.toLowerCase() ||
        merchant.toLowerCase().includes(o.merchant.toLowerCase())
      );
      return { bestCard, offers: matchingOffers, allCards: allScoredCards };
    }

    case 'GET_SPENDING': {
      try {
        const data = await api.fetchSpending();
        return { success: true, spendingSummary: data.spendingSummary };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    case 'GET_RECOMMENDATION': {
      try {
        const data = await api.fetchRecommendation();
        return {
          success: true,
          recommendation: data.recommendation,
          recommendedCardName: data.recommendedCardName,
          potentialSavings: data.potentialSavings,
          actualEarned: data.actualEarned,
          additionalValue: data.additionalValue,
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    case 'REFRESH_DATA': {
      const fresh = await refreshData();
      return { success: true, ...fresh };
    }

    default:
      return { error: 'Unknown message type' };
  }
}

// Best card selection using tiered reward structure
function selectBestCard(merchant, cards) {
  if (!cards || cards.length === 0) return null;

  const merchantLower = merchant.toLowerCase().replace(/[^a-z]/g, '');

  // Simple category detection (cached merchant categories would be better)
  const CATEGORIES = {
    chipotle: 'dining', mcdonald: 'dining', starbucks: 'dining', doordash: 'dining',
    ubereats: 'dining', grubhub: 'dining', restaurant: 'dining', cafe: 'dining',
    wholefood: 'groceries', kroger: 'groceries', walmart: 'groceries', target: 'groceries',
    costco: 'groceries', trader: 'groceries',
    delta: 'flights', united: 'flights', southwest: 'flights', jetblue: 'flights',
    marriott: 'hotels', hilton: 'hotels', hyatt: 'hotels', airbnb: 'hotels',
    hertz: 'car-rental', enterprise: 'car-rental', avis: 'car-rental',
    netflix: 'streaming', spotify: 'streaming', hulu: 'streaming', disney: 'streaming',
    amc: 'entertainment', cinema: 'entertainment',
    basspro: 'bass-pro', cabela: 'bass-pro',
  };

  let category = 'general';
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (merchantLower.includes(key)) { category = cat; break; }
  }

  // Score each card by finding the best matching tier
  const scored = cards.map(card => {
    const tiers = card.rewardTiers || [];
    let bestRate = 0;
    let matchedTier = null;

    for (const tier of tiers) {
      if (tier.categories.includes(category) || tier.categories.includes('everything')) {
        if (tier.rate > bestRate) {
          bestRate = tier.rate;
          matchedTier = tier;
        }
      }
    }

    return { card, rate: bestRate, tier: matchedTier, category };
  });

  scored.sort((a, b) => b.rate - a.rate);
  const best = scored[0];

  const CATEGORY_LABELS = {
    dining: 'dining & restaurants',
    groceries: 'grocery stores',
    flights: 'flights',
    hotels: 'hotels',
    'car-rental': 'car rentals',
    streaming: 'streaming services',
    entertainment: 'entertainment',
    gas: 'gas stations',
    transit: 'rideshares & transit',
    'bass-pro': 'Bass Pro Shops & Cabela\'s',
  };

  function formatReward(rate, unit) {
    if (unit === 'percent_cashback') return `${rate}% cash back`;
    if (unit === 'miles') return `${rate}x miles`;
    return `${rate}x points`;
  }

  const bestLabel = formatReward(best.rate, best.tier?.unit || 'points');
  const categoryLabel = CATEGORY_LABELS[best.category] || 'this purchase';

  let reason;
  if (best.category !== 'general') {
    reason = `${merchant} is a ${categoryLabel} merchant — your ${best.card.productName} earns ${bestLabel} here`;
  } else {
    reason = `Your ${best.card.productName} earns ${bestLabel} on every purchase`;
  }

  // Attach scores to all cards so the UI can show per-merchant rates
  const scoredCards = scored.map(s => ({
    ...s.card,
    _score: s.rate,
    _unit: s.tier?.unit || 'points',
    _category: s.category,
    _rewardLabel: formatReward(s.rate, s.tier?.unit || 'points'),
  }));

  const runnerUp = scored[1] || null;

  return {
    bestCard: {
      ...best.card,
      _score: best.rate,
      _unit: best.tier?.unit || 'points',
      _category: best.category,
      _reason: reason,
      _runnerUp: runnerUp ? {
        productName: runnerUp.card.productName,
        rewardLabel: formatReward(runnerUp.rate, runnerUp.tier?.unit || 'points'),
      } : null,
    },
    allScoredCards: scoredCards,
  };
}
