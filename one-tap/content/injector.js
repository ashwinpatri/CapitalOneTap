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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        btn.classList.add('onetap-fab-visible');
      });
    });
  }

  function showOverlay() {
    const existing = shadowRoot.querySelector('.onetap-overlay-backdrop');
    if (existing) existing.remove();

    const { bestCard, offers, allCards, merchant, amount } = overlayData;
    const applicableOffers = offers || [];

    if (!overlayData.originalBestCardId) overlayData.originalBestCardId = bestCard._id;
    const originalBestCardId = overlayData.originalBestCardId;

    const backdrop = document.createElement('div');
    backdrop.className = 'onetap-overlay-backdrop';
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeOverlay(backdrop);
    });

    const drawer = document.createElement('div');
    drawer.className = 'onetap-drawer';
    drawer.innerHTML = buildOverlayHTML(bestCard, allCards, applicableOffers, merchant, amount, originalBestCardId);
    backdrop.appendChild(drawer);
    shadowRoot.appendChild(backdrop);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backdrop.classList.add('onetap-overlay-visible');
        drawer.classList.add('onetap-drawer-visible');
      });
    });

    bindOverlayEvents(drawer, allCards, applicableOffers, merchant, amount);
  }

  // Helpers for MongoDB card field normalization
  function cardName(card) { return card.productName || card.name || 'Card'; }
  function cardId(card) { return card._id || card.id; }
  function cardGradient(card) { return card.visual?.gradient || card.gradient || 'linear-gradient(135deg, #333 0%, #111 100%)'; }

  function buildOverlayHTML(bestCard, allCards, offers, merchant, amount, originalBestCardId) {
    originalBestCardId = originalBestCardId || cardId(bestCard);
    const savings = offers.reduce((sum, o) => o.activated ? sum + Math.min(amount * (o.discount || 0), o.maxSavings || 0) : sum, 0);
    const finalAmount = amount - savings;

    // ── Helpers ───────────────────────────────────────────────────────────────
    function toDollars(rate, unit, amt) {
      if (unit === 'percent_cashback' || unit === 'percent_back') return amt * rate / 100;
      if (unit === 'miles') return amt * rate * 0.0105;
      return amt * rate * 0.01;
    }

    function earnDisplay(rate, unit, amt) {
      if (unit === 'percent_cashback' || unit === 'percent_back') return { primary: `$${(amt * rate / 100).toFixed(2)}`, label: 'cash back' };
      if (unit === 'miles') return { primary: `${Math.round(amt * rate).toLocaleString()}`, label: 'miles' };
      return { primary: `${Math.round(amt * rate).toLocaleString()}`, label: 'points' };
    }

    function fmtRate(rate, unit) {
      if (unit === 'percent_cashback' || unit === 'percent_back') return `${rate}% cash back`;
      if (unit === 'miles') return `${rate}x miles`;
      return `${rate}x points`;
    }

    function fmtCats(cats) {
      const L = { dining: 'dining', groceries: 'groceries', flights: 'flights', hotels: 'hotels',
        'car-rental': 'car rentals', streaming: 'streaming', entertainment: 'entertainment',
        gas: 'gas', transit: 'transit', 'bass-pro': "Bass Pro/Cabela's", everything: 'everything else' };
      return cats.map(c => L[c] || c).join(', ');
    }

    function getUnit(card) {
      if (card._unit) return card._unit;
      const tier = (card.rewardTiers || [])[0];
      return tier ? tier.unit : 'points';
    }

    function getScore(card) {
      if (card._score != null) return card._score;
      const tier = (card.rewardTiers || [])[0];
      return tier ? tier.rate : 0;
    }

    const bestUnit = getUnit(bestCard);
    const bestScore = getScore(bestCard);
    const bestEarn = earnDisplay(bestScore, bestUnit, finalAmount);
    const bestDollars = toDollars(bestScore, bestUnit, finalAmount);
    const bestRateText = fmtRate(bestScore, bestUnit);
    const isManual = bestCard._isManualSelection;
    const bestImg = getCardImageUrl(cardName(bestCard));

    // ── Comparison Table ─────────────────────────────────────────────────────
    const topCards = allCards.slice(0, 4);
    const maxDollars = Math.max(...topCards.map(c => toDollars(getScore(c), getUnit(c), finalAmount)), 0.01);

    const sectionCompare = topCards.length > 1 ? `
      <div class="onetap-rewards-section" style="border-top: 1px solid var(--co-gray-200); padding: 0 14px 14px;">
        <div style="padding: 12px 0 8px; font-size: 12px; font-weight: 600; color: var(--co-gray-500); text-transform: uppercase; letter-spacing: 0.5px;">How your cards compare</div>
        <div class="onetap-cmp-table">
          ${topCards.map(c => {
            const earn = earnDisplay(getScore(c), getUnit(c), finalAmount);
            const dollars = toDollars(getScore(c), getUnit(c), finalAmount);
            const barPct = Math.round((dollars / maxDollars) * 100);
            const isAlgoBest = cardId(c) === originalBestCardId;
            const badge = isAlgoBest ? '<span class="onetap-cmp-best-badge">⭐ best</span>' : '';
            return `
              <div class="onetap-cmp-row${isAlgoBest ? ' onetap-cmp-row-best' : ''}">
                <div class="onetap-cmp-left">
                  <span class="onetap-cmp-name">${cardName(c)} ${badge}</span>
                  <span class="onetap-cmp-earn">Earn ${earn.primary} ${earn.label}</span>
                  <div class="onetap-cmp-bar-wrap">
                    <div class="onetap-cmp-bar${isAlgoBest ? ' onetap-cmp-bar-top' : ''}" style="width:${barPct}%"></div>
                  </div>
                </div>
                <span class="onetap-cmp-value${isAlgoBest ? '' : ' onetap-cmp-value-dim'}">≈$${dollars.toFixed(2)}</span>
              </div>`;
          }).join('')}
        </div>
      </div>` : '';

    // ── Deep Reasoning ───────────────────────────────────────────────────────
    const introRow = (() => {
      const o = bestCard.introOffer;
      if (!o || o.earned || !o.spendRequired) return '';
      const spent = o.amountSpent || 0;
      const rem = Math.max(0, o.spendRequired - spent);
      const pct = Math.min(100, Math.round((spent / o.spendRequired) * 100));
      const bonus = o.bonusUnit === 'cash' ? `$${o.bonusAmount}` : `${o.bonusAmount.toLocaleString()} ${o.bonusUnit}`;
      return `
        <div class="onetap-deep-row">
          <div class="onetap-deep-key">🎯 Intro offer</div>
          <div class="onetap-deep-val">
            $${rem.toFixed(0)} more to earn ${bonus}
            <div class="onetap-deep-sub">$${spent.toFixed(0)} of $${o.spendRequired} spent</div>
            <div class="onetap-progress-bar"><div class="onetap-progress-fill" style="width:${pct}%"></div></div>
          </div>
        </div>`;
    })();

    const tiersRows = (bestCard.rewardTiers || []).map(t =>
      `<div class="onetap-deep-tier">
        <strong>${fmtRate(t.rate, t.unit)}</strong> on ${fmtCats(t.categories)}${t.qualifier ? ` <em class="onetap-deep-qualifier">${t.qualifier}</em>` : ''}
      </div>`
    ).join('');

    const runnerUpDeepRow = bestCard._runnerUp ? (() => {
      const ru = allCards.find(c => cardName(c) === bestCard._runnerUp.productName);
      const ruDollars = ru ? toDollars(getScore(ru), getUnit(ru), finalAmount).toFixed(2) : '—';
      return `
        <div class="onetap-deep-row">
          <div class="onetap-deep-key">🆚 Runner-up</div>
          <div class="onetap-deep-val">${bestCard._runnerUp.productName} earns ${bestCard._runnerUp.rewardLabel} here (≈$${ruDollars})</div>
        </div>`;
    })() : '';

    const sectionDeep = `
      <div class="onetap-section onetap-section-deep">
        <details class="onetap-deep">
          <summary class="onetap-deep-summary">
            <span>Why ${cardName(bestCard)} wins here</span>
            <span class="onetap-deep-chevron">›</span>
          </summary>
          <div class="onetap-deep-body">
            <div class="onetap-deep-row">
              <div class="onetap-deep-key">🏷 Category</div>
              <div class="onetap-deep-val">${bestCard._category && bestCard._category !== 'general' ? bestCard._category : 'General — no special category matched'}</div>
            </div>
            <div class="onetap-deep-row">
              <div class="onetap-deep-key">💳 Rate applied</div>
              <div class="onetap-deep-val">${bestRateText} → ${bestEarn.primary} ${bestEarn.label} (≈$${bestDollars.toFixed(2)} value)</div>
            </div>
            ${runnerUpDeepRow}
            ${tiersRows ? `
            <div class="onetap-deep-row">
              <div class="onetap-deep-key">📋 All tiers</div>
              <div class="onetap-deep-val onetap-deep-tiers">${tiersRows}</div>
            </div>` : ''}
            ${introRow}
          </div>
        </details>
      </div>`;

    // ── Offers ────────────────────────────────────────────────────────────────
    const sectionOffers = offers.length > 0 ? `
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
              <div class="onetap-toggle-track"><div class="onetap-toggle-thumb"></div></div>
            </div>
          </label>`).join('')}
      </div>` : '';

    // ── Full Layout ──────────────────────────────────────────────────────────
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
          <div class="onetap-pick-badge">${isManual ? 'Using ' + cardName(bestCard) : '👍 Best card to use'}</div>
          <div class="onetap-pick-row">
            <div class="onetap-pick-img-wrap">
              ${bestImg ? `<img class="onetap-pick-img" src="${bestImg}" alt="">` : `<div class="onetap-pick-img-fallback" style="background:${cardGradient(bestCard)}"></div>`}
            </div>
            <div class="onetap-pick-info">
              <div class="onetap-pick-name">${cardName(bestCard)} - ${bestCard.lastFour}</div>
              <div class="onetap-pick-rate">${bestRateText}</div>
            </div>
            <div class="onetap-pick-check">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#004977"/><path d="M6 10L9 13L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
          </div>

          <div class="onetap-rewards-section">
            <div class="onetap-rewards-header">
              <span class="onetap-rewards-label">Total rewards</span>
              <span class="onetap-rewards-value">${bestEarn.primary} ${bestEarn.label}</span>
            </div>
            <div class="onetap-rewards-detail">
              <div class="onetap-rewards-detail-row">
                <div>
                  <div class="onetap-rewards-detail-title">Card rewards</div>
                  <div class="onetap-rewards-detail-sub">${bestRateText}${bestCard._category && bestCard._category !== 'general' ? ' on ' + bestCard._category : ''}</div>
                </div>
                <div class="onetap-rewards-detail-right">
                  <div class="onetap-rewards-detail-amount">≈$${bestDollars.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          ${sectionCompare}
        </div>

        <!-- Other Cards -->
        ${allCards.filter(c => cardId(c) !== cardId(bestCard)).map(card => {
          const img = getCardImageUrl(cardName(card));
          const score = getScore(card);
          const unit = getUnit(card);
          return `
          <div class="onetap-pick" data-card-id="${cardId(card)}">
            <div class="onetap-pick-row">
              <div class="onetap-pick-img-wrap">
                ${img ? `<img class="onetap-pick-img" src="${img}" alt="">` : `<div class="onetap-pick-img-fallback" style="background:${cardGradient(card)}"></div>`}
              </div>
              <div class="onetap-pick-info">
                <div class="onetap-pick-name">${cardName(card)} - ${card.lastFour}</div>
                <div class="onetap-pick-rate">${fmtRate(score, unit)}</div>
              </div>
              <div class="onetap-pick-check onetap-pick-unchecked">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#D0D0D0" stroke-width="2"/></svg>
              </div>
            </div>
          </div>
        `}).join('')}

        ${sectionDeep}
        ${sectionOffers}
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
      </div>
    `;
  }

  function bindOverlayEvents(drawer, allCards, offers, merchant, amount) {
    const closeBtn = drawer.querySelector('.onetap-close');
    const backdrop = drawer.parentElement;
    closeBtn.addEventListener('click', () => closeOverlay(backdrop));

    // Card pick selection (Kudos-style with smart scoring)
    drawer.querySelectorAll('.onetap-pick:not(.onetap-pick-selected)').forEach(pick => {
      pick.addEventListener('click', () => {
        const selectedId = pick.dataset.cardId;
        const card = allCards.find(c => (c._id || c.id) === selectedId);
        if (card) {
          const topTier = (card.rewardTiers || [])[0];
          const score = card._score != null ? card._score : (topTier ? topTier.rate : 1);
          const unit = card._unit || (topTier ? topTier.unit : 'points');
          const rateLabel = card._rewardLabel || (unit === 'percent_cashback' || unit === 'percent_back' ? score + '% cash back' : score + 'x ' + unit);
          const reason = card._category && card._category !== 'general'
            ? `${cardName(card)} earns ${rateLabel} at ${card._category} merchants`
            : `${cardName(card)} earns ${rateLabel} on every purchase`;
          overlayData.bestCard = { ...card, _score: score, _unit: unit, _category: card._category || 'selected', _isManualSelection: true, _reason: reason };
          // Quick fade transition then re-render in place
          const body = drawer.querySelector('.onetap-body');
          if (body) {
            body.style.transition = 'opacity 0.12s ease';
            body.style.opacity = '0.4';
            setTimeout(() => {
              const { bestCard: newBest, offers: newOffers, allCards: newAll, merchant: m, amount: a } = overlayData;
              drawer.innerHTML = buildOverlayHTML(newBest, newAll, newOffers || [], m, a, overlayData.originalBestCardId);
              const newBody = drawer.querySelector('.onetap-body');
              if (newBody) {
                newBody.style.opacity = '0';
                newBody.style.transition = 'opacity 0.15s ease';
                requestAnimationFrame(() => { newBody.style.opacity = '1'; });
              }
              bindOverlayEvents(drawer, allCards, offers, merchant, amount);
            }, 120);
          }
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
    payBtn.addEventListener('click', () => processPayment(drawer, merchant));
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
    const payCardId = payBtn.dataset.cardId;
    const selectedCardName = cardName(overlayData.bestCard);

    // Autofill the checkout form on the actual page with real card data
    autofillCard(selectedCardName, overlayData.bestCard);

    chrome.runtime.sendMessage({
      type: MSG.PROCESS_PAYMENT,
      payload: { cardId: payCardId, amount: finalAmount, merchant }
    }, (response) => {
      loading.style.display = 'none';
      success.style.display = 'flex';
      payBtn.classList.add('onetap-pay-success');

      setTimeout(() => {
        const innerDrawer = payBtn.closest('.onetap-drawer');
        if (innerDrawer) {
          const rewardsBar = innerDrawer.querySelector('.onetap-rewards-bar');
          if (rewardsBar && response && response.transaction) {
            rewardsBar.innerHTML = `
              <svg class="onetap-rewards-icon" viewBox="0 0 20 20" fill="none">
                <path d="M10 1L12.5 7H19L13.75 11L15.5 17.5L10 13.5L4.5 17.5L6.25 11L1 7H7.5L10 1Z" fill="#FFD700"/>
              </svg>
              <span>Earned <strong>${response.transaction.rewardsEarned} ${response.transaction.rewardUnit}</strong> · Confirmation: ${response.confirmationNumber}</span>
            `;
          }
        }
        // Close the overlay after a moment so user sees the filled form
        setTimeout(() => {
          const backdrop = drawer.parentElement;
          if (backdrop) closeOverlay(backdrop);
        }, 1500);
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
