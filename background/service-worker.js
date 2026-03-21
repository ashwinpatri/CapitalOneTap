// One Tap Background Service Worker
import { selectBestCard } from './card-selector.js';

// Initialize mock data on install
chrome.runtime.onInstalled.addListener(async () => {
  const mockCards = [
    { id: 'venture-x', name: 'Venture X', lastFour: '4821', type: 'visa', rewardRate: 2, bonusRate: 10, rewardUnit: 'miles', categories: ['travel', 'hotels', 'car-rental', 'flights'], gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', textColor: '#FFFFFF', isDefault: true },
    { id: 'savor-one', name: 'SavorOne', lastFour: '7293', type: 'mastercard', rewardRate: 1, bonusRate: 3, rewardUnit: 'cash back %', categories: ['dining', 'entertainment', 'streaming', 'groceries'], gradient: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)', textColor: '#FFFFFF', isDefault: false },
    { id: 'quicksilver', name: 'Quicksilver', lastFour: '5510', type: 'visa', rewardRate: 1.5, bonusRate: 1.5, rewardUnit: 'cash back %', categories: ['everything'], gradient: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 50%, #808080 100%)', textColor: '#1A1A1A', isDefault: false },
    { id: 'venture', name: 'Venture', lastFour: '3347', type: 'visa', rewardRate: 2, bonusRate: 5, rewardUnit: 'miles', categories: ['travel', 'hotels'], gradient: 'linear-gradient(135deg, #004977 0%, #003557 50%, #002840 100%)', textColor: '#FFFFFF', isDefault: false },
  ];

  const mockOffers = [
    { id: 'offer-1', merchant: 'Amazon', merchantIcon: '📦', description: '10% back on your next purchase', discount: 0.10, maxSavings: 15.00, expiresAt: '2026-04-15', cardId: 'venture-x', activated: true },
    { id: 'offer-2', merchant: 'Uber Eats', merchantIcon: '🍔', description: '5x miles on delivery orders', discount: 0.05, maxSavings: 10.00, expiresAt: '2026-04-01', cardId: 'venture-x', activated: false },
    { id: 'offer-3', merchant: 'DoorDash', merchantIcon: '🚗', description: '20% off your first 3 orders', discount: 0.20, maxSavings: 25.00, expiresAt: '2026-03-30', cardId: 'savor-one', activated: false },
    { id: 'offer-4', merchant: 'Target', merchantIcon: '🎯', description: '3x points on all purchases', discount: 0.03, maxSavings: 20.00, expiresAt: '2026-04-20', cardId: 'quicksilver', activated: true },
    { id: 'offer-5', merchant: 'Whole Foods', merchantIcon: '🥑', description: '5% back on groceries', discount: 0.05, maxSavings: 12.00, expiresAt: '2026-04-10', cardId: 'savor-one', activated: false },
    { id: 'offer-6', merchant: 'Netflix', merchantIcon: '🎬', description: '3 months of 3x rewards on streaming', discount: 0.03, maxSavings: 5.00, expiresAt: '2026-06-01', cardId: 'savor-one', activated: true },
    { id: 'offer-7', merchant: 'Delta Airlines', merchantIcon: '✈️', description: '10x miles on flights', discount: 0.10, maxSavings: 100.00, expiresAt: '2026-05-15', cardId: 'venture-x', activated: false },
    { id: 'offer-8', merchant: 'Hilton Hotels', merchantIcon: '🏨', description: '8x miles on hotel bookings', discount: 0.08, maxSavings: 80.00, expiresAt: '2026-05-01', cardId: 'venture', activated: false },
  ];

  const mockTransactions = [
    { id: 'tx-1', merchant: 'Amazon', amount: 42.99, cardId: 'venture-x', rewardsEarned: 86, rewardUnit: 'miles', date: '2026-03-21', status: 'completed' },
    { id: 'tx-2', merchant: 'Chipotle', amount: 14.25, cardId: 'savor-one', rewardsEarned: 0.43, rewardUnit: 'cash back', date: '2026-03-20', status: 'completed' },
    { id: 'tx-3', merchant: 'Target', amount: 87.50, cardId: 'quicksilver', rewardsEarned: 1.31, rewardUnit: 'cash back', date: '2026-03-19', status: 'completed' },
    { id: 'tx-4', merchant: 'Delta Airlines', amount: 389.00, cardId: 'venture-x', rewardsEarned: 3890, rewardUnit: 'miles', date: '2026-03-18', status: 'completed' },
    { id: 'tx-5', merchant: 'Netflix', amount: 15.99, cardId: 'savor-one', rewardsEarned: 0.48, rewardUnit: 'cash back', date: '2026-03-17', status: 'completed' },
    { id: 'tx-6', merchant: 'Uber Eats', amount: 28.40, cardId: 'savor-one', rewardsEarned: 0.85, rewardUnit: 'cash back', date: '2026-03-16', status: 'completed' },
    { id: 'tx-7', merchant: 'Whole Foods', amount: 156.23, cardId: 'savor-one', rewardsEarned: 4.69, rewardUnit: 'cash back', date: '2026-03-15', status: 'completed' },
    { id: 'tx-8', merchant: 'Hilton Hotels', amount: 245.00, cardId: 'venture', rewardsEarned: 1225, rewardUnit: 'miles', date: '2026-03-14', status: 'completed' },
  ];

  const mockSettings = { autoDetect: true, showFloatingButton: true, defaultCardId: 'venture-x', notifications: true };

  await chrome.storage.local.set({
    cards: mockCards,
    offers: mockOffers,
    transactions: mockTransactions,
    settings: mockSettings,
  });

  console.log('[One Tap] Extension installed, mock data initialized');
});

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  const { cards, offers, transactions, settings } = await chrome.storage.local.get(['cards', 'offers', 'transactions', 'settings']);

  switch (message.type) {
    case 'CHECKOUT_DETECTED': {
      const { merchant, amount } = message.payload;
      const bestCard = selectBestCard(merchant, amount, cards, offers);
      const matchingOffers = offers.filter(o =>
        o.merchant.toLowerCase() === merchant.toLowerCase() ||
        merchant.toLowerCase().includes(o.merchant.toLowerCase())
      );
      return { bestCard, offers: matchingOffers, allCards: cards };
    }

    case 'GET_BEST_CARD': {
      const { merchant, amount } = message.payload;
      return { bestCard: selectBestCard(merchant, amount, cards, offers) };
    }

    case 'GET_OFFERS':
      return { offers };

    case 'PROCESS_PAYMENT': {
      const { cardId, amount, merchant, splitPayment } = message.payload;
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const card = cards.find(c => c.id === cardId);
      const rewardRate = card ? card.rewardRate : 1;
      const rewardUnit = card ? card.rewardUnit : 'points';
      const newTx = {
        id: `tx-${Date.now()}`,
        merchant,
        amount,
        cardId,
        rewardsEarned: rewardUnit.includes('miles') ? Math.round(amount * rewardRate) : parseFloat((amount * rewardRate / 100).toFixed(2)),
        rewardUnit: rewardUnit.replace(' %', ''),
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
      };
      transactions.unshift(newTx);
      await chrome.storage.local.set({ transactions });
      return { success: true, transaction: newTx, confirmationNumber: `CO-${Date.now().toString(36).toUpperCase()}` };
    }

    case 'GET_ALL_CARDS':
      return { cards };

    case 'GET_TRANSACTIONS':
      return { transactions };

    case 'GET_SETTINGS':
      return { settings };

    case 'UPDATE_SETTINGS': {
      const newSettings = { ...settings, ...message.payload };
      await chrome.storage.local.set({ settings: newSettings });
      return { settings: newSettings };
    }

    default:
      return { error: 'Unknown message type' };
  }
}
