// seed.js — Run once to populate Nessie with Capital One demo data
// Usage: node seed.js YOUR_NESSIE_API_KEY
//
// After running, copy the printed CUSTOMER_ID into service-worker.js

const API_KEY = process.argv[2];
const BASE = 'http://api.nessieisreal.com';

if (!API_KEY) {
  console.error('Usage: node seed.js YOUR_NESSIE_API_KEY');
  process.exit(1);
}

async function req(path, method = 'GET', body) {
  const res = await fetch(`${BASE}${path}?key=${API_KEY}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`[${method} ${path}] ${res.status}:`, JSON.stringify(json));
    throw new Error(`Nessie request failed: ${res.status}`);
  }
  return json;
}

const CARDS = [
  { nickname: 'Venture X',   rewards: 12400 },
  { nickname: 'SavorOne',    rewards: 3200  },
  { nickname: 'Quicksilver', rewards: 890   },
  { nickname: 'Venture',     rewards: 5600  },
];

const MERCHANTS = [
  { name: 'Chipotle',       category: 'dining'        },
  { name: 'Delta Airlines', category: 'travel'        },
  { name: 'Whole Foods',    category: 'groceries'     },
  { name: 'Netflix',        category: 'entertainment' },
  { name: 'Shell',          category: 'gas stations'  },
  { name: 'Amazon',         category: 'general'       },
  { name: 'Hilton Hotels',  category: 'accommodation' },
];

async function seedMerchants() {
  const results = [];
  for (const m of MERCHANTS) {
    const res = await req('/merchants', 'POST', {
      name: m.name,
      category: m.category,
      address: { street_number: '1', street_name: 'Main St', city: 'Nashville', state: 'TN', zip: '37201' },
    });
    results.push({ ...m, id: res.objectCreated._id });
    console.log(`  Merchant: ${m.name} → ${res.objectCreated._id}`);
  }
  return results;
}

async function seedPurchases(accountId, merchants) {
  for (const m of merchants) {
    for (let i = 0; i < 2; i++) {
      const amount = Math.floor(Math.random() * 80) + 20;
      const daysAgo = i * 7 + Math.floor(Math.random() * 5);
      const date = new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0];
      await req(`/accounts/${accountId}/purchases`, 'POST', {
        merchant_id: m.id,
        medium: 'balance',
        purchase_date: date,
        amount,
        status: 'pending',
        description: m.name,
      });
    }
  }
}

async function seed() {
  console.log('Creating customer...');
  const { objectCreated: customer } = await req('/customers', 'POST', {
    first_name: 'Ashwin',
    last_name: 'Demo',
    address: { street_number: '123', street_name: 'Main St', city: 'Nashville', state: 'TN', zip: '37201' },
  });
  const customerId = customer._id;
  console.log(`Customer ID: ${customerId}`);

  console.log('\nCreating merchants...');
  const merchants = await seedMerchants();

  console.log('\nCreating cards and purchases...');
  for (const card of CARDS) {
    const { objectCreated: acc } = await req(`/customers/${customerId}/accounts`, 'POST', {
      type: 'Credit Card',
      nickname: card.nickname,
      rewards: card.rewards,
      balance: 0,
    });
    console.log(`  Card: ${card.nickname} → ${acc._id}`);
    await seedPurchases(acc._id, merchants);
  }

  console.log('\n========================================');
  console.log('Seeding complete! Add this to service-worker.js:');
  console.log(`  const CUSTOMER_ID = '${customerId}';`);
  console.log('========================================');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
