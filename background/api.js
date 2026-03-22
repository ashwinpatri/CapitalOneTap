// MongoDB API client
const API_BASE = 'https://onetap-api.onrender.com/api';

// Get stored auth token
async function getToken() {
  const data = await chrome.storage.local.get('authToken');
  return data.authToken || null;
}

async function setToken(token) {
  await chrome.storage.local.set({ authToken: token });
}

async function clearToken() {
  await chrome.storage.local.remove('authToken');
}

// Authenticated fetch wrapper
async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    await clearToken();
    throw new Error('Not authenticated');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

// ===== Auth =====
export async function register(username, email, password, firstName, lastName) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, firstName, lastName }),
  });
  await setToken(data.token);
  await chrome.storage.local.set({ user: data.user });
  return data;
}

export async function login(username, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  await setToken(data.token);
  await chrome.storage.local.set({ user: data.user });
  return data;
}

export async function getMe() {
  return apiFetch('/auth/me');
}

export async function isLoggedIn() {
  const token = await getToken();
  if (!token) return false;
  try {
    await getMe();
    return true;
  } catch {
    return false;
  }
}

export async function logout() {
  await clearToken();
  await chrome.storage.local.remove('user');
}

// ===== Cards =====
export async function fetchCards() {
  const data = await apiFetch('/cards');
  return data.cards;
}

export async function addCard(productName, lastFour, balance, fullNumber, expMonth, expYear, cvv, cardholderName) {
  const data = await apiFetch('/cards', {
    method: 'POST',
    body: JSON.stringify({ productName, lastFour, balance, fullNumber, expMonth, expYear, cvv, cardholderName }),
  });
  return data;
}

export async function editCard(cardId, updates) {
  const data = await apiFetch(`/cards/${cardId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data;
}

export async function deleteCard(cardId) {
  const data = await apiFetch(`/cards/${cardId}`, { method: 'DELETE' });
  return data;
}

export async function setDefaultCard(cardId) {
  const data = await apiFetch(`/cards/${cardId}/default`, { method: 'PUT' });
  return data;
}

export async function fetchCardProducts() {
  const data = await apiFetch('/cards/products');
  return data.products;
}

// ===== Transactions =====
export async function fetchTransactions(limit = 50) {
  const data = await apiFetch(`/transactions?limit=${limit}`);
  return data.transactions;
}

export async function createTransaction(cardId, merchant, amount) {
  const data = await apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify({ cardId, merchant, amount }),
  });
  return data;
}

// ===== Offers =====
export async function fetchOffers() {
  const data = await apiFetch('/offers');
  return data.offers;
}

export async function activateOffer(offerId) {
  const data = await apiFetch(`/offers/${offerId}/activate`, { method: 'PUT' });
  return data;
}

// ===== Settings =====
export async function updateSettings(settings) {
  const data = await apiFetch('/auth/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  return data;
}
