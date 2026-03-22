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
    'input[id="creditCardNumber"]',
    'input[data-shortname="cc"]',
    'input[onautocomplete="cc-number"]',
    'input[data-cy*="card-number" i]', 'input[placeholder*="card number" i]',
    'input[aria-label*="card number" i]',
    'input[placeholder*="Card Number" i]', 'input[data-testid*="card" i]',
    'input[type="tel"][aria-label*="card" i]', 'input[inputmode="numeric"][placeholder*="card" i]',
    'form#creditCardForm input[type="tel"]',
  ],
  expiry: [
    'input[autocomplete="cc-exp"]',
    'input[name*="expir" i]', 'input[name*="exp-date" i]', 'input[name*="expDate" i]',
    'input[id*="expir" i]', 'input[placeholder*="MM" i]', 'input[placeholder*="MM/YY" i]',
    'input[aria-label*="expir" i]', 'input[aria-label*="expiration" i]',
    'input[placeholder*="Exp" i]', 'input[data-testid*="expir" i]',
  ],
  expiryMonth: [
    'input[autocomplete="cc-exp-month"]', 'select[autocomplete="cc-exp-month"]',
    'input[name*="exp-month" i]', 'input[name*="expMonth" i]', 'select[name*="month" i]',
    'input[id*="exp-month" i]', 'select[id*="exp-month" i]',
    'input[id="expirationMonth"]', 'input[name="expirationMonth"]',
  ],
  expiryYear: [
    'input[autocomplete="cc-exp-year"]', 'select[autocomplete="cc-exp-year"]',
    'input[name*="exp-year" i]', 'input[name*="expYear" i]', 'select[name*="year" i]',
    'input[id*="exp-year" i]', 'select[id*="exp-year" i]',
    'input[id="expirationYear"]', 'input[name="expirationYear"]',
  ],
  cvv: [
    'input[autocomplete="cc-csc"]',
    'input[name*="cvv" i]', 'input[name*="cvc" i]', 'input[name*="security" i]', 'input[name*="securityCode" i]',
    'input[id*="cvv" i]', 'input[id*="cvc" i]', 'input[id*="security-code" i]',
    'input[placeholder*="CVV" i]', 'input[placeholder*="CVC" i]', 'input[placeholder*="Security" i]',
    'input[aria-label*="security code" i]', 'input[aria-label*="CVV" i]',
    'input[aria-label*="cvv" i]', 'input[data-testid*="cvv" i]',
    'input[placeholder="CVV"]',
  ],
  name: [
    'input[autocomplete="cc-name"]',
    'input[name*="cardHolder" i]', 'input[name*="card-name" i]', 'input[name*="ccname" i]',
    'input[name*="name-on-card" i]', 'input[name*="nameOnCard" i]',
    'input[id*="cardHolder" i]', 'input[id*="card-name" i]',
    'input[placeholder*="name on card" i]', 'input[placeholder*="cardholder" i]',
    'input[aria-label*="name on card" i]',
  ],
  firstName: [
    'input[autocomplete="given-name"]', 'input[autocomplete="billing given-name"]',
    'input[name*="firstName" i]', 'input[name*="first-name" i]', 'input[name*="first_name" i]',
    'input[name*="fname" i]', 'input[id*="firstName" i]', 'input[id*="first-name" i]',
    'input[placeholder*="first name" i]', 'input[aria-label*="first name" i]',
  ],
  lastName: [
    'input[autocomplete="family-name"]', 'input[autocomplete="billing family-name"]',
    'input[name*="lastName" i]', 'input[name*="last-name" i]', 'input[name*="last_name" i]',
    'input[name*="lname" i]', 'input[id*="lastName" i]', 'input[id*="last-name" i]',
    'input[placeholder*="last name" i]', 'input[aria-label*="last name" i]',
  ],
  address: [
    'input[autocomplete="street-address"]', 'input[autocomplete="billing street-address"]',
    'input[autocomplete="address-line1"]', 'input[autocomplete="billing address-line1"]',
    'input[name*="address" i]', 'input[name*="street" i]', 'input[name*="addressLine1" i]',
    'input[id*="address" i]', 'input[id*="street" i]',
    'input[placeholder*="address" i]', 'input[placeholder*="street" i]',
    'input[aria-label*="address" i]', 'input[aria-label*="street" i]',
  ],
  city: [
    'input[autocomplete="address-level2"]', 'input[autocomplete="billing address-level2"]',
    'input[name*="city" i]', 'input[id*="city" i]',
    'input[placeholder*="city" i]', 'input[aria-label*="city" i]',
  ],
  state: [
    'input[autocomplete="address-level1"]', 'select[autocomplete="address-level1"]',
    'input[autocomplete="billing address-level1"]', 'select[autocomplete="billing address-level1"]',
    'input[name*="state" i]', 'select[name*="state" i]', 'input[name*="region" i]', 'select[name*="region" i]',
    'input[id*="state" i]', 'select[id*="state" i]',
    'input[placeholder*="state" i]', 'input[aria-label*="state" i]',
  ],
  zip: [
    'input[autocomplete="postal-code"]', 'input[autocomplete="billing postal-code"]',
    'input[name*="zip" i]', 'input[name*="postal" i]', 'input[name*="postcode" i]',
    'input[id*="zip" i]', 'input[id*="postal" i]',
    'input[placeholder*="zip" i]', 'input[placeholder*="postal" i]',
    'input[aria-label*="zip" i]', 'input[aria-label*="postal" i]',
  ],
};

