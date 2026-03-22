// One Tap Popup — Dashboard UI with Auth
document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupAuthTabs();
  setupTabs();

  // Check if already logged in
  const authRes = await sendMessage('CHECK_AUTH');
  if (authRes.loggedIn) {
    showMainApp(authRes.user);
  } else {
    showAuthScreen();
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
  document.getElementById('logout-btn').style.display = 'none';
  document.getElementById('header-sub').textContent = 'Capital One Smart Checkout';
}

async function showMainApp(user) {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display = '';
  document.getElementById('logout-btn').style.display = '';
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
  renderOffers(offersRes.offers || []);
  renderActivity(txRes.transactions || [], cardsRes.cards || []);
  renderSettings(settingsRes.settings || {}, cardsRes.cards || []);
  renderStats(txRes.transactions || []);
  loadRecommendation();
}

function setupAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('login-form').style.display = tab.dataset.auth === 'login' ? '' : 'none';
      document.getElementById('register-form').style.display = tab.dataset.auth === 'register' ? '' : 'none';
    });
  });

  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('register-btn').addEventListener('click', handleRegister);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Enter key submits
  ['login-username', 'login-password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  });
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

// ===== Tabs =====
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

// ===== Cards =====
function renderCards(cards) {
  const carousel = document.getElementById('cards-carousel');

  carousel.innerHTML = cards.map(card => {
    const gradient = card.visual?.gradient || 'linear-gradient(135deg, #333 0%, #111 100%)';
    const textColor = card.visual?.textColor || '#FFFFFF';
    const topTier = card.rewardTiers?.[0];
    const rewardText = topTier
      ? `${topTier.rate}x ${topTier.unit === 'percent_cashback' ? '% back' : topTier.unit} on ${topTier.categories[0]}`
      : '';

    return `
      <div class="card-visual" style="background: ${gradient}; color: ${textColor}" data-card-id="${card._id}">
        <div class="card-menu-wrapper">
          <button class="card-menu-trigger" data-menu-id="${card._id}">&#8943;</button>
          <div class="card-menu-dropdown" id="menu-${card._id}">
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
        <div class="card-visual-top">
          <div>
            <div class="card-visual-name">${card.productName}</div>
            <div class="card-visual-type">${card.network}</div>
          </div>
          ${card.isDefault ? '<div class="card-visual-default">Default</div>' : ''}
        </div>
        <div class="card-visual-number">&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; ${card.lastFour}</div>
        <div class="card-visual-bottom">
          <div class="card-visual-reward">${rewardText}</div>
          <div class="card-visual-logo">Capital One</div>
        </div>
      </div>
    `;
  }).join('') + `
    <button class="add-card-btn" id="add-card-btn">
      <div class="add-card-btn-icon">+</div>
      <div class="add-card-btn-text">Add Card</div>
    </button>
  `;

  document.getElementById('add-card-btn').addEventListener('click', openAddCardModal);

  // Three-dot menu
  carousel.querySelectorAll('.card-menu-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      carousel.querySelectorAll('.card-menu-dropdown.open').forEach(m => m.classList.remove('open'));
      document.getElementById(`menu-${btn.dataset.menuId}`).classList.toggle('open');
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
  const thisMonth = transactions.filter(tx => {
    const d = new Date(tx.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalSpent = thisMonth.reduce((sum, tx) => sum + tx.amount, 0);
  document.getElementById('stat-total-rewards').textContent = `$${totalSpent.toFixed(0)}`;
  document.getElementById('stat-transactions').textContent = `${thisMonth.length} txns`;
}

// ===== Add Card Modal =====
let selectedProduct = null;

async function openAddCardModal() {
  const modal = document.getElementById('add-card-modal');
  const grid = document.getElementById('card-product-grid');

  const res = await sendMessage('GET_CARD_PRODUCTS');
  const products = res.products || [];

  grid.innerHTML = products.map(p => {
    const topTier = p.rewardTiers?.[0];
    const rewardText = topTier
      ? `${topTier.rate}x ${topTier.unit === 'percent_cashback' ? '% back' : topTier.unit}`
      : '';
    return `
      <div class="card-type-option" data-product-name="${p.name}">
        <div class="card-type-swatch" style="background: ${p.visual?.gradient || '#333'}"></div>
        <div class="card-type-name">${p.name}</div>
        <div class="card-type-reward">${rewardText}</div>
        <div class="card-type-fee">${p.annualFee ? `$${p.annualFee}/yr` : 'No annual fee'}</div>
      </div>
    `;
  }).join('');

  selectedProduct = null;
  document.getElementById('add-card-submit').disabled = true;
  document.getElementById('add-card-lastfour').value = '';
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
  const lastFour = document.getElementById('add-card-lastfour').value.trim();
  document.getElementById('add-card-submit').disabled = !selectedProduct || lastFour.length !== 4;
}

document.getElementById('add-card-lastfour').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  validateAddCard();
});

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('add-card-modal').classList.remove('active');
});
document.getElementById('add-card-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) document.getElementById('add-card-modal').classList.remove('active');
});

document.getElementById('add-card-submit').addEventListener('click', async () => {
  if (!selectedProduct) return;
  const btn = document.getElementById('add-card-submit');
  const lastFour = document.getElementById('add-card-lastfour').value.trim();
  const balance = parseFloat(document.getElementById('add-card-balance').value) || 0;

  btn.textContent = 'Adding...';
  btn.disabled = true;

  const res = await sendMessage('ADD_CARD', { productName: selectedProduct, lastFour, balance });

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
function renderOffers(offers) {
  const list = document.getElementById('offers-list');
  const empty = document.getElementById('offers-empty');

  if (!offers.length) {
    list.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = offers.map(offer => `
    <div class="offer-card" data-offer-id="${offer._id}">
      <div class="offer-left">
        <div class="offer-icon">${offer.merchantIcon || '🏷'}</div>
        <div>
          <div class="offer-merchant">${offer.merchant}</div>
          <div class="offer-desc">${offer.description}</div>
          ${offer.expiresAt ? `<div class="offer-expiry">Expires ${formatDate(offer.expiresAt)}</div>` : ''}
        </div>
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

  document.querySelectorAll('.toggle-input, .setting-select').forEach(input => {
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

// ===== AI Recommendation =====
async function loadRecommendation() {
  const el = document.getElementById('ai-rec-body');
  const res = await sendMessage('GET_RECOMMENDATION');
  if (res.success && res.recommendation) {
    el.textContent = res.recommendation;
  } else {
    el.textContent = `Error: ${res.error || 'Unknown error'}`;
  }
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
