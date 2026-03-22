// Checkout page detection — runs on every page
(function() {
  'use strict';

  let detected = false;

  function isCheckoutPage() {
    const url = window.location.href;
    if (CHECKOUT_URL_PATTERNS.some(p => p.test(url))) return true;
    for (const sel of CHECKOUT_DOM_SELECTORS) {
      if (document.querySelector(sel)) return true;
    }
    const title = document.title.toLowerCase();
    return ['checkout', 'payment', 'pay now', 'place order', 'billing'].some(k => title.includes(k));
  }

  // Retry extracting the total every 600ms for up to 10 seconds.
  // Resolves as soon as a value >= $1 is found.
  function waitForTotal(timeoutMs = 10000) {
    return new Promise(resolve => {
      const interval = 600;
      let elapsed = 0;
      function attempt() {
        const price = OneTapUtils.extractCheckoutTotal();
        if (price && price >= 1) {
          resolve(price);
          return;
        }
        elapsed += interval;
        if (elapsed >= timeoutMs) {
          resolve(price || 0); // give up, pass whatever we have (even 0)
          return;
        }
        setTimeout(attempt, interval);
      }
      attempt();
    });
  }

  async function detectCheckout() {
    if (detected) return;
    if (!isCheckoutPage()) return;

    detected = true;
    const merchant = OneTapUtils.getMerchantName();

    // Notify background immediately so card scoring can start in parallel
    chrome.runtime.sendMessage({
      type: MSG.CHECKOUT_DETECTED,
      payload: { merchant, amount: 0, url: window.location.href, pageTitle: document.title },
    }, async (response) => {
      if (!response || !response.bestCard) return;

      // Wait for the actual total to appear in the DOM (handles async SPA renders)
      const total = await waitForTotal();

      OneTapInjector.show(response, merchant, total);
    });
  }

  // Run detection after a short delay to let SPAs render
  setTimeout(detectCheckout, 1000);

  // Also watch DOM changes for SPAs that load checkout content dynamically
  const observer = new MutationObserver(() => {
    if (!detected) detectCheckout();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 15000);
})();
