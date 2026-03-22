// One Tap Popup — Dashboard UI with Auth
document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupAuthTabs();
  setupTabs();
  setupAccordion();

  // Check if already logged in
  const authRes = await sendMessage('CHECK_AUTH');
  if (authRes.loggedIn) {
    showMainApp(authRes.user);
  } else {
    showAuthScreen();
    // Auto-login if service worker completes Google OAuth while popup is open
    chrome.storage.onChanged.addListener(function onAuthChange(changes, area) {
      if (area === 'local' && changes.authToken) {
        chrome.storage.onChanged.removeListener(onAuthChange);
        sendMessage('CHECK_AUTH').then(res => {
          if (res.loggedIn) showMainApp(res.user);
        });
      }
    });
  }
}

function sendMessage(type, payload = {}) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type, payload }, resolve);
  });
}

// ===== Auth =====
function showAuthScreen() {
  document.getElementById('auth-screen').style.display = '';
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('header-sub').textContent = '';
}

async function showMainApp(user) {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display = '';
  if (user) {
    document.getElementById('header-sub').textContent = `Welcome, ${user.firstName}`;
  }

  // Refresh data from API
  await sendMessage('REFRESH_DATA');

  const [cardsRes, offersRes, txRes, settingsRes] = await Promise.all([
    sendMessage('GET_ALL_CARDS'),
    sendMessage('GET_OFFERS'),
    sendMessage('GET_TRANSACTIONS'),
    sendMessage('GET_SETTINGS'),
  ]);

  renderCards(cardsRes.cards || []);
  renderAIRec(cardsRes.cards || []);
  renderOffers(offersRes.offers || [], cardsRes.cards || [], txRes.transactions || []);
  renderActivity(txRes.transactions || [], cardsRes.cards || []);
  renderSettings(settingsRes.settings || {}, cardsRes.cards || []);
  renderStats(txRes.transactions || []);
  loadInsights();
}

function setupAuthTabs() {
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('google-signin-btn').addEventListener('click', handleGoogleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Enter key submits
  ['login-username', 'login-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  });
}

function handleGoogleLogin() {
  const session = crypto.randomUUID();
  sendMessage('START_GOOGLE_POLL', { session });
  chrome.tabs.create({ url: `https://onetap-ten.vercel.app/signin.html?session=${session}` });
}

async function handleLogin() {
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!username || !password) { errEl.textContent = 'Fill in all fields'; return; }

  btn.textContent = 'Signing in...';
  btn.disabled = true;
  errEl.textContent = '';

  const res = await sendMessage('LOGIN', { username, password });
  if (res.success) {
    showMainApp(res.user);
  } else {
    errEl.textContent = res.error || 'Login failed';
  }
  btn.textContent = 'Sign In';
  btn.disabled = false;
}

async function handleRegister() {
  const btn = document.getElementById('register-btn');
  const errEl = document.getElementById('register-error');
  const firstName = document.getElementById('reg-first').value.trim();
  const lastName = document.getElementById('reg-last').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!firstName || !lastName || !username || !email || !password) {
    errEl.textContent = 'Fill in all fields';
    return;
  }

  btn.textContent = 'Creating account...';
  btn.disabled = true;
  errEl.textContent = '';

  const res = await sendMessage('REGISTER', { username, email, password, firstName, lastName });
  if (res.success) {
    showMainApp(res.user);
  } else {
    errEl.textContent = res.error || 'Registration failed';
  }
  btn.textContent = 'Create Account';
  btn.disabled = false;
}

async function handleLogout() {
  await sendMessage('LOGOUT');
  showAuthScreen();
}

// ===== Accordion =====
function setupAccordion() {
  const toggle = document.getElementById('ai-rec-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    document.getElementById('ai-rec-card').classList.toggle('collapsed');
  });
}

// ===== Tabs =====
function switchToTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const tabBtn = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchToTab(tab.dataset.tab));
  });

  const banner = document.getElementById('insights-banner');
  if (banner) banner.addEventListener('click', () => switchToTab('insights'));
}

