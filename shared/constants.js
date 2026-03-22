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
  GET_RECOMMENDATION: 'GET_RECOMMENDATION',
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
