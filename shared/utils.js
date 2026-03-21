// Shared utility functions
const OneTapUtils = {
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const dayMs = 86400000;

    if (diff < dayMs && date.getDate() === now.getDate()) return 'Today';
    if (diff < 2 * dayMs) return 'Yesterday';
    if (diff < 7 * dayMs) return date.toLocaleDateString('en-US', { weekday: 'long' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  calculateRewards(amount, rate, unit) {
    const earned = Math.round(amount * rate);
    return { earned, display: `${earned.toLocaleString()} ${unit}` };
  },

  extractPrice(text) {
    if (!text) return null;
    const match = text.replace(/,/g, '').match(/\$?([\d]+\.?\d{0,2})/);
    return match ? parseFloat(match[1]) : null;
  },

  getMerchantName() {
    const hostname = window.location.hostname.replace('www.', '');
    const parts = hostname.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  },
};