// ===== Helpers (early) =====
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== Cards =====
function renderCards(cards) {
  const carousel = document.getElementById('cards-carousel');

  carousel.innerHTML = cards.map((card) => {
    const gradient = card.visual?.gradient || 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)';
    const imgUrl = getCardImageUrl(card.productName);

    const tierTags = (card.rewardTiers || []).slice(0, 4).map(tier => {
      const isPct = tier.unit === 'percent_cashback' || tier.unit === 'percent_back';
      const rate = isPct ? `${tier.rate}%` : `${tier.rate}x`;
      const cats = tier.categories || [];
      const cat = cats[0] === 'everything' ? 'Everywhere'
        : cats.length > 1 ? cats.slice(0, 2).map(capitalize).join(' & ')
        : capitalize(cats[0] || '');
      return `<span class="card-tier-tag"><span class="card-tier-rate">${rate}</span>${cat ? `<span class="card-tier-cat">${cat}</span>` : ''}</span>`;
    }).join('');

    return `
      <div class="card-wrapper" data-card-id="${card._id}">
        <div class="card-visual" style="background: ${imgUrl ? 'transparent' : gradient}">
          ${imgUrl ? `<img class="card-visual-img" src="${imgUrl}" alt="${card.productName}">` : ''}
          <div class="card-menu-wrapper">
            <button class="card-menu-trigger" data-menu-id="${card._id}">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg>
            </button>
            <div class="card-menu-dropdown" id="menu-${card._id}">
              <button class="card-menu-item" data-edit-id="${card._id}">Edit Card</button>
              <button class="card-menu-item" data-default-id="${card._id}">Set as Default</button>
              <button class="card-menu-item danger" data-confirm-id="${card._id}">Delete Card</button>
            </div>
          </div>
          <div class="card-confirm-delete" id="confirm-${card._id}">
            <div class="card-confirm-text">Delete ${card.productName}?</div>
            <div class="card-confirm-actions">
              <button class="card-confirm-no" data-cancel-id="${card._id}">Cancel</button>
              <button class="card-confirm-yes" data-delete-id="${card._id}">Delete</button>
            </div>
          </div>
        </div>
        <div class="card-info">
          <div class="card-info-row">
            <span class="card-info-name">${card.productName}</span>
            ${card.isDefault ? '<span class="card-info-default">Default</span>' : ''}
          </div>
          <div class="card-tiers">${tierTags}</div>
        </div>
      </div>
    `;
  }).join('') + `
    <button class="add-card-btn" id="add-card-btn">
      <span class="add-card-plus">+</span>
      <span class="add-card-label">Add Card</span>
    </button>
  `;

  document.getElementById('add-card-btn').addEventListener('click', openAddCardModal);

  // Three-dot menu
  carousel.querySelectorAll('.card-menu-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById(`menu-${btn.dataset.menuId}`);
      const wasOpen = menu.classList.contains('open');
      carousel.querySelectorAll('.card-menu-dropdown.open').forEach(m => m.classList.remove('open'));
      if (!wasOpen) menu.classList.add('open');
    });
  });

  // Set as default
  carousel.querySelectorAll('.card-menu-item[data-default-id]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const res = await sendMessage('SET_DEFAULT_CARD', { cardId: btn.dataset.defaultId });
      if (res && res.success !== false) renderCards(res.cards);
    });
  });

  // Edit card
  carousel.querySelectorAll('.card-menu-item[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      document.getElementById(`menu-${btn.dataset.editId}`).classList.remove('open');
      const cardsRes = await sendMessage('GET_ALL_CARDS');
      const card = (cardsRes.cards || []).find(c => c._id === btn.dataset.editId);
      if (card) openEditCardModal(card);
    });
  });

  // Show delete confirmation
  carousel.querySelectorAll('.card-menu-item[data-confirm-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById(`menu-${btn.dataset.confirmId}`).classList.remove('open');
      document.getElementById(`confirm-${btn.dataset.confirmId}`).classList.add('active');
    });
  });

  // Cancel delete
  carousel.querySelectorAll('.card-confirm-no').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById(`confirm-${btn.dataset.cancelId}`).classList.remove('active');
    });
  });

  // Confirm delete
  carousel.querySelectorAll('.card-confirm-yes').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      btn.textContent = 'Deleting...';
      const res = await sendMessage('DELETE_CARD', { cardId: btn.dataset.deleteId });
      if (res && res.success) renderCards(res.cards);
    });
  });

  document.addEventListener('click', () => {
    carousel.querySelectorAll('.card-menu-dropdown.open').forEach(m => m.classList.remove('open'));
  });
}