function autofillCard(cardProductName, cardObj) {
  // Use real card data from MongoDB if available, otherwise fall back to demo data
  const data = cardObj && cardObj.fullNumber
    ? { number: cardObj.fullNumber, exp: (cardObj.expMonth || '12') + '/' + (cardObj.expYear || '28'), cvv: cardObj.cvv || '123', name: cardObj.cardholderName || 'CARDHOLDER' }
    : DEMO_CARD_DATA[cardProductName] || DEMO_CARD_FALLBACK;

  function findField(selectors) {
    // Search main document first
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // Search inside same-origin iframes
    try {
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) continue;
          for (const sel of selectors) {
            const el = iframeDoc.querySelector(sel);
            if (el) return el;
          }
        } catch (e) { /* cross-origin iframe, skip */ }
      }
    } catch (e) {}
    return null;
  }

  function setVal(el, value) {
    if (!el) return false;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value'
    )?.set;
    if (nativeSetter) nativeSetter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    // Also fire keyboard events for React/frameworks
    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    return true;
  }

  function fillAllFields() {
    let filled = 0;
    const steps = [];

    // Step 1: Card number
    steps.push(() => {
      if (setVal(findField(AUTOFILL_SELECTORS.cardNumber), data.number)) filled++;
    });

    // Step 2: Expiry
    steps.push(() => {
      const expiryField = findField(AUTOFILL_SELECTORS.expiry);
      if (expiryField) {
        if (setVal(expiryField, data.exp)) filled++;
      } else {
        const [month, year] = data.exp.split('/');
        setVal(findField(AUTOFILL_SELECTORS.expiryMonth), month);
        const yearField = findField(AUTOFILL_SELECTORS.expiryYear);
        if (yearField) {
          const yearVal = yearField.tagName === 'SELECT' ? '20' + year : year;
          if (setVal(yearField, yearVal)) filled++;
        }
      }
    });

    // Step 3: CVV
    steps.push(() => {
      if (setVal(findField(AUTOFILL_SELECTORS.cvv), data.cvv)) filled++;
    });

    // Step 4: Name on card
    steps.push(() => {
      setVal(findField(AUTOFILL_SELECTORS.name), data.name);
    });

    // Step 5: Billing name
    if (cardObj && (cardObj.billingFirstName || cardObj.billingLastName)) {
      steps.push(() => {
        if (cardObj.billingFirstName) setVal(findField(AUTOFILL_SELECTORS.firstName), cardObj.billingFirstName);
        if (cardObj.billingLastName) setVal(findField(AUTOFILL_SELECTORS.lastName), cardObj.billingLastName);
      });
    }

    // Step 6: Billing address
    if (cardObj && (cardObj.billingAddress || cardObj.billingCity)) {
      steps.push(() => {
        if (cardObj.billingAddress) setVal(findField(AUTOFILL_SELECTORS.address), cardObj.billingAddress);
        if (cardObj.billingCity) setVal(findField(AUTOFILL_SELECTORS.city), cardObj.billingCity);
        if (cardObj.billingState) setVal(findField(AUTOFILL_SELECTORS.state), cardObj.billingState);
        if (cardObj.billingZip) setVal(findField(AUTOFILL_SELECTORS.zip), cardObj.billingZip);
      });
    }

    // Run steps sequentially with delays so fields appear one by one
    steps.forEach((step, i) => {
      setTimeout(step, i * 300);
    });

    // Return filled count after all steps complete
    setTimeout(() => { /* filled is updated by then */ }, steps.length * 300);
    return filled;
  }

  function checkFilled() {
    const cardField = findField(AUTOFILL_SELECTORS.cardNumber);
    if (!cardField) return false;
    const val = cardField.value.replace(/\s/g, '');
    return val.length >= 13;
  }

  // Keep trying every second until it works or 15 attempts
  fillAllFields();
  let attempts = 0;
  const fillTimer = setInterval(() => {
    attempts++;
    fillAllFields();
    if (checkFilled() || attempts >= 15) {
      clearInterval(fillTimer);
    }
  }, 1000);

  return checkFilled;
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
