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

  // Helper to normalize MongoDB card fields for overlay rendering
  function cardName(card) { return card.productName || card.name || 'Card'; }
  function cardId(card) { return card._id || card.id; }
  function cardGradient(card) { return card.visual?.gradient || card.gradient || 'linear-gradient(135deg, #333 0%, #111 100%)'; }
  function cardTextColor(card) { return card.visual?.textColor || card.textColor || '#FFFFFF'; }
  function cardRewardUnit(card) {
    if (card.rewardTiers && card.rewardTiers.length > 0) {
      const unit = card.rewardTiers[0].unit;
      if (unit === 'percent_cashback' || unit === 'percent_back') return 'cash back';
      return unit;
    }
    return card.rewardUnit?.replace(' %', '') || 'points';
  }

  function buildOverlayHTML(bestCard, allCards, offers, merchant, amount) {
    const savings = offers.reduce((sum, o) => {
      const discount = o.discountValue || o.discount || 0;
      const max = o.maxSavings || 0;
      return o.activated ? sum + Math.min(amount * discount, max) : sum;
    }, 0);
    const finalAmount = amount - savings;
    const rewardUnit = cardRewardUnit(bestCard);
    const rewardsEarned = rewardUnit === 'miles'
      ? Math.round(finalAmount * bestCard._score)
      : `$${(finalAmount * bestCard._score / 100).toFixed(2)}`;

    // Build reward breakdown for best card
    const bestTier = (bestCard.rewardTiers || bestCard.rewardTiers || [])[0];
    const rewardRate = bestTier ? bestTier.rate : bestCard._score || 0;
    const rewardLabel = rewardUnit === 'miles' ? `${rewardRate}X miles` : `${rewardRate}% back`;
    const rewardValue = rewardUnit === 'miles'
      ? `${Math.round(finalAmount * rewardRate).toLocaleString()} miles`
      : `$${(finalAmount * rewardRate / 100).toFixed(2)}`;

    return `
      <div class="onetap-header">
        <div class="onetap-header-left">
          <div class="onetap-logo">
            <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#004977"/><path d="M8 16C8 16 12 10 16 10C20 10 24 16 24 16C24 16 20 22 16 22C12 22 8 16 8 16Z" stroke="white" stroke-width="2" fill="none"/><circle cx="16" cy="16" r="3" fill="white"/></svg>
          </div>
          <div>
            <div class="onetap-title">One Tap</div>
            <div class="onetap-subtitle">${merchant}</div>
          </div>
        </div>
        <div class="onetap-header-right">
          <button class="onetap-close" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <div class="onetap-body">
        <div class="onetap-heading">Select a card for this purchase</div>

        <!-- Best Card -->
        <div class="onetap-pick onetap-pick-selected" data-card-id="${cardId(bestCard)}">
          <div class="onetap-pick-badge">👍 Best card to use</div>
          <div class="onetap-pick-row">
            <div class="onetap-pick-img-wrap">
              ${getCardImageUrl(cardName(bestCard)) ? `<img class="onetap-pick-img" src="${getCardImageUrl(cardName(bestCard))}" alt="">` : `<div class="onetap-pick-img-fallback" style="background:${cardGradient(bestCard)}"></div>`}
            </div>
            <div class="onetap-pick-info">
              <div class="onetap-pick-name">${cardName(bestCard)} - ${bestCard.lastFour}</div>
            </div>
            <div class="onetap-pick-check">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#004977"/><path d="M6 10L9 13L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>

          <div class="onetap-rewards-section">
            <div class="onetap-rewards-header">
              <span class="onetap-rewards-label">Total rewards</span>
              <span class="onetap-rewards-value">$${(finalAmount * rewardRate / 100).toFixed(2)}</span>
            </div>
            <div class="onetap-rewards-detail">
              <div class="onetap-rewards-detail-row">
                <div>
                  <div class="onetap-rewards-detail-title">Card rewards</div>
                  <div class="onetap-rewards-detail-sub">${rewardLabel}</div>
                </div>
                <div class="onetap-rewards-detail-right">
                  <div class="onetap-rewards-detail-amount">${rewardValue}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Other Cards -->
        ${allCards.filter(c => cardId(c) !== cardId(bestCard)).map(card => {
          const img = getCardImageUrl(cardName(card));
          return `
          <div class="onetap-pick" data-card-id="${cardId(card)}">
            <div class="onetap-pick-row">
              <div class="onetap-pick-img-wrap">
                ${img ? `<img class="onetap-pick-img" src="${img}" alt="">` : `<div class="onetap-pick-img-fallback" style="background:${cardGradient(card)}"></div>`}
              </div>
              <div class="onetap-pick-info">
                <div class="onetap-pick-name">${cardName(card)} - ${card.lastFour}</div>
              </div>
              <div class="onetap-pick-check onetap-pick-unchecked">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#D0D0D0" stroke-width="2"/></svg>
              </div>
            </div>
          </div>
        `}).join('')}

        ${offers.length > 0 ? `
        <div class="onetap-offers-section">
          <div class="onetap-section-title">Available Offers</div>
          ${offers.map(offer => `
            <label class="onetap-offer" data-offer-id="${offer._id || offer.id}">
              <div class="onetap-offer-info">
                <span class="onetap-offer-icon">${offer.merchantIcon || '🏷'}</span>
                <div>
                  <div class="onetap-offer-desc">${offer.description}</div>
                  <div class="onetap-offer-savings">Save up to $${(offer.maxSavings || 0).toFixed(2)}</div>
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
        ` : ''}
      </div>

      <div class="onetap-footer">
        <button class="onetap-pay-btn" data-card-id="${cardId(bestCard)}" data-amount="${finalAmount}">
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

    // Card pick selection
    drawer.querySelectorAll('.onetap-pick:not(.onetap-pick-selected)').forEach(pick => {
      pick.addEventListener('click', () => {
        const selectedId = pick.dataset.cardId;
        const card = allCards.find(c => (c._id || c.id) === selectedId);
        if (card) {
          const topTier = (card.rewardTiers || [])[0];
          const rate = topTier ? topTier.rate : 1;
          overlayData.bestCard = { ...card, _score: rate, _category: 'selected', _reason: `${rate}x on this purchase` };
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
      });
    });

    // Pay button
    const payBtn = drawer.querySelector('.onetap-pay-btn');
    payBtn.addEventListener('click', () => processPayment(drawer, merchant, amount));
  }

  function updateTotal(drawer, offers, originalAmount) {
    let savings = 0;
    drawer.querySelectorAll('.onetap-offer').forEach((offerEl, i) => {
      const toggle = offerEl.querySelector('.onetap-toggle');
      if (toggle.classList.contains('active') && offers[i]) {
        const discount = offers[i].discountValue || offers[i].discount || 0;
        savings += Math.min(originalAmount * discount, offers[i].maxSavings || 0);
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

  function processPayment(drawer, merchant, amount) {
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