function renderStats(transactions) {
  let miles = 0, cash = 0, points = 0;

  for (const tx of transactions) {
    const earned = tx.rewardsEarned || 0;
    const unit = (tx.rewardUnit || '').toLowerCase();
    if (unit.includes('mile')) miles += earned;
    else if (unit.includes('cash') || unit.includes('percent') || unit.includes('%')) cash += earned;
    else if (unit.includes('point')) points += earned;
    else if (unit.includes('x')) miles += earned;
    else cash += earned;
  }

  document.getElementById('stat-miles').textContent = miles.toLocaleString();
  document.getElementById('stat-cash').textContent = `$${cash.toFixed(2)}`;
  document.getElementById('stat-points').textContent = points.toLocaleString();
}

// ===== Add Card Modal =====
let selectedProduct = null;

async function openAddCardModal() {
  const modal = document.getElementById('add-card-modal');
  const grid = document.getElementById('card-product-grid');

  const res = await sendMessage('GET_CARD_PRODUCTS');
  const products = res.products || [];

  // Group products by cardType
  const groups = { personal: [], business: [], partner: [] };
  products.forEach(p => {
    const type = p.cardType || 'personal';
    if (!groups[type]) groups[type] = [];
    groups[type].push(p);
  });

  const groupLabels = { personal: 'Personal Cards', business: 'Business Cards', partner: 'Partner Cards' };

  grid.innerHTML = Object.entries(groups)
    .filter(([, cards]) => cards.length > 0)
    .map(([type, cards]) => `
      <div class="card-group-label">${groupLabels[type] || type}</div>
      ${cards.map(p => {
        const topTier = p.rewardTiers?.[0];
        const rewardText = topTier
          ? topTier.unit === 'percent_cashback' || topTier.unit === 'percent_back'
            ? `${topTier.rate}% back`
            : `${topTier.rate}X ${topTier.unit}`
          : '';
        const localImg = getCardImageUrl(p.name);
        const imgHtml = localImg
          ? `<img class="card-type-img" src="${localImg}" alt="${p.name}">`
          : `<div class="card-type-swatch" style="background: ${p.visual?.gradient || '#333'}"></div>`;
        return `
          <div class="card-type-option" data-product-name="${p.name}">
            ${imgHtml}
            <div class="card-type-name">${p.name}</div>
            <div class="card-type-reward">${rewardText}</div>
            <div class="card-type-fee">${p.annualFee ? `$${p.annualFee}/yr` : 'No annual fee'}</div>
          </div>
        `;
      }).join('')}
    `).join('');

  selectedProduct = null;
  document.getElementById('add-card-submit').disabled = true;
  document.getElementById('add-card-fullnumber').value = '';
  document.getElementById('add-card-exp').value = '';
  document.getElementById('add-card-cvv').value = '';
  document.getElementById('add-card-name').value = '';
  document.getElementById('add-card-balance').value = '';

  grid.querySelectorAll('.card-type-option').forEach(opt => {
    opt.addEventListener('click', () => {
      grid.querySelectorAll('.card-type-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedProduct = opt.dataset.productName;
      validateAddCard();
    });
  });

  modal.classList.add('active');
}

function validateAddCard() {
  const num = document.getElementById('add-card-fullnumber').value.replace(/\s/g, '');
  const exp = document.getElementById('add-card-exp').value.trim();
  const cvv = document.getElementById('add-card-cvv').value.trim();
  document.getElementById('add-card-submit').disabled = !selectedProduct || num.length < 15 || exp.length < 5 || cvv.length < 3;
}

// Format card number with spaces
document.getElementById('add-card-fullnumber').addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 16);
  e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  validateAddCard();
});

// Format expiry as MM/YY
document.getElementById('add-card-exp').addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
  e.target.value = v;
  validateAddCard();
});

document.getElementById('add-card-cvv').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  validateAddCard();
});

document.getElementById('add-card-name').addEventListener('input', () => validateAddCard());

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('add-card-modal').classList.remove('active');
});
document.getElementById('add-card-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) document.getElementById('add-card-modal').classList.remove('active');
});

document.getElementById('add-card-submit').addEventListener('click', async () => {
  if (!selectedProduct) return;
  const btn = document.getElementById('add-card-submit');
  const fullNumber = document.getElementById('add-card-fullnumber').value.replace(/\s/g, '');
  const lastFour = fullNumber.slice(-4);
  const expRaw = document.getElementById('add-card-exp').value.trim();
  const [expMonth, expYear] = expRaw.split('/');
  const cvv = document.getElementById('add-card-cvv').value.trim();
  const cardholderName = document.getElementById('add-card-name').value.trim();
  const balance = parseFloat(document.getElementById('add-card-balance').value) || 0;

  btn.textContent = 'Adding...';
  btn.disabled = true;

  const res = await sendMessage('ADD_CARD', { productName: selectedProduct, lastFour, fullNumber, expMonth, expYear, cvv, cardholderName, balance });

  if (res.success) {
    btn.textContent = 'Added!';
    btn.classList.add('success');
    renderCards(res.cards);
    setTimeout(() => {
      document.getElementById('add-card-modal').classList.remove('active');
      btn.textContent = 'Add Card';
      btn.classList.remove('success');
    }, 800);
  } else {
    btn.textContent = 'Failed — Try Again';
    btn.disabled = false;
    setTimeout(() => { btn.textContent = 'Add Card'; }, 2000);
  }
});

