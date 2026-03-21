// One Tap Popup — Dashboard UI
document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupTabs();
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
}

function sendMessage(type, payload = {}) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type, payload }, resolve);
  });
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
  carousel.innerHTML = cards.map(card => `
    <div class="card-visual" style="background: ${card.gradient}; color: ${card.textColor}">
      <div class="card-visual-top">
        <div>
          <div class="card-visual-name">${card.name}</div>
          <div class="card-visual-type">${card.type}</div>
        </div>
        ${card.isDefault ? '<div class="card-visual-default">Default</div>' : ''}
      </div>
      <div class="card-visual-number">&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; ${card.lastFour}</div>
      <div class="card-visual-bottom">
        <div class="card-visual-reward">${card.bonusRate}x ${card.rewardUnit} on ${card.categories[0]}</div>
        <div class="card-visual-logo">Capital One</div>
      </div>
    </div>
  `).join('');
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

// ===== Offers =====
function renderOffers(offers) {
  const list = document.getElementById('offers-list');
  list.innerHTML = offers.map(offer => `
    <div class="offer-card" data-offer-id="${offer.id}">
      <div class="offer-left">
        <div class="offer-icon">${offer.merchantIcon}</div>
        <div>
          <div class="offer-merchant">${offer.merchant}</div>
          <div class="offer-desc">${offer.description}</div>
          <div class="offer-expiry">Expires ${formatDate(offer.expiresAt)}</div>
        </div>
      </div>
      <button class="offer-btn ${offer.activated ? 'offer-btn-activated' : 'offer-btn-activate'}">
        ${offer.activated ? 'Active' : 'Activate'}
      </button>
    </div>
  `).join('');

  // Activate button handlers
  list.querySelectorAll('.offer-btn-activate').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = 'Active';
      btn.classList.remove('offer-btn-activate');
      btn.classList.add('offer-btn-activated');
    });
  });
}

// ===== Activity =====
function renderActivity(transactions, cards) {
  const list = document.getElementById('activity-list');
  const cardMap = Object.fromEntries(cards.map(c => [c.id, c]));

  list.innerHTML = transactions.map(tx => {
    const card = cardMap[tx.cardId];
    const dotColor = card ? card.gradient.match(/#[a-fA-F0-9]{6}/)?.[0] || '#004977' : '#004977';
    return `
      <div class="activity-item">
        <div class="activity-left">
          <div class="activity-dot" style="background: ${dotColor}"></div>
          <div>
            <div class="activity-merchant">${tx.merchant}</div>
            <div class="activity-card">${card ? card.name : ''} &bull;&bull;${card ? card.lastFour : ''}</div>
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
  document.getElementById('setting-autodetect').checked = settings.autoDetect;
  document.getElementById('setting-floating').checked = settings.showFloatingButton;
  document.getElementById('setting-notifications').checked = settings.notifications;

  const select = document.getElementById('setting-default-card');
  select.innerHTML = cards.map(c =>
    `<option value="${c.id}" ${c.id === settings.defaultCardId ? 'selected' : ''}>${c.name}</option>`
  ).join('');

  // Save on change
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
