// Checkout page detection — runs on every page
(function() {
  'use strict';

  let detected = false;

  function detectCheckout() {
    if (detected) return;

    // 1. URL pattern matching
    const url = window.location.href;
    const urlMatch = CHECKOUT_URL_PATTERNS.some(pattern => pattern.test(url));

    // 2. DOM signal matching
    let domMatch = false;
    for (const selector of CHECKOUT_DOM_SELECTORS) {
      if (document.querySelector(selector)) {
        domMatch = true;
        break;
      }
    }

    // 3. Title/meta signals
    const title = document.title.toLowerCase();
    const titleMatch = ['checkout', 'payment', 'pay now', 'place order', 'billing'].some(
      keyword => title.includes(keyword)
    );

    if (urlMatch || domMatch || titleMatch) {
      detected = true;

      const merchant = OneTapUtils.getMerchantName();

      function extractPrice() {
        const allText = document.body.innerText;

        // 1. Look for standalone "Total" (not subtotal/pretotal) followed by a dollar amount
        const lines = allText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          // Skip lines with "subtotal", "pretotal", "savings" etc
          if (/sub\s*total|pre\s*total|savings|shipping|tax|estimated/i.test(trimmed)) continue;
          const match = trimmed.match(/\btotal\b[:\s$]*\$?\s?([\d,]+\.\d{2})/i);
          if (match) return parseFloat(match[1].replace(/,/g, ''));
        }

        // 2. Try specific selectors
        for (const selector of PRICE_SELECTORS) {
          const el = document.querySelector(selector);
          if (el) {
            const price = OneTapUtils.extractPrice(el.textContent);
            if (price) return price;
          }
        }

        // 3. Last resort: find all dollar amounts on the page and pick the highest
        const allPrices = [...allText.matchAll(/\$\s?([\d,]+\.\d{2})/g)]
          .map(m => parseFloat(m[1].replace(/,/g, '')))
          .filter(p => p > 0 && p < 100000);
        if (allPrices.length > 0) return Math.max(...allPrices);

        return 0;
      }

      function sendDetection(amount) {
        chrome.runtime.sendMessage({
          type: MSG.CHECKOUT_DETECTED,
          payload: {
            merchant,
            amount: amount || 0,
            url: window.location.href,
            pageTitle: document.title,
          }
        }, (response) => {
          if (response && response.bestCard) {
            OneTapInjector.show(response, merchant, amount);
          }
        });
      }

      // Wait for price to stabilize (tax/shipping may load after initial render)
      let lastPrice = 0;
      let stableCount = 0;
      let checks = 0;
      const maxChecks = 10;
      const priceTimer = setInterval(() => {
        checks++;
        const currentPrice = extractPrice();
        if (currentPrice > 0 && currentPrice === lastPrice) {
          stableCount++;
        } else {
          stableCount = 0;
        }
        lastPrice = currentPrice;
        // Send once price is stable for 2 consecutive checks, or after max attempts
        if ((stableCount >= 2 && currentPrice > 0) || checks >= maxChecks) {
          clearInterval(priceTimer);
          sendDetection(currentPrice);
        }
      }, 800);
    }
  }

  // Run detection after a short delay to let SPAs render
  setTimeout(detectCheckout, 1000);

  // Also observe DOM changes for SPAs
  const observer = new MutationObserver(() => {
    if (!detected) detectCheckout();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Stop observing after 10 seconds to save resources
  setTimeout(() => observer.disconnect(), 10000);
})();