// ===== Offers =====
function renderOffers(offers, cards = [], transactions = []) {
  const list = document.getElementById('offers-list');
  const empty = document.getElementById('offers-empty');

  // ── Sign-up Bonus Progress ────────────────────────────────────────────────
  const bonusSection = document.getElementById('intro-offers-section');
  const cardsWithIntro = cards.filter(c => c.introOffer && !c.introOffer.earned);

  if (cardsWithIntro.length > 0) {
    // Build a spend-per-card map from transaction history
    const spentByCard = {};
    for (const tx of transactions) {
      const cid = tx.cardId?._id || tx.cardId;
      spentByCard[cid] = (spentByCard[cid] || 0) + tx.amount;
    }

    bonusSection.innerHTML = `
      <div class="intro-offers-header">
        <span class="intro-offers-label">Sign-up Bonus Progress</span>
      </div>
      ${cardsWithIntro.map(card => {
        const o = card.introOffer;
        const spent = spentByCard[card._id] || 0;
        const pct = o.spendRequired > 0 ? Math.min(100, Math.round((spent / o.spendRequired) * 100)) : 100;
        const remaining = Math.max(0, o.spendRequired - spent);
        const bonus = o.bonusUnit === 'cash'
          ? `$${o.bonusAmount.toLocaleString()} Cash`
          : `${o.bonusAmount.toLocaleString()} ${o.bonusUnit.charAt(0).toUpperCase() + o.bonusUnit.slice(1)}`;

        let daysLeft = null;
        const startMs = o.startDate ? new Date(o.startDate) : new Date(card.createdAt);
        if (startMs && o.timeframeDays) {
          const endMs = startMs.getTime() + o.timeframeDays * 86400000;
          daysLeft = Math.max(0, Math.ceil((endMs - Date.now()) / 86400000));
        }

        const earned = remaining === 0;

        return `
          <div class="intro-offer-card">
            <div class="intro-offer-head">
              <div class="intro-offer-head-left">
                <div class="intro-offer-card-name">${card.productName}</div>
                <div class="intro-offer-desc">${o.description}</div>
              </div>
              <div class="intro-offer-bonus-pill">${bonus}</div>
            </div>

            <div class="intro-offer-progress-section">
              <div class="intro-offer-bar-row">
                <div class="intro-offer-bar-wrap">
                  <div class="intro-offer-bar ${earned ? 'intro-offer-bar-complete' : ''}" style="width:${pct}%"></div>
                </div>
                <span class="intro-offer-pct">${pct}%</span>
              </div>
              <div class="intro-offer-meta">
                <span class="intro-offer-spent">$${spent.toFixed(0)} <span class="intro-offer-meta-of">of</span> $${o.spendRequired.toLocaleString()}</span>
                ${daysLeft !== null
                  ? `<span class="intro-offer-days ${daysLeft < 14 ? 'intro-offer-days-urgent' : ''}">${daysLeft}d left</span>`
                  : ''}
              </div>
              ${earned
                ? `<div class="intro-offer-status intro-offer-status-done">✓ Bonus earned!</div>`
                : `<div class="intro-offer-status">$${remaining.toFixed(0)} more to unlock your bonus</div>`}
            </div>
          </div>`;
      }).join('')}`;
    bonusSection.style.display = '';
  } else {
    bonusSection.style.display = 'none';
  }

  // ── Merchant Offers ───────────────────────────────────────────────────────
  const offersHeader = document.getElementById('offers-section-header');
  if (!offers.length) {
    list.innerHTML = '';
    if (offersHeader) offersHeader.style.display = 'none';
    empty.style.display = cardsWithIntro.length ? 'none' : '';
    return;
  }
  empty.style.display = 'none';
  if (offersHeader) offersHeader.style.display = '';

  list.innerHTML = offers.map(offer => `
    <div class="offer-card" data-offer-id="${offer._id}">
      <div class="offer-left">
        <div class="offer-icon">${offer.merchantIcon || '🏷'}</div>
        <div class="offer-merchant">${offer.merchant}</div>
        <div class="offer-desc">${offer.description}</div>
        ${offer.expiresAt ? `<div class="offer-expiry">Expires ${formatDate(offer.expiresAt)}</div>` : ''}
      </div>
      <button class="offer-btn ${offer.activated ? 'offer-btn-activated' : 'offer-btn-activate'}">
        ${offer.activated ? 'Active' : 'Activate'}
      </button>
    </div>
  `).join('');

  list.querySelectorAll('.offer-btn-activate').forEach(btn => {
    btn.addEventListener('click', async () => {
      const offerId = btn.closest('.offer-card').dataset.offerId;
      btn.textContent = '...';
      await sendMessage('ACTIVATE_OFFER', { offerId });
      btn.textContent = 'Active';
      btn.classList.remove('offer-btn-activate');
      btn.classList.add('offer-btn-activated');
    });
  });
}

