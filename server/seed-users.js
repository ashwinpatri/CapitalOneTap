// seed-users.js — Creates demo users in MongoDB and seeds offers
// Usage: node seed-users.js
// Requires .env to be configured first

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = mongoose.model('User', new mongoose.Schema({
  username:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
}));

const Offer = mongoose.model('Offer', new mongoose.Schema({
  merchant:     String,
  merchantIcon: String,
  description:  String,
  discount:     Number,
  maxSavings:   Number,
  expiresAt:    String,
  cardId:       String,
  activated:    { type: Boolean, default: false },
}));

// ── Demo users ──────────────────────────────────────────────────────────────
// Replace customerId with the value printed by seed.js after running it
const DEMO_USERS = [
  {
    username: 'ashwin.demo',
    password: 'CapitalOne1!',
    firstName: 'Ashwin',
    lastName: 'Demo',
  },
];

// ── Offers (seeded once, shared across all users) ────────────────────────────
const DEMO_OFFERS = [
  { merchant: 'Amazon',         merchantIcon: '📦', description: '10% back on your next purchase',      discount: 0.10, maxSavings: 15.00,  expiresAt: '2026-07-15', cardId: 'venture-x',  activated: true  },
  { merchant: 'Uber Eats',      merchantIcon: '🍔', description: '5x miles on delivery orders',         discount: 0.05, maxSavings: 10.00,  expiresAt: '2026-07-01', cardId: 'venture-x',  activated: false },
  { merchant: 'DoorDash',       merchantIcon: '🚗', description: '20% off your first 3 orders',         discount: 0.20, maxSavings: 25.00,  expiresAt: '2026-06-30', cardId: 'savor-one',  activated: false },
  { merchant: 'Target',         merchantIcon: '🎯', description: '3x points on all purchases',          discount: 0.03, maxSavings: 20.00,  expiresAt: '2026-07-20', cardId: 'quicksilver',activated: true  },
  { merchant: 'Whole Foods',    merchantIcon: '🥑', description: '5% back on groceries',                discount: 0.05, maxSavings: 12.00,  expiresAt: '2026-07-10', cardId: 'savor-one',  activated: false },
  { merchant: 'Netflix',        merchantIcon: '🎬', description: '3 months of 3x rewards on streaming', discount: 0.03, maxSavings: 5.00,   expiresAt: '2026-09-01', cardId: 'savor-one',  activated: true  },
  { merchant: 'Delta Airlines', merchantIcon: '✈️', description: '10x miles on flights',                discount: 0.10, maxSavings: 100.00, expiresAt: '2026-08-15', cardId: 'venture-x',  activated: false },
  { merchant: 'Hilton Hotels',  merchantIcon: '🏨', description: '8x miles on hotel bookings',          discount: 0.08, maxSavings: 80.00,  expiresAt: '2026-08-01', cardId: 'venture',    activated: false },
  { merchant: 'Starbucks',      merchantIcon: '☕', description: '$5 back on your next 3 visits',        discount: 0.10, maxSavings: 5.00,   expiresAt: '2026-06-15', cardId: 'savor',      activated: false },
  { merchant: 'Hertz',          merchantIcon: '🚙', description: '3x miles on car rentals this month',  discount: 0.03, maxSavings: 30.00,  expiresAt: '2026-07-31', cardId: 'venture-one',activated: false },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  // Upsert users
  console.log('\nSeeding users...');
  for (const u of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await User.findOneAndUpdate(
      { username: u.username },
      { username: u.username, passwordHash, firstName: u.firstName, lastName: u.lastName },
      { upsert: true, new: true }
    );
    console.log(`  ✓ ${u.username} (${u.firstName} ${u.lastName})`);
  }

  // Seed offers (only if collection is empty)
  const existingOffers = await Offer.countDocuments();
  if (existingOffers === 0) {
    console.log('\nSeeding offers...');
    await Offer.insertMany(DEMO_OFFERS);
    console.log(`  ✓ ${DEMO_OFFERS.length} offers inserted`);
  } else {
    console.log(`\nOffers already seeded (${existingOffers} found), skipping`);
  }

  console.log('\n========================================');
  console.log('Done! Demo credentials:');
  DEMO_USERS.forEach(u => console.log(`  ${u.username} / ${u.password}`));
  console.log('========================================');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
