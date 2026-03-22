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

// Demo card data for autofill (fake test numbers — won't charge anything)
const DEMO_CARD_DATA = {
  'Venture X Rewards':        { number: '4111111111111111', exp: '12/28', cvv: '123', name: 'DAVID BALIN' },
  'Venture Rewards':          { number: '4217651234567890', exp: '09/27', cvv: '456', name: 'DAVID BALIN' },
  'VentureOne Rewards':       { number: '4532015112830366', exp: '03/28', cvv: '789', name: 'DAVID BALIN' },
  'Quicksilver Rewards':      { number: '4916338506082832', exp: '06/27', cvv: '321', name: 'DAVID BALIN' },
  'Savor Rewards':            { number: '5425233430109903', exp: '11/28', cvv: '654', name: 'DAVID BALIN' },
  'SavorOne Rewards':         { number: '5425233430109903', exp: '08/27', cvv: '987', name: 'DAVID BALIN' },
  'Platinum':                 { number: '5425233430109903', exp: '01/29', cvv: '111', name: 'DAVID BALIN' },
};

// Default fallback for any card not in the map
const DEMO_CARD_FALLBACK = { number: '4111111111111111', exp: '12/28', cvv: '123', name: 'DAVID BALIN' };

// Selectors to find card form fields on checkout pages
const AUTOFILL_SELECTORS = {
  cardNumber: [
    'input[autocomplete="cc-number"]',
    'input[name*="cardnumber" i]', 'input[name*="card-number" i]', 'input[name*="card_number" i]',
    'input[name*="ccnumber" i]', 'input[name*="cc-number" i]', 'input[name*="cc_number" i]',
    'input[id*="cardnumber" i]', 'input[id*="card-number" i]', 'input[id*="creditcard" i]',
    'input[data-cy*="card-number" i]', 'input[placeholder*="card number" i]',
    'input[aria-label*="card number" i]',
  ],
  expiry: [
    'input[autocomplete="cc-exp"]',
    'input[name*="expir" i]', 'input[name*="exp-date" i]', 'input[name*="expDate" i]',
    'input[id*="expir" i]', 'input[placeholder*="MM" i]',
    'input[aria-label*="expir" i]',
  ],
  expiryMonth: [
    'input[autocomplete="cc-exp-month"]', 'select[autocomplete="cc-exp-month"]',
    'input[name*="exp-month" i]', 'input[name*="expMonth" i]', 'select[name*="month" i]',
    'input[id*="exp-month" i]', 'select[id*="exp-month" i]',
  ],
  expiryYear: [
    'input[autocomplete="cc-exp-year"]', 'select[autocomplete="cc-exp-year"]',
    'input[name*="exp-year" i]', 'input[name*="expYear" i]', 'select[name*="year" i]',
    'input[id*="exp-year" i]', 'select[id*="exp-year" i]',
  ],
  cvv: [
    'input[autocomplete="cc-csc"]',
    'input[name*="cvv" i]', 'input[name*="cvc" i]', 'input[name*="security" i]', 'input[name*="securityCode" i]',
    'input[id*="cvv" i]', 'input[id*="cvc" i]', 'input[id*="security-code" i]',
    'input[placeholder*="CVV" i]', 'input[placeholder*="CVC" i]', 'input[placeholder*="Security" i]',
    'input[aria-label*="security code" i]', 'input[aria-label*="CVV" i]',
  ],
  name: [
    'input[autocomplete="cc-name"]',
    'input[name*="cardHolder" i]', 'input[name*="card-name" i]', 'input[name*="ccname" i]',
    'input[name*="name-on-card" i]', 'input[name*="nameOnCard" i]',
    'input[id*="cardHolder" i]', 'input[id*="card-name" i]',
    'input[placeholder*="name on card" i]', 'input[placeholder*="cardholder" i]',
    'input[aria-label*="name on card" i]',
  ],
};

function autofillCard(cardProductName, cardObj) {
  // Use real card data from MongoDB if available, otherwise fall back to demo data
  const data = cardObj && cardObj.fullNumber
    ? { number: cardObj.fullNumber, exp: (cardObj.expMonth || '12') + '/' + (cardObj.expYear || '28'), cvv: cardObj.cvv || '123', name: cardObj.cardholderName || 'CARDHOLDER' }
    : DEMO_CARD_DATA[cardProductName] || DEMO_CARD_FALLBACK;

  function findField(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function setVal(el, value) {
    if (!el) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value'
    )?.set;
    if (nativeSetter) nativeSetter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // Card number
  setVal(findField(AUTOFILL_SELECTORS.cardNumber), data.number);

  // Expiry — try combined field first, then separate month/year
  const expiryField = findField(AUTOFILL_SELECTORS.expiry);
  if (expiryField) {
    setVal(expiryField, data.exp);
  } else {
    const [month, year] = data.exp.split('/');
    setVal(findField(AUTOFILL_SELECTORS.expiryMonth), month);
    const yearField = findField(AUTOFILL_SELECTORS.expiryYear);
    if (yearField) {
      // Some sites use 2-digit, some 4-digit year
      const yearVal = yearField.tagName === 'SELECT' ? '20' + year : year;
      setVal(yearField, yearVal);
    }
  }

  // CVV
  setVal(findField(AUTOFILL_SELECTORS.cvv), data.cvv);

  // Name on card
  setVal(findField(AUTOFILL_SELECTORS.name), data.name);

  return true;
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
