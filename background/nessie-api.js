// Nessie Capital One API integration
const API_BASE = 'http://api.nessieisreal.com';
const API_KEY = 'c120de75c4dec10a9d308561df997a83';
const CUSTOMER_ID = '69bef48195150878eaffb6fe';

// Card metadata that Nessie doesn't store (visual/reward info)
const CARD_META = {
  'Venture X': {
    type: 'visa', rewardRate: 2, bonusRate: 10, rewardUnit: 'miles',
    categories: ['travel', 'hotels', 'car-rental', 'flights'],
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    textColor: '#FFFFFF', isDefault: true,
  },
  'SavorOne': {
    type: 'mastercard', rewardRate: 1, bonusRate: 3, rewardUnit: 'cash back %',
    categories: ['dining', 'entertainment', 'streaming', 'groceries'],
    gradient: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)',
    textColor: '#FFFFFF', isDefault: false,
  },
  'Quicksilver': {
    type: 'visa', rewardRate: 1.5, bonusRate: 1.5, rewardUnit: 'cash back %',
    categories: ['everything'],
    gradient: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 50%, #808080 100%)',
    textColor: '#1A1A1A', isDefault: false,
  },
  'Venture': {
    type: 'visa', rewardRate: 2, bonusRate: 5, rewardUnit: 'miles',
    categories: ['travel', 'hotels'],
    gradient: 'linear-gradient(135deg, #004977 0%, #003557 50%, #002840 100%)',
    textColor: '#FFFFFF', isDefault: false,
  },
};

// Category to card metadata mapping for user-added cards
const CATEGORY_META = {
  'travel': {
    type: 'visa', rewardRate: 2, bonusRate: 5, rewardUnit: 'miles',
    categories: ['travel', 'hotels', 'car-rental', 'flights'],
    gradient: 'linear-gradient(135deg, #004977 0%, #003557 50%, #002840 100%)',
    textColor: '#FFFFFF',
  },
  'dining': {
    type: 'mastercard', rewardRate: 1, bonusRate: 3, rewardUnit: 'cash back %',
    categories: ['dining', 'entertainment', 'streaming', 'groceries'],
    gradient: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)',
    textColor: '#FFFFFF',
  },
  'cashback': {
    type: 'visa', rewardRate: 1.5, bonusRate: 1.5, rewardUnit: 'cash back %',
    categories: ['everything'],
    gradient: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 50%, #808080 100%)',
    textColor: '#1A1A1A',
  },
  'general': {
    type: 'visa', rewardRate: 1, bonusRate: 1, rewardUnit: 'points',
    categories: ['everything'],
    gradient: 'linear-gradient(135deg, #3a3a5c 0%, #2a2a4a 50%, #1a1a3a 100%)',
    textColor: '#FFFFFF',
  },
};

// Extra card details stored locally (last four, category) since Nessie doesn't support them
let cardExtras = {}; // { accountId: { lastFour, category } }

async function loadCardExtras() {
  const data = await chrome.storage.local.get('cardExtras');
  cardExtras = data.cardExtras || {};
}

async function saveCardExtras() {
  await chrome.storage.local.set({ cardExtras });
}

loadCardExtras();

function url(path) {
  const sep = path.includes('?') ? '&' : '?';
  return `${API_BASE}${path}${sep}key=${API_KEY}`;
}

async function apiFetch(path, options = {}) {
  const fullUrl = url(path);
  console.log(`[One Tap API] ${options.method || 'GET'} ${fullUrl}`);
  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    console.log(`[One Tap API] Response: ${res.status}`);
    if (!res.ok) throw new Error(`Nessie API error: ${res.status} ${res.statusText}`);
    return res.json();
  } catch (err) {
    console.error(`[One Tap API] Fetch failed:`, err.message);
    throw err;
  }
}

// Fetch all credit card accounts and merge with card metadata
export async function fetchCards() {
  await loadCardExtras();
  const accounts = await apiFetch(`/customers/${CUSTOMER_ID}/accounts`);
  return accounts
    .filter(a => a.type === 'Credit Card')
    .map((a, i) => {
      const extras = cardExtras[a._id] || {};
      // Try known card names first, then category-based meta, then default
      const meta = CARD_META[a.nickname] || CATEGORY_META[extras.category] || CATEGORY_META['general'];
      const lastFour = extras.lastFour || String(Math.abs(hashCode(a._id))).slice(-4).padStart(4, '0');
      return {
        id: a._id,
        name: a.nickname,
        lastFour,
        balance: a.balance,
        rewards: a.rewards,
        ...meta,
        isDefault: i === 0,
      };
    });
}

// Fetch purchases across all accounts
export async function fetchTransactions(cards) {
  const allPurchases = [];
  for (const card of cards) {
    try {
      const purchases = await apiFetch(`/accounts/${card.id}/purchases`);
      for (const p of purchases) {
        allPurchases.push({
          id: p._id,
          merchant: p.description || 'Unknown',
          amount: p.amount,
          cardId: card.id,
          cardName: card.name,
          rewardsEarned: card.rewardUnit.includes('miles')
            ? Math.round(p.amount * card.rewardRate)
            : parseFloat((p.amount * card.rewardRate / 100).toFixed(2)),
          rewardUnit: card.rewardUnit.replace(' %', ''),
          date: p.purchase_date,
          status: p.status || 'completed',
        });
      }
    } catch (e) {
      console.warn(`[One Tap] Failed to fetch purchases for ${card.name}:`, e);
    }
  }
  allPurchases.sort((a, b) => new Date(b.date) - new Date(a.date));
  return allPurchases;
}

// Create a purchase via the API
export async function createPurchase(accountId, merchantId, amount, description) {
  return apiFetch(`/accounts/${accountId}/purchases`, {
    method: 'POST',
    body: JSON.stringify({
      merchant_id: merchantId,
      medium: 'balance',
      purchase_date: new Date().toISOString().split('T')[0],
      amount,
      description,
    }),
  });
}

// Fetch merchants from Nessie
export async function fetchMerchants() {
  return apiFetch('/merchants');
}

// Find a merchant by name (fuzzy match)
export async function findMerchant(name) {
  const merchants = await fetchMerchants();
  const lower = name.toLowerCase();
  return merchants.find(m => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase()));
}

// Create a new credit card account via Nessie API
export async function createCard(nickname, balance, rewards, lastFour, category) {
  const result = await apiFetch(`/customers/${CUSTOMER_ID}/accounts`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'Credit Card',
      nickname,
      rewards: rewards || 0,
      balance: balance || 0,
    }),
  });

  // Store extra details locally that Nessie doesn't support
  if (result.objectCreated) {
    cardExtras[result.objectCreated._id] = { lastFour, category };
    await saveCardExtras();
  }

  return result;
}

// Delete a credit card account via Nessie API
export async function deleteCard(accountId) {
  const fullUrl = url(`/accounts/${accountId}`);
  console.log(`[One Tap API] DELETE ${fullUrl}`);
  const res = await fetch(fullUrl, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  console.log(`[One Tap API] Delete response: ${res.status}`);
  // Delete may return empty body
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete failed: ${res.status}`);
  }
  // Clean up local extras
  delete cardExtras[accountId];
  await saveCardExtras();
  return { success: true };
}

// Get available card types (for the add card form)
export function getCardTypes() {
  return Object.entries(CARD_META).map(([name, meta]) => ({
    name,
    ...meta,
  }));
}

// Simple hash for generating consistent last-4 digits from account IDs
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
