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

      // Try to extract the total price
      let estimatedTotal = null;
      const allText = document.body.innerText;

      // 1. Look for "Total" followed by a dollar amount (most reliable)
      const totalMatch = allText.match(/\btotal\b[:\s$]*\$?\s?([\d,]+\.\d{2})/i);
      if (totalMatch) {
        estimatedTotal = parseFloat(totalMatch[1].replace(/,/g, ''));
      }

      // 2. Try specific selectors
      if (!estimatedTotal) {
        for (const selector of PRICE_SELECTORS) {
          const el = document.querySelector(selector);
          if (el) {
            estimatedTotal = OneTapUtils.extractPrice(el.textContent);
            if (estimatedTotal) break;
          }
        }
      }

      // 3. Last resort: find all dollar amounts on the page and pick the highest
      if (!estimatedTotal) {
        const allPrices = [...allText.matchAll(/\$\s?([\d,]+\.\d{2})/g)]
          .map(m => parseFloat(m[1].replace(/,/g, '')))
          .filter(p => p > 0 && p < 100000);
        if (allPrices.length > 0) {
          estimatedTotal = Math.max(...allPrices);
        }
      }

      const merchant = OneTapUtils.getMerchantName();

      // Notify background
      chrome.runtime.sendMessage({
        type: MSG.CHECKOUT_DETECTED,
        payload: {
          merchant,
          amount: estimatedTotal || 0,
          url: window.location.href,
          pageTitle: document.title,
        }
      }, (response) => {
        if (response && response.bestCard) {
          OneTapInjector.show(response, merchant, estimatedTotal);
        }
      });
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