// ===== Activity =====
function renderActivity(transactions, cards) {
  const list = document.getElementById('activity-list');
  const empty = document.getElementById('activity-empty');

  if (!transactions.length) {
    list.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  const cardMap = {};
  for (const c of cards) cardMap[c._id] = c;

  list.innerHTML = transactions.map(tx => {
    const card = cardMap[tx.cardId] || tx.cardId; // cardId might be populated object
    const cardName = card?.productName || card?.nickname || '';
    const lastFour = card?.lastFour || '';
    const gradient = card?.visual?.gradient || '';
    const dotColor = gradient ? (gradient.match(/#[a-fA-F0-9]{6}/)?.[0] || '#004977') : '#004977';

    return `
      <div class="activity-item">
        <div class="activity-left">
          <div class="activity-dot" style="background: ${dotColor}"></div>
          <div>
            <div class="activity-merchant">${tx.merchant}</div>
            <div class="activity-card">${cardName} ${lastFour ? '••' + lastFour : ''}</div>
          </div>
        </div>
        <div class="activity-right">
          <div class="activity-amount">-$${tx.amount.toFixed(2)}</div>
          <div class="activity-reward">+${tx.rewardsEarned} ${tx.rewardUnit}</div>
          <div class="activity-date">${formatDate(tx.date)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== Settings =====
function renderSettings(settings, cards) {
  document.getElementById('setting-autodetect').checked = settings.autoDetect !== false;
  document.getElementById('setting-floating').checked = settings.showFloatingButton !== false;
  document.getElementById('setting-notifications').checked = settings.notifications !== false;

  const select = document.getElementById('setting-default-card');
  select.innerHTML = cards.map(c =>
    `<option value="${c._id}" ${c.isDefault ? 'selected' : ''}>${c.productName}</option>`
  ).join('');

  document.querySelectorAll('.toggle-input, .setting-select, .setting-select-full').forEach(input => {
    input.addEventListener('change', () => {
      sendMessage('UPDATE_SETTINGS', {
        autoDetect: document.getElementById('setting-autodetect').checked,
        showFloatingButton: document.getElementById('setting-floating').checked,
        notifications: document.getElementById('setting-notifications').checked,
        defaultCardId: select.value,
      });
    });
  });
}

// ===== Edit Card Modal =====
function openEditCardModal(card) {
  const modal = document.getElementById('edit-card-modal');
  document.getElementById('edit-card-id').value = card._id;

  // Pre-fill with existing data
  const num = card.fullNumber || '';
  document.getElementById('edit-card-fullnumber').value = num.replace(/(.{4})/g, '$1 ').trim();
  document.getElementById('edit-card-exp').value = (card.expMonth && card.expYear) ? card.expMonth + '/' + card.expYear : '';
  document.getElementById('edit-card-cvv').value = card.cvv || '';
  document.getElementById('edit-card-name').value = card.cardholderName || '';
  document.getElementById('edit-card-firstname').value = card.billingFirstName || '';
  document.getElementById('edit-card-lastname').value = card.billingLastName || '';
  document.getElementById('edit-card-address').value = card.billingAddress || '';
  document.getElementById('edit-card-city').value = card.billingCity || '';
  document.getElementById('edit-card-state').value = card.billingState || '';
  document.getElementById('edit-card-zip').value = card.billingZip || '';

  modal.classList.add('active');
}

document.getElementById('edit-modal-close').addEventListener('click', () => {
  document.getElementById('edit-card-modal').classList.remove('active');
});
document.getElementById('edit-card-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) document.getElementById('edit-card-modal').classList.remove('active');
});

// Format inputs in edit modal
document.getElementById('edit-card-fullnumber').addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 16);
  e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
});
document.getElementById('edit-card-exp').addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
  e.target.value = v;
});
document.getElementById('edit-card-cvv').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

document.getElementById('edit-card-submit').addEventListener('click', async () => {
  const btn = document.getElementById('edit-card-submit');
  const cardId = document.getElementById('edit-card-id').value;
  const fullNumber = document.getElementById('edit-card-fullnumber').value.replace(/\s/g, '');
  const expRaw = document.getElementById('edit-card-exp').value.trim();
  const [expMonth, expYear] = expRaw.split('/');
  const cvv = document.getElementById('edit-card-cvv').value.trim();
  const cardholderName = document.getElementById('edit-card-name').value.trim();
  const billingFirstName = document.getElementById('edit-card-firstname').value.trim();
  const billingLastName = document.getElementById('edit-card-lastname').value.trim();
  const billingAddress = document.getElementById('edit-card-address').value.trim();
  const billingCity = document.getElementById('edit-card-city').value.trim();
  const billingState = document.getElementById('edit-card-state').value.trim().toUpperCase();
  const billingZip = document.getElementById('edit-card-zip').value.trim();

  btn.textContent = 'Saving...';
  btn.disabled = true;

  const res = await sendMessage('EDIT_CARD', {
    cardId,
    updates: { fullNumber, expMonth, expYear, cvv, cardholderName, billingFirstName, billingLastName, billingAddress, billingCity, billingState, billingZip },
  });

  if (res.success) {
    btn.textContent = 'Saved!';
    btn.classList.add('success');
    renderCards(res.cards);
    setTimeout(() => {
      document.getElementById('edit-card-modal').classList.remove('active');
      btn.textContent = 'Save Changes';
      btn.classList.remove('success');
      btn.disabled = false;
    }, 800);
  } else {
    btn.textContent = 'Failed — Try Again';
    btn.disabled = false;
    setTimeout(() => { btn.textContent = 'Save Changes'; }, 2000);
  }
});

// ===== AI Recommendation =====
function renderAIRec(cards) {
  const container = document.getElementById('ai-rec-rows');
  if (!container) return;

  const CAT_LABELS = {
    dining: 'Dining', groceries: 'Groceries', travel: 'Travel',
    flights: 'Flights', hotels: 'Hotels', streaming: 'Streaming',
    entertainment: 'Entertainment', 'car-rental': 'Car Rental',
    everything: 'Everything Else', general: 'Everything Else',
  };
  const CAT_ORDER = ['dining', 'groceries', 'travel', 'flights', 'hotels', 'streaming', 'entertainment', 'everything', 'general'];

  const best = {};
  for (const card of cards) {
    for (const tier of (card.rewardTiers || [])) {
      for (const cat of (tier.categories || [])) {
        if (!best[cat] || tier.rate > best[cat].rate) {
          best[cat] = { card, rate: tier.rate, unit: tier.unit };
        }
      }
    }
  }

  // Merge everything/general — keep whichever has the higher rate
  if (best.everything && best.general) {
    if (best.general.rate >= best.everything.rate) delete best.everything;
    else delete best.general;
  }

  const rows = Object.entries(best)
    .sort(([a], [b]) => {
      const ai = CAT_ORDER.indexOf(a), bi = CAT_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([cat, { card, rate, unit }]) => {
      const label = CAT_LABELS[cat] || capitalize(cat);
      const rateStr = unit === 'percent_cashback' || unit === 'percent_back'
        ? `${rate}% back` : `${rate}x`;
      const imgUrl = getCardImageUrl(card.productName);
      return `
        <div class="ai-rec-row">
          <div class="ai-rec-row-left">
            ${imgUrl ? `<img class="ai-rec-card-img" src="${imgUrl}" alt="${card.productName}">` : ''}
            <div class="ai-rec-row-text">
              <div class="ai-rec-cat">${label}</div>
              <div class="ai-rec-card-name">${card.productName}</div>
            </div>
          </div>
          <div class="ai-rec-rate">${rateStr} ${label}</div>
        </div>`;
    });

  container.innerHTML = rows.join('');
}

async function loadInsights() {
  loadSpendingChart();
  loadRecommendation();
}

async function loadSpendingChart() {
  const res = await sendMessage('GET_SPENDING');
  if (res.success && res.spendingSummary) {
    drawSpendingChart(res.spendingSummary);
  }
}

function findCardImageUrl(name) {
  const exact = getCardImageUrl(name);
  if (exact) return exact;
  const nameLower = name.toLowerCase();
  const fuzzyKey = Object.keys(CARD_IMAGE_FILES).find(k =>
    k.toLowerCase().includes(nameLower) || nameLower.includes(k.toLowerCase().split(' ').slice(0, 2).join(' '))
  );
  return fuzzyKey ? getCardImageUrl(fuzzyKey) : null;
}

function renderMarkdown(text) {
  const body = text
    .replace(/(?:\*\*)?Recommended Card:(?:\*\*)?\s*[^\n]*/i, '')
    .replace(/\\\$/g, '$')
    .trim();
  const lines = body.split('\n');
  const htmlParts = [];
  let inList = false;
  const HEADER_RE = /^(?:\*\*)?(Why This Card[^:]*|Key Benefits[^:]*|Drawbacks[^:]*)(?:\*\*)?:\s*(.*)/i;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { if (inList) { htmlParts.push('</ul>'); inList = false; } continue; }
    const headerMatch = line.match(HEADER_RE);
    if (headerMatch) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      const label = headerMatch[1].replace(/\*\*/g, '').trim();
      htmlParts.push(`<div class="rec-section-header">${label}</div>`);
      const inline = headerMatch[2].trim();
      if (inline) { htmlParts.push(`<p class="rec-para">${inline.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`); }
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { htmlParts.push('<ul class="rec-list">'); inList = true; }
      htmlParts.push(`<li class="rec-list-item">${line.slice(2).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</li>`);
      continue;
    }
    if (inList) { htmlParts.push('</ul>'); inList = false; }
    htmlParts.push(`<p class="rec-para">${line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</p>`);
  }
  if (inList) htmlParts.push('</ul>');
  return htmlParts.join('');
}

function extractNoneExplanation(text) {
  const match = text.match(/Why This Card[^:]*:\s*([^\n]+(?:\n(?![A-Z*-]).*)*)/i);
  if (match) return match[1].replace(/\*\*([^*]+)\*\*/g, '').replace(/\\\$/g, '$').trim();
  return text
    .replace(/(?:\*\*)?(?:Recommended Card|Why This Card[^:]*|Key Benefits[^:]*|Drawbacks[^:]*):(?:\*\*)?\s*/gi, '')
    .replace(/^[-*]\s+/gm, '').replace(/\*\*/g, '').replace(/\\\$/g, '$')
    .trim().split('\n').filter(l => l.trim()).slice(0, 3).join(' ');
}

async function loadRecommendation() {
  const el = document.getElementById('ai-rec-body');
  el.style.display = 'block';
  el.innerHTML = '<div class="rec-loading">Analyzing your spending...</div>';

  const res = await sendMessage('GET_RECOMMENDATION');
  if (res.success && res.recommendation) {
    const rawName = res.recommendedCardName || null;
    const isNone = !rawName || /^none/i.test(rawName);
    const tallySection = document.getElementById('insights-savings-section');

    if (isNone) {
      const explanation = extractNoneExplanation(res.recommendation);
      el.innerHTML = `<div class="rec-covered">
        <div class="rec-covered-check">✓</div>
        <div class="rec-covered-title">You're already optimized</div>
        <div class="rec-covered-body">${explanation || "Your current cards are already well-suited for your spending habits."}</div>
      </div>`;
      if (tallySection) tallySection.style.display = 'none';
      return;
    }

    const cardNameStr = rawName;
    const imgUrl = findCardImageUrl(cardNameStr);
    const markdownHtml = renderMarkdown(res.recommendation);
    const { potentialSavings = 0, actualEarned = 0, additionalValue = 0 } = res;

    const savingsHtml = additionalValue > 0 ? `
      <div class="savings-toggle collapsed" id="savings-toggle">
        <button class="savings-toggle-btn" id="savings-toggle-btn">
          <span class="savings-toggle-label">Savings Opportunity</span>
          <span class="savings-toggle-chevron">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 6 8 10 12 6"/></svg>
          </span>
        </button>
        <div class="savings-body">
          <div class="savings-row">
            <span class="savings-label">Rewards you earned</span>
            <span class="savings-value actual">$${actualEarned.toFixed(2)}</span>
          </div>
          <div class="savings-row">
            <span class="savings-label">Potential with ${cardNameStr}</span>
            <span class="savings-value potential">$${potentialSavings.toFixed(2)}</span>
          </div>
          <div class="savings-row savings-row-total">
            <span class="savings-label">Additional value</span>
            <span class="savings-value highlight">+$${additionalValue.toFixed(2)}</span>
          </div>
        </div>
      </div>` : '';

    el.innerHTML = `
      <div class="rec-spotlight">
        <div class="rec-card-visual">
          ${imgUrl ? `<img class="rec-card-img" src="${imgUrl}" alt="${cardNameStr}">` : '<div class="rec-card-fallback"></div>'}
        </div>
        <div class="rec-card-name">${cardNameStr}</div>
      </div>
      ${savingsHtml}
      <div class="rec-markdown">${markdownHtml}</div>`;

    if (additionalValue > 0) {
      document.getElementById('savings-toggle-btn').addEventListener('click', () => {
        document.getElementById('savings-toggle').classList.toggle('collapsed');
      });
    }

    if (tallySection) {
      const tallyBody = document.getElementById('savings-tally-body');
      const pct = actualEarned > 0 ? Math.round((additionalValue / actualEarned) * 100) : 0;
      const barActual = potentialSavings > 0 ? Math.round((actualEarned / potentialSavings) * 100) : 100;
      tallyBody.innerHTML = `
        <div class="tally-row">
          <div class="tally-row-label"><span class="tally-dot tally-dot-actual"></span><span>Current</span></div>
          <div class="tally-bar-wrap"><div class="tally-bar tally-bar-actual" style="width:${barActual}%"></div></div>
          <span class="tally-amount">$${actualEarned.toFixed(2)}</span>
        </div>
        <div class="tally-row">
          <div class="tally-row-label"><span class="tally-dot tally-dot-potential"></span><span>Potential</span></div>
          <div class="tally-bar-wrap"><div class="tally-bar tally-bar-potential" style="width:100%"></div></div>
          <span class="tally-amount">$${potentialSavings.toFixed(2)}</span>
        </div>
        <div class="tally-delta">
          <span>You left </span><strong>$${additionalValue.toFixed(2)}</strong><span> on the table${pct > 0 ? ` — ${pct}% more rewards` : ''}</span>
        </div>`;
      tallySection.style.display = '';
    }
  } else {
    el.innerHTML = '<div class="rec-loading">Server warming up — try again in a moment.</div>';
    const tallySection = document.getElementById('insights-savings-section');
    if (tallySection) tallySection.style.display = 'none';
  }
}

function drawSpendingChart(spendingSummary) {
  const wrap = document.getElementById('ai-rec-chart-wrap');
  const canvas = document.getElementById('ai-rec-chart');
  const legend = document.getElementById('ai-rec-legend');
  if (!canvas || !wrap) return;

  const COLORS = ['#004977','#2196F3','#D03027','#0A8A3E','#F5A623','#7C4DFF','#00BCD4','#FF5722','#8BC34A'];
  const CAT_LABELS = {
    dining: 'Dining', groceries: 'Groceries', travel: 'Travel',
    flights: 'Flights', hotels: 'Hotels', streaming: 'Streaming',
    entertainment: 'Entertainment', 'car-rental': 'Car Rental',
    gas: 'Gas', transit: 'Transit', shopping: 'Shopping',
    general: 'General', everything: 'Everything Else',
    'bass-pro': 'Bass Pro',
  };

  const entries = Object.entries(spendingSummary).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return;

  const SIZE = 155;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  canvas.style.width = SIZE + 'px';
  canvas.style.height = SIZE + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 4, innerR = r * 0.52;

  let angle = -Math.PI / 2;
  entries.forEach(([, amt], i) => {
    const slice = (amt / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    angle += slice;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  legend.innerHTML = entries.map(([cat, amt], i) => `
    <div class="ai-rec-legend-item">
      <span class="ai-rec-legend-dot" style="background:${COLORS[i % COLORS.length]}"></span>
      <span class="ai-rec-legend-label">${CAT_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
      <span class="ai-rec-legend-pct">$${amt.toLocaleString()}</span>
    </div>`).join('');

  wrap.style.display = 'flex';
  const loading = document.getElementById('insights-loading');
  if (loading) loading.style.display = 'none';
}

// ===== Helpers =====
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const dayMs = 86400000;
  if (diff < dayMs && date.getDate() === now.getDate()) return 'Today';
  if (diff < 2 * dayMs) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
