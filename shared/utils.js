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

  // Smart checkout total extractor — walks the DOM looking for "total" labels,
  // scores them by specificity, and returns the highest-priority / largest amount.
  extractCheckoutTotal() {
    const GRAND_LABELS = ['order total', 'grand total', 'estimated total', 'total due', 'amount due', 'total today', 'payment total', 'your total'];
    const BASIC_LABELS = ['total'];
    const SKIP_LABELS  = ['subtotal', 'item total', 'items total', 'rewards total', 'savings', 'you saved', 'discount'];

    function labelScore(text) {
      const t = text.toLowerCase();
      if (SKIP_LABELS.some(l => t.includes(l))) return 0;
      if (GRAND_LABELS.some(l => t.includes(l))) return 2;
      if (BASIC_LABELS.some(l => t.includes(l))) return 1;
      return 0;
    }

    function parseDollar(text) {
      const m = text.replace(/,/g, '').match(/\$\s*(\d+\.?\d{0,2})/);
      return m ? parseFloat(m[1]) : null;
    }

    const candidates = [];

    // Walk every element — find small nodes with "total" in their own text
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let el;
    while ((el = walker.nextNode())) {
      if (['SCRIPT','STYLE','NOSCRIPT','HEAD'].includes(el.tagName)) continue;
      if (el.children.length > 10) continue; // skip big layout containers

      // Only look at text directly owned by this node (not inherited from children)
      const ownText = Array.from(el.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent)
        .join('').trim();

      const score = labelScore(ownText);
      if (!score) continue;

      // Look for a dollar amount in this element's parent row/container
      const container = el.parentElement || el;
      const price = parseDollar(container.textContent);
      if (price && price >= 1) {
        candidates.push({ price, score });
      }
    }

    if (candidates.length > 0) {
      // Best match: highest label score first, then largest price
      // (grand total is always >= any subtotal with the same label score)
      candidates.sort((a, b) => b.score - a.score || b.price - a.price);
      return candidates[0].price;
    }

    // Regex fallback: scan full body text, skip subtotal lines, take largest
    const bodyText = document.body.innerText;
    const re = /(?:(?:order|grand|estimated|payment|total)\s+)?total[^a-z\d\n]{0,5}\$?\s*([\d,]+\.?\d{0,2})/gi;
    const found = [];
    let m;
    while ((m = re.exec(bodyText)) !== null) {
      const before = bodyText.slice(Math.max(0, m.index - 4), m.index).toLowerCase();
      if (before.endsWith('sub') || before.endsWith('item')) continue;
      const v = parseFloat(m[1].replace(/,/g, ''));
      if (v >= 1) found.push(v);
    }
    if (found.length) return Math.max(...found);

    return null;
  },

  getMerchantName() {
    const hostname = window.location.hostname.replace('www.', '');
    const parts = hostname.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  },
};
