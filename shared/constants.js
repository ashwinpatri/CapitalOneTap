// Brand colors and constants
const CO_BRAND = {
  BLUE: '#004977',
  BLUE_DARK: '#003557',
  BLUE_LIGHT: '#0066A4',
  RED: '#D03027',
  RED_DARK: '#B0201A',
  WHITE: '#FFFFFF',
  LIGHT_GRAY: '#F5F5F5',
  MID_GRAY: '#E0E0E0',
  DARK_GRAY: '#6B6B6B',
  DARK_TEXT: '#1A1A1A',
  SUCCESS: '#0A8A3E',
};

const MSG = {
  CHECKOUT_DETECTED: 'CHECKOUT_DETECTED',
  GET_BEST_CARD: 'GET_BEST_CARD',
  GET_OFFERS: 'GET_OFFERS',
  PROCESS_PAYMENT: 'PROCESS_PAYMENT',
  GET_ALL_CARDS: 'GET_ALL_CARDS',
  GET_TRANSACTIONS: 'GET_TRANSACTIONS',
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
};

const CHECKOUT_URL_PATTERNS = [
  /\/checkout/i,
  /\/cart/i,
  /\/payment/i,
  /\/billing/i,
  /\/order/i,
  /\/pay\b/i,
  /\/purchase/i,
  /\/basket/i,
];

const CHECKOUT_DOM_SELECTORS = [
  'input[autocomplete="cc-number"]',
  'input[name*="card-number"]',
  'input[name*="cardnumber"]',
  'input[name*="cc-num"]',
  'input[data-cy*="card"]',
  '[data-testid*="payment"]',
  'form[action*="checkout"]',
  'form[action*="payment"]',
];

// Map card product names to local image files in icons/cards/
const CARD_IMAGE_FILES = {
  'Platinum': 'platinum.png',
  'Venture X Rewards': 'venture-x.png',
  'Venture Rewards': 'venture.png',
  'VentureOne Rewards': 'ventureone.png',
  'VentureOne Rewards for Good Credit': 'ventureone.png',
  'Quicksilver Rewards': 'quicksilver.png',
  'Quicksilver Rewards for Good Credit': 'quicksilver.png',
  'Savor Rewards': 'savor.png',
  'Savor Rewards for Good Credit': 'savor.png',
  'SavorOne Rewards': 'savorone.png',
  'QuicksilverOne Rewards': 'quicksilverone.png',
  'Savor Rewards for Students': 'savor.png',
  'Quicksilver Rewards for Students': 'quicksilver.png',
  'Quicksilver Secured Rewards': 'quicksilver.png',
  'Platinum Secured': 'platinum.png',
  'T-Mobile Visa': 'tmobile.png',
  "Kohl's Rewards Visa": 'kohls.png',
  'REI Co-op Mastercard': 'rei.png',
  'Pottery Barn Key Rewards Visa': 'pottery-barn.png',
  'Williams Sonoma Key Rewards Visa': 'williams-sonoma.png',
  'West Elm Key Rewards Visa': 'west-elm.png',
  'Key Rewards Visa': 'key-rewards.png',
  "Cabela's CLUB Card": 'cabelas.png',
  'Bass Pro Shops CLUB Card': 'bass-pro.png',
  "Bass Pro Shops & Cabela's CLUB Business": 'bass-pro-business.jpg',
  "BJ's One Mastercard": 'bjs-one.png',
  "BJ's One+ Mastercard": 'bjs-one-plus.png',
  'Spark 2% Cash Plus': 'spark-cash-plus2.png',
  'Spark 2% Cash': 'spark-cash-plus.png',
  'Spark 1.5% Cash Select': 'spark-cash-select.png',
  'Spark 1% Classic': 'spark-classic.png',
  'Venture X Business': 'venture-x-business.png',
  'Spark 2X Miles': 'spark-miles.png',
  'Spark 1.5X Miles Select': 'spark-miles.png',
};

function getCardImageUrl(cardName) {
  const file = CARD_IMAGE_FILES[cardName];
  if (!file) return null;
  return chrome.runtime.getURL('icons/cards/' + file);
}

const PRICE_SELECTORS = [
  '[class*="total"] [class*="price"]',
  '[class*="order-total"]',
  '[class*="grand-total"]',
  '[data-testid*="total"]',
  '.summary-total',
  '.cart-total',
  '#total-price',
  '.order-summary [class*="amount"]',
];
