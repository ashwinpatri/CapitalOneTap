// seed-bob.js — adds Bob with 5 cards, 20 transactions, 3 offers
// Safe to re-run: skips if user already exists
// Usage: node seed-bob.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Card = require('./models/Card');
const CardProduct = require('./models/CardProduct');
const Offer = require('./models/Offer');
const Transaction = require('./models/Transaction');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username: 'Bob' });
  if (existing) {
    console.log('User "Bob" already exists — skipping');
    await mongoose.disconnect();
    return;
  }

  // ── Create user ──────────────────────────────────────────────────────────
  const user = new User({
    username: 'Bob',
    email: 'bob@example.com',
    passwordHash: 'Bob',
    firstName: 'Bob',
    lastName: 'Johnson',
  });
  await user.save();
  console.log(`Created user: ${user.username} (${user._id})`);

  // ── Look up card product ──────────────────────────────────────────────────
  const quicksilver = await CardProduct.findOne({ name: 'Quicksilver Rewards' });
  if (!quicksilver) {
    console.error('CardProduct "Quicksilver Rewards" not found — run "npm run seed" first');
    await mongoose.disconnect();
    process.exit(1);
  }

  // ── Create card (one card, no annual fee) ────────────────────────────────
  const card = new Card({
    userId: user._id,
    productName: quicksilver.name,
    lastFour: '4421',
    network: quicksilver.network,
    annualFee: quicksilver.annualFee,
    rewardTiers: quicksilver.rewardTiers,
    visual: quicksilver.visual,
    balance: 312.40,
    rewardsBalance: 0,
    isDefault: true,
  });
  await card.save();
  console.log(`Created card: Quicksilver Rewards (${card._id})`);

  // ── Create offers ─────────────────────────────────────────────────────────
  const offers = [
    {
      userId: user._id,
      cardId: card._id,
      merchant: 'Chipotle',
      merchantIcon: '🌯',
      description: '5% back on your next 3 Chipotle orders',
      discountType: 'percent_back',
      discountValue: 5,
      maxSavings: 15,
      maxRedemptions: 3,
      activated: false,
      expiresAt: new Date('2026-07-31'),
    },
    {
      userId: user._id,
      cardId: card._id,
      merchant: 'Target',
      merchantIcon: '🎯',
      description: '$10 back on a $50+ purchase at Target',
      discountType: 'flat_discount',
      discountValue: 10,
      maxSavings: 10,
      maxRedemptions: 1,
      activated: true,
      expiresAt: new Date('2026-06-30'),
    },
    {
      userId: user._id,
      cardId: card._id,
      merchant: 'Spotify',
      merchantIcon: '🎵',
      description: '3 months of 3x cash back on streaming subscriptions',
      discountType: 'bonus_multiplier',
      discountValue: 3,
      maxSavings: null,
      maxRedemptions: 3,
      activated: false,
      expiresAt: new Date('2026-08-31'),
    },
  ];
  await Offer.insertMany(offers);
  console.log(`Created ${offers.length} offers`);

  // ── Create transactions (all on the one Quicksilver card, 1.5% back) ─────
  const daysAgo = n => new Date(Date.now() - n * 86400000);
  const qs = { rate: 1.5, categories: ['everything'] };

  const transactions = [
    { userId: user._id, cardId: card._id, merchant: 'Kroger',          merchantCategory: 'groceries',     amount: 87.42,  rewardsEarned: 1.31, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-KRG01',   date: daysAgo(2)  },
    { userId: user._id, cardId: card._id, merchant: "Trader Joe's",     merchantCategory: 'groceries',     amount: 64.18,  rewardsEarned: 0.96, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-TJ01',    date: daysAgo(9)  },
    { userId: user._id, cardId: card._id, merchant: 'Whole Foods',      merchantCategory: 'groceries',     amount: 112.55, rewardsEarned: 1.69, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-WF01',    date: daysAgo(16) },
    { userId: user._id, cardId: card._id, merchant: 'Publix',           merchantCategory: 'groceries',     amount: 73.90,  rewardsEarned: 1.11, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-PBX01',   date: daysAgo(23) },
    { userId: user._id, cardId: card._id, merchant: 'Chick-fil-A',      merchantCategory: 'dining',        amount: 18.45,  rewardsEarned: 0.28, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-CFA01',   date: daysAgo(4)  },
    { userId: user._id, cardId: card._id, merchant: 'Olive Garden',     merchantCategory: 'dining',        amount: 54.20,  rewardsEarned: 0.81, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-OG01',    date: daysAgo(11) },
    { userId: user._id, cardId: card._id, merchant: 'DoorDash',         merchantCategory: 'dining',        amount: 32.75,  rewardsEarned: 0.49, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-DD01',    date: daysAgo(14) },
    { userId: user._id, cardId: card._id, merchant: "McDonald's",       merchantCategory: 'dining',        amount: 11.30,  rewardsEarned: 0.17, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-MCD01',   date: daysAgo(19) },
    { userId: user._id, cardId: card._id, merchant: 'AMC Theatres',     merchantCategory: 'entertainment', amount: 38.00,  rewardsEarned: 0.57, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-AMC01',   date: daysAgo(7)  },
    { userId: user._id, cardId: card._id, merchant: "Dave & Buster's",  merchantCategory: 'entertainment', amount: 65.00,  rewardsEarned: 0.98, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-DB01',    date: daysAgo(21) },
    { userId: user._id, cardId: card._id, merchant: 'Netflix',          merchantCategory: 'streaming',     amount: 15.99,  rewardsEarned: 0.24, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-NFLX01',  date: daysAgo(3)  },
    { userId: user._id, cardId: card._id, merchant: 'Spotify',          merchantCategory: 'streaming',     amount: 9.99,   rewardsEarned: 0.15, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-SPTY01',  date: daysAgo(10) },
    { userId: user._id, cardId: card._id, merchant: 'Hulu',             merchantCategory: 'streaming',     amount: 17.99,  rewardsEarned: 0.27, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-HULU01',  date: daysAgo(17) },
    { userId: user._id, cardId: card._id, merchant: 'Target',           merchantCategory: 'general',       amount: 94.30,  rewardsEarned: 1.41, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-TGT01',   date: daysAgo(6)  },
    { userId: user._id, cardId: card._id, merchant: 'Amazon',           merchantCategory: 'general',       amount: 47.99,  rewardsEarned: 0.72, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-AMZ01',   date: daysAgo(13) },
    { userId: user._id, cardId: card._id, merchant: 'Best Buy',         merchantCategory: 'general',       amount: 159.99, rewardsEarned: 2.40, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-BBY01',   date: daysAgo(20) },
    { userId: user._id, cardId: card._id, merchant: 'Shell',            merchantCategory: 'gas',           amount: 58.40,  rewardsEarned: 0.88, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-SHELL01', date: daysAgo(5)  },
    { userId: user._id, cardId: card._id, merchant: 'Exxon',            merchantCategory: 'gas',           amount: 51.20,  rewardsEarned: 0.77, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-EXX01',   date: daysAgo(18) },
    { userId: user._id, cardId: card._id, merchant: 'United Airlines',  merchantCategory: 'flights',       amount: 286.00, rewardsEarned: 4.29, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-UAL01',   date: daysAgo(25) },
    { userId: user._id, cardId: card._id, merchant: 'Marriott',         merchantCategory: 'hotels',        amount: 198.50, rewardsEarned: 2.98, rewardUnit: 'cash back', rewardTierUsed: qs, status: 'completed', confirmationNumber: 'CO-MAR01',   date: daysAgo(27) },
  ];

  await Transaction.insertMany(transactions);
  console.log(`Created ${transactions.length} transactions`);

  console.log('\n========================================');
  console.log('Done! Login with:');
  console.log('  Username: Bob');
  console.log('  Password: Bob');
  console.log('========================================');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
