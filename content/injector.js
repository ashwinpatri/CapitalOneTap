// One Tap Injector — creates shadow DOM with floating button and checkout overlay
const OneTapInjector = (() => {
  let shadowRoot = null;
  let overlayData = null;

  function createHost() {
    const host = document.createElement('div');
    host.id = 'one-tap-host';
    host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; top: 0; left: 0; width: 0; height: 0;';
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'closed' });

    // Load styles
    const brandLink = document.createElement('link');
    brandLink.rel = 'stylesheet';
    brandLink.href = chrome.runtime.getURL('styles/brand.css');
    shadowRoot.appendChild(brandLink);

    const overlayLink = document.createElement('link');
    overlayLink.rel = 'stylesheet';
    overlayLink.href = chrome.runtime.getURL('content/overlay.css');
    shadowRoot.appendChild(overlayLink);
  }

  function show(response, merchant, amount) {
    overlayData = { ...response, merchant, amount: amount || 42.99 };
    if (!shadowRoot) createHost();
    injectButton();
  }

  function injectButton() {
    const btn = document.createElement('button');
    btn.className = 'onetap-fab';
    btn.innerHTML = `
      <div class="onetap-fab-inner">
        <svg class="onetap-fab-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4H4C2.89 4 2 4.89 2 6V18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="white"/>
        </svg>
        <span class="onetap-fab-text">One Tap Pay</span>
      </div>
    `;
    btn.addEventListener('click', () => showOverlay());
    shadowRoot.appendChild(btn);

    // Entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        btn.classList.add('onetap-fab-visible');
      });
    });
  }

  function showOverlay() {
    // Remove existing overlay if any
    const existing = shadowRoot.querySelector('.onetap-overlay-backdrop');
    if (existing) existing.remove();

    const { bestCard, offers, allCards, merchant, amount } = overlayData;
    const applicableOffers = offers || [];

    const backdrop = document.createElement('div');
    backdrop.className = 'onetap-overlay-backdrop';
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeOverlay(backdrop);
    });

    const drawer = document.createElement('div');
    drawer.className = 'onetap-drawer';
    drawer.innerHTML = buildOverlayHTML(bestCard, allCards, applicableOffers, merchant, amount);
    backdrop.appendChild(drawer);
    shadowRoot.appendChild(backdrop);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backdrop.classList.add('onetap-overlay-visible');
        drawer.classList.add('onetap-drawer-visible');
      });
    });

    // Bind events
    bindOverlayEvents(drawer, allCards, applicableOffers, merchant, amount);
  }

  function buildOverlayHTML(bestCard, allCards, offers, merchant, amount) {
    const savings = offers.reduce((sum, o) => o.activated ? sum + Math.min(amount * o.discount, o.maxSavings) : sum, 0);
    const finalAmount = amount - savings;
    const unitRaw = bestCard._unit || 'points';
    let rewardsEarned, rewardLabel;
    if (unitRaw === 'miles') {
      rewardsEarned = Math.round(finalAmount * bestCard._score);
      rewardLabel = 'miles';
    } else if (unitRaw === 'percent_cashback') {
      rewardsEarned = `$${(finalAmount * bestCard._score / 100).toFixed(2)}`;
      rewardLabel = 'cash back';
    } else {
      rewardsEarned = Math.round(finalAmount * bestCard._score);
      rewardLabel = 'points';
    }

    return `
      <div class="onetap-header">
        <div class="onetap-header-left">
          <div class="onetap-logo">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#004977"/>
              <path d="M8 16C8 16 12 10 16 10C20 10 24 16 24 16C24 16 20 22 16 22C12 22 8 16 8 16Z" stroke="white" stroke-width="2" fill="none"/>
              <circle cx="16" cy="16" r="3" fill="white"/>
            </svg>
          </div>
          <div>
            <div class="onetap-title">One Tap Pay</div>
            <div class="onetap-subtitle">${merchant}</div>
          </div>
        </div>
        <button class="onetap-close" aria-label="Close">&times;</button>
      </div>

      <div class="onetap-amount-bar">
        <span class="onetap-amount-label">Total</span>
        <span class="onetap-amount-value" data-original="${amount}">$${amount.toFixed(2)}</span>
      </div>

      <div class="onetap-section">
        <div class="onetap-section-title">Recommended Card</div>
        <div class="onetap-card-recommended" style="background: ${bestCard.visual?.gradient || '#004977'}; color: ${bestCard.visual?.textColor || '#FFFFFF'}">
          <div class="onetap-card-badge">Best for this purchase</div>
          <div class="onetap-card-name">${bestCard.productName}</div>
          <div class="onetap-card-number">•••• ${bestCard.lastFour}</div>
          <div class="onetap-card-reason">${bestCard._reason}</div>
        </div>
      </div>

      <div class="onetap-section">
        <div class="onetap-section-title">Other Cards</div>
        <div class="onetap-card-list">
          ${allCards.filter(c => c._id !== bestCard._id).map(card => `
            <button class="onetap-card-chip" data-card-id="${card._id}" style="background: ${card.visual?.gradient || '#333'}; color: ${card.visual?.textColor || '#FFF'}">
              <span class="onetap-chip-name">${card.productName}</span>
              <span class="onetap-chip-last4">•••• ${card.lastFour}</span>
            </button>
          `).join('')}
        </div>
      </div>

      ${offers.length > 0 ? `
      <div class="onetap-section">
        <div class="onetap-section-title">Available Offers</div>
        <div class="onetap-offers-list">
          ${offers.map(offer => `
            <label class="onetap-offer" data-offer-id="${offer._id}">
              <div class="onetap-offer-info">
                <span class="onetap-offer-icon">${offer.merchantIcon}</span>
                <div>
                  <div class="onetap-offer-desc">${offer.description}</div>
                  <div class="onetap-offer-savings">Save up to $${offer.maxSavings.toFixed(2)}</div>
                </div>
              </div>
              <div class="onetap-toggle ${offer.activated ? 'active' : ''}">
                <div class="onetap-toggle-track">
                  <div class="onetap-toggle-thumb"></div>
                </div>
              </div>
            </label>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <div class="onetap-section">
        <label class="onetap-split-toggle">
          <span>Split this payment</span>
          <div class="onetap-toggle" id="split-toggle">
            <div class="onetap-toggle-track">
              <div class="onetap-toggle-thumb"></div>
            </div>
          </div>
        </label>
        <div class="onetap-split-panel" style="display: none;">
          <div class="onetap-split-row">
            <div class="onetap-split-card" style="background: ${bestCard.visual?.gradient || '#004977'}; color: ${bestCard.visual?.textColor || '#FFFFFF'}">
              ${bestCard.productName} •••• ${bestCard.lastFour}
            </div>
            <input type="range" class="onetap-split-slider" min="1" max="${Math.floor(amount) - 1}" value="${Math.floor(amount / 2)}" data-card="primary">
            <span class="onetap-split-amount" id="split-amount-1">$${(amount / 2).toFixed(2)}</span>
          </div>
          <div class="onetap-split-row">
            <select class="onetap-split-select">
              ${allCards.filter(c => c._id !== bestCard._id).map(c => `<option value="${c._id}">${c.productName} •••• ${c.lastFour}</option>`).join('')}
            </select>
            <span class="onetap-split-amount" id="split-amount-2">$${(amount / 2).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="onetap-rewards-bar">
        <svg class="onetap-rewards-icon" viewBox="0 0 20 20" fill="none">
          <path d="M10 1L12.5 7H19L13.75 11L15.5 17.5L10 13.5L4.5 17.5L6.25 11L1 7H7.5L10 1Z" fill="#FFD700"/>
        </svg>
        <span>You'll earn <strong>${rewardsEarned} ${rewardLabel}</strong> on this purchase</span>
      </div>

      <button class="onetap-pay-btn" data-card-id="${bestCard._id}" data-amount="${finalAmount}">
        <div class="onetap-pay-btn-content">
          <svg class="onetap-lock-icon" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="7" width="10" height="7" rx="1.5" fill="white"/>
            <path d="M5 7V5C5 3.34 6.34 2 8 2C9.66 2 11 3.34 11 5V7" stroke="white" stroke-width="1.5" fill="none"/>
          </svg>
          <span>Pay $${finalAmount.toFixed(2)}</span>
        </div>
        <div class="onetap-pay-btn-loading" style="display:none">
          <div class="onetap-spinner"></div>
          <span>Processing...</span>
        </div>
        <div class="onetap-pay-btn-success" style="display:none">
          <svg viewBox="0 0 24 24" fill="none" class="onetap-checkmark">
            <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Payment Complete!</span>
        </div>
      </button>
    `;
  }

  function bindOverlayEvents(drawer, allCards, offers, merchant, amount) {
    const closeBtn = drawer.querySelector('.onetap-close');
    const backdrop = drawer.parentElement;
    closeBtn.addEventListener('click', () => closeOverlay(backdrop));

    // Card chip selection
    drawer.querySelectorAll('.onetap-card-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const cardId = chip.dataset.cardId;
        const card = allCards.find(c => c._id === cardId);
        if (card) {
          const topTier = card.rewardTiers?.[0];
          const rate = topTier?.rate || 0;
          const unit = topTier?.unit || 'points';
          overlayData.bestCard = { ...card, _score: rate, _unit: unit, _category: 'selected', _reason: `${rate}x on this purchase` };
          closeOverlay(backdrop);
          showOverlay();
        }
      });
    });

    // Offer toggles
    drawer.querySelectorAll('.onetap-offer').forEach(offerEl => {
      const toggle = offerEl.querySelector('.onetap-toggle');
      offerEl.addEventListener('click', (e) => {
        e.preventDefault();
        toggle.classList.toggle('active');
        updateTotal(drawer, offers, amount);
      });
    });

    // Split toggle
    const splitToggle = drawer.querySelector('#split-toggle');
    const splitPanel = drawer.querySelector('.onetap-split-panel');
    splitToggle.parentElement.parentElement.addEventListener('click', () => {
      splitToggle.classList.toggle('active');
      splitPanel.style.display = splitToggle.classList.contains('active') ? 'block' : 'none';
    });

    // Split slider
    const slider = drawer.querySelector('.onetap-split-slider');
    if (slider) {
      slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        drawer.querySelector('#split-amount-1').textContent = `$${val.toFixed(2)}`;
        drawer.querySelector('#split-amount-2').textContent = `$${(amount - val).toFixed(2)}`;
      });
    }

    // Pay button
    const payBtn = drawer.querySelector('.onetap-pay-btn');
    payBtn.addEventListener('click', () => processPayment(drawer, merchant));
  }

  function updateTotal(drawer, offers, originalAmount) {
    let savings = 0;
    drawer.querySelectorAll('.onetap-offer').forEach((offerEl, i) => {
      const toggle = offerEl.querySelector('.onetap-toggle');
      if (toggle.classList.contains('active') && offers[i]) {
        savings += Math.min(originalAmount * offers[i].discount, offers[i].maxSavings);
      }
    });
    const finalAmount = originalAmount - savings;
    const amountEl = drawer.querySelector('.onetap-amount-value');
    if (savings > 0) {
      amountEl.innerHTML = `<span style="text-decoration: line-through; opacity: 0.5;">$${originalAmount.toFixed(2)}</span> $${finalAmount.toFixed(2)}`;
    } else {
      amountEl.textContent = `$${originalAmount.toFixed(2)}`;
    }
    const payBtn = drawer.querySelector('.onetap-pay-btn');
    payBtn.dataset.amount = finalAmount;
    payBtn.querySelector('.onetap-pay-btn-content span').textContent = `Pay $${finalAmount.toFixed(2)}`;
  }

  function processPayment(drawer, merchant) {
    const payBtn = drawer.querySelector('.onetap-pay-btn');
    const content = payBtn.querySelector('.onetap-pay-btn-content');
    const loading = payBtn.querySelector('.onetap-pay-btn-loading');
    const success = payBtn.querySelector('.onetap-pay-btn-success');

    payBtn.disabled = true;
    content.style.display = 'none';
    loading.style.display = 'flex';

    const finalAmount = parseFloat(payBtn.dataset.amount);
    const cardId = payBtn.dataset.cardId;

    chrome.runtime.sendMessage({
      type: MSG.PROCESS_PAYMENT,
      payload: { cardId, amount: finalAmount, merchant }
    }, (response) => {
      loading.style.display = 'none';
      success.style.display = 'flex';
      payBtn.classList.add('onetap-pay-success');

      // Show confirmation after a brief moment
      setTimeout(() => {
        const drawer = payBtn.closest('.onetap-drawer');
        if (drawer) {
          const rewardsBar = drawer.querySelector('.onetap-rewards-bar');
          if (rewardsBar && response && response.transaction) {
            rewardsBar.innerHTML = `
              <svg class="onetap-rewards-icon" viewBox="0 0 20 20" fill="none">
                <path d="M10 1L12.5 7H19L13.75 11L15.5 17.5L10 13.5L4.5 17.5L6.25 11L1 7H7.5L10 1Z" fill="#FFD700"/>
              </svg>
              <span>Earned <strong>${response.transaction.rewardsEarned} ${response.transaction.rewardUnit}</strong> · Confirmation: ${response.confirmationNumber}</span>
            `;
          }
        }
      }, 500);
    });
  }

  function closeOverlay(backdrop) {
    const drawer = backdrop.querySelector('.onetap-drawer');
    drawer.classList.remove('onetap-drawer-visible');
    backdrop.classList.remove('onetap-overlay-visible');
    setTimeout(() => backdrop.remove(), 300);
  }

  return { show };
})();
