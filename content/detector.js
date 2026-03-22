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
  // Resolves immediately on score-2 (grand total label). At timeout, resolves
  // with the best candidate found. Always returns { price, score }.
  function waitForTotal(timeoutMs = 10000) {
    return new Promise(resolve => {
      const interval = 600;
      let elapsed = 0;
      let bestSoFar = null; // { price, score }

      function attempt() {
        const result = OneTapUtils.extractCheckoutTotalWithScore();

        if (result && result.price >= 1) {
          if (!bestSoFar || result.score > bestSoFar.score ||
              (result.score === bestSoFar.score && result.price > bestSoFar.price)) {
            bestSoFar = result;
          }
          if (result.score >= 2) {
            resolve({ price: result.price, score: 2 });
            return;
          }
        }

        elapsed += interval;
        if (elapsed >= timeoutMs) {
          resolve(bestSoFar || { price: 0, score: -1 });
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

      // Show the FAB button immediately — don't block on price detection
      OneTapInjector.show(response, merchant, 0);

      // Poll for a confident price in the background and update before the user taps
      const { price, score } = await waitForTotal();

      if (price > 0) OneTapInjector.updateAmount(price);

      // If score < 2 (not a confirmed grand-total label), also ask Gemini.
      // A wrong low-confidence price is worse than the correct one from Gemini.
      if (score < 2) {
        const pageText = document.body.innerText;
        chrome.runtime.sendMessage(
          { type: MSG.EXTRACT_PRICE, payload: { pageText: pageText.slice(0, 6000) } },
          (res) => { if (res?.price > 0) OneTapInjector.updateAmount(res.price); }
        );
      }
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
