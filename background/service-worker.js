// One Tap Background Service Worker — Nessie API integration
import { selectBestCard } from './card-selector.js';

const NESSIE_KEY = 'bd3eebec151b9c65737093fbb574dcac';
const CUSTOMER_ID = '69bef49c95150878eaffb700';
const NESSIE_BASE = 'http://api.nessieisreal.com';

// Visual + rewards metadata Nessie doesn't store
const CARD_META = {
  'Venture X':   { id: 'venture-x',   name: 'Venture X',   lastFour: '4821', type: 'visa',       rewardRate: 2,   bonusRate: 10,  rewardUnit: 'miles',       categories: ['travel', 'hotels', 'car-rental', 'flights'],              gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', textColor: '#FFFFFF', isDefault: true  },
  'SavorOne':    { id: 'savor-one',    name: 'SavorOne',    lastFour: '7293', type: 'mastercard', rewardRate: 1,   bonusRate: 3,   rewardUnit: 'cash back %', categories: ['dining', 'entertainment', 'streaming', 'groceries'],       gradient: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)', textColor: '#FFFFFF', isDefault: false },
  'Quicksilver': { id: 'quicksilver',  name: 'Quicksilver', lastFour: '5510', type: 'visa',       rewardRate: 1.5, bonusRate: 1.5, rewardUnit: 'cash back %', categories: ['everything'],                                             gradient: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 50%, #808080 100%)', textColor: '#1A1A1A', isDefault: false },
  'Venture':     { id: 'venture',      name: 'Venture',     lastFour: '3347', type: 'visa',       rewardRate: 2,   bonusRate: 5,   rewardUnit: 'miles',       categories: ['travel', 'hotels'],                                       gradient: 'linear-gradient(135deg, #004977 0%, #003557 50%, #002840 100%)', textColor: '#FFFFFF', isDefault: false },
};

// Mock offers — Nessie has no offers endpoint
const MOCK_OFFERS = [
  { id: 'offer-1', merchant: 'Amazon',        merchantIcon: '📦', description: '10% back on your next purchase',       discount: 0.10, maxSavings: 15.00,  expiresAt: '2026-04-15', cardId: 'venture-x',  activated: true  },
  { id: 'offer-2', merchant: 'Uber Eats',     merchantIcon: '🍔', description: '5x miles on delivery orders',          discount: 0.05, maxSavings: 10.00,  expiresAt: '2026-04-01', cardId: 'venture-x',  activated: false },
  { id: 'offer-3', merchant: 'DoorDash',      merchantIcon: '🚗', description: '20% off your first 3 orders',          discount: 0.20, maxSavings: 25.00,  expiresAt: '2026-03-30', cardId: 'savor-one',  activated: false },
  { id: 'offer-4', merchant: 'Target',        merchantIcon: '🎯', description: '3x points on all purchases',           discount: 0.03, maxSavings: 20.00,  expiresAt: '2026-04-20', cardId: 'quicksilver',activated: true  },
  { id: 'offer-5', merchant: 'Whole Foods',   merchantIcon: '🥑', description: '5% back on groceries',                 discount: 0.05, maxSavings: 12.00,  expiresAt: '2026-04-10', cardId: 'savor-one',  activated: false },
  { id: 'offer-6', merchant: 'Netflix',       merchantIcon: '🎬', description: '3 months of 3x rewards on streaming',  discount: 0.03, maxSavings: 5.00,   expiresAt: '2026-06-01', cardId: 'savor-one',  activated: true  },
  { id: 'offer-7', merchant: 'Delta Airlines',merchantIcon: '✈️', description: '10x miles on flights',                 discount: 0.10, maxSavings: 100.00, expiresAt: '2026-05-15', cardId: 'venture-x',  activated: false },
  { id: 'offer-8', merchant: 'Hilton Hotels', merchantIcon: '🏨', description: '8x miles on hotel bookings',           discount: 0.08, maxSavings: 80.00,  expiresAt: '2026-05-01', cardId: 'venture',    activated: false },
];

async function nessie(path, method = 'GET', body) {
  const res = await fetch(`${NESSIE_BASE}${path}?key=${NESSIE_KEY}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function getCards() {
  const accounts = await nessie(`/customers/${CUSTOMER_ID}/accounts`);
  if (!Array.isArray(accounts)) return [];
  return accounts
    .filter(a => a.type === 'Credit Card')
    .map(a => {
      const meta = CARD_META[a.nickname];
      if (!meta) return null;
      return { ...meta, nessieId: a._id, rewards: a.rewards };
    })
    .filter(Boolean);
}

async function getTransactions(cards) {
  const all = [];
  for (const card of cards) {
    const purchases = await nessie(`/accounts/${card.nessieId}/purchases`);
    if (!Array.isArray(purchases)) continue;
    for (const p of purchases) {
      const rewardUnit = card.rewardUnit.replace(' %', '');
      const rewardsEarned = rewardUnit === 'miles'
        ? Math.round(p.amount * card.rewardRate)
        : parseFloat((p.amount * card.rewardRate / 100).toFixed(2));
      all.push({
        id: p._id,
        merchant: p.description || 'Unknown',
        amount: p.amount,
        cardId: card.id,
        cardName: card.name,
        rewardsEarned,
        rewardUnit,
        date: p.purchase_date,
        status: p.status === 'executed' ? 'completed' : p.status,
      });
    }
  }
  return all.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true;
});

// Initialize settings on first install
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get('settings');
  if (!existing.settings) {
    await chrome.storage.local.set({
      settings: { autoDetect: true, showFloatingButton: true, defaultCardId: 'venture-x', notifications: true },
    });
  }
  console.log('[One Tap] Extension installed, connected to Nessie API');
});

async function handleMessage(message) {
  switch (message.type) {

    case 'GET_ALL_CARDS': {
      const cards = await getCards();
      return { cards };
    }

    case 'GET_TRANSACTIONS': {
      const cards = await getCards();
      const transactions = await getTransactions(cards);
      return { transactions };
    }

    case 'GET_OFFERS': {
      const { offers = MOCK_OFFERS } = await chrome.storage.local.get('offers');
      return { offers };
    }

    case 'CHECKOUT_DETECTED': {
      const { merchant, amount } = message.payload;
      const [cards, { offers = MOCK_OFFERS }] = await Promise.all([
        getCards(),
        chrome.storage.local.get('offers'),
      ]);
      const bestCard = selectBestCard(merchant, amount, cards, offers);
      const matchingOffers = offers.filter(o =>
        o.merchant.toLowerCase() === merchant.toLowerCase() ||
        merchant.toLowerCase().includes(o.merchant.toLowerCase())
      );
      return { bestCard, offers: matchingOffers, allCards: cards };
    }

    case 'GET_BEST_CARD': {
      const { merchant, amount } = message.payload;
      const [cards, { offers = MOCK_OFFERS }] = await Promise.all([
        getCards(),
        chrome.storage.local.get('offers'),
      ]);
      return { bestCard: selectBestCard(merchant, amount, cards, offers) };
    }

    case 'PROCESS_PAYMENT': {
      const { cardId, amount, merchant } = message.payload;
      const cards = await getCards();
      const card = cards.find(c => c.id === cardId);
      if (!card) return { success: false, error: 'Card not found' };

      // Find or create merchant in Nessie (search by name to avoid fetching all 20k+ merchants)
      const merchantSearch = await nessie(`/merchants?name=${encodeURIComponent(merchant)}`);
      let nessieMerchant = Array.isArray(merchantSearch) && merchantSearch.length > 0
        ? merchantSearch[0]
        : null;

      if (!nessieMerchant) {
        const res = await nessie('/merchants', 'POST', {
          name: merchant,
          category: 'general',
          address: { street_number: '1', street_name: 'Main St', city: 'Nashville', state: 'TN', zip: '37201' },
        });
        nessieMerchant = res.objectCreated;
      }

      // Post purchase to Nessie
      await nessie(`/accounts/${card.nessieId}/purchases`, 'POST', {
        merchant_id: nessieMerchant._id,
        medium: 'balance',
        purchase_date: new Date().toISOString().split('T')[0],
        amount,
        status: 'pending',
        description: merchant,
      });

      // Update rewards balance in Nessie
      const rewardUnit = card.rewardUnit.replace(' %', '');
      const rewardsEarned = rewardUnit === 'miles'
        ? Math.round(amount * card.rewardRate)
        : parseFloat((amount * card.rewardRate / 100).toFixed(2));
      await nessie(`/accounts/${card.nessieId}`, 'PUT', {
        rewards: card.rewards + rewardsEarned,
      });

      return {
        success: true,
        transaction: {
          id: `tx-${Date.now()}`,
          merchant,
          amount,
          cardId,
          rewardsEarned,
          rewardUnit,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
        },
        confirmationNumber: `CO-${Date.now().toString(36).toUpperCase()}`,
      };
    }

    case 'GET_SETTINGS': {
      const { settings } = await chrome.storage.local.get('settings');
      return { settings: settings || { autoDetect: true, showFloatingButton: true, notifications: true } };
    }

    case 'UPDATE_SETTINGS': {
      const { settings } = await chrome.storage.local.get('settings');
      const newSettings = { ...settings, ...message.payload };
      await chrome.storage.local.set({ settings: newSettings });
      return { settings: newSettings };
    }

    default:
      return { error: 'Unknown message type' };
  }
}
