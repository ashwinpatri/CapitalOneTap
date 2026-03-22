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
  // Only resolves early on a high-confidence (score 2) grand-total label match.
  // Falls back to the best lower-confidence result at timeout.
  function waitForTotal(timeoutMs = 10000) {
    return new Promise(resolve => {
      const interval = 600;
      let elapsed = 0;
      let bestSoFar = null; // { price, score } — tracks best candidate seen so far

      function attempt() {
        const result = OneTapUtils.extractCheckoutTotalWithScore();

        if (result && result.price >= 1) {
          // Update best if this result has a higher score (or same score, higher price)
          if (!bestSoFar || result.score > bestSoFar.score ||
              (result.score === bestSoFar.score && result.price > bestSoFar.price)) {
            bestSoFar = result;
          }

          // Only resolve immediately for a confirmed grand-total label (score 2)
          if (result.score >= 2) {
            resolve(result.price);
            return;
          }
        }

        elapsed += interval;
        if (elapsed >= timeoutMs) {
          // Time's up — use the best candidate found, even if low confidence
          resolve(bestSoFar ? bestSoFar.price : 0);
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
