// seed-demo-user.js — adds a demo user with cards, offers, and transactions
// Safe to re-run: skips if user already exists
// Usage: node seed-demo-user.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Card = require('./models/Card');
const CardProduct = require('./models/CardProduct');
const Offer = require('./models/Offer');
const Transaction = require('./models/Transaction');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // ── Skip if user already exists ──────────────────────────────────────────
  const existing = await User.findOne({ username: 'Thomas' });
  if (existing) {
    console.log('User "Thomas" already exists — skipping');
    await mongoose.disconnect();
    return;
  }

  // ── Create user ──────────────────────────────────────────────────────────
  const user = new User({
    username: 'Thomas',
    email: 'thomas@vanderbilt.edu',
    passwordHash: 'Thomas', // pre-save hook hashes this
    firstName: 'Thomas',
    lastName: 'Hung',
  });
  await user.save();
  console.log(`Created user: ${user.username} (${user._id})`);

  // ── Look up card product templates ───────────────────────────────────────
  const ventureX = await CardProduct.findOne({ name: 'Venture X' });
  const savorOne = await CardProduct.findOne({ name: 'SavorOne' });

  if (!ventureX || !savorOne) {
    console.error('CardProducts not found — run "npm run seed" first');
    await mongoose.disconnect();
    process.exit(1);
  }

  // ── Create cards ─────────────────────────────────────────────────────────
  const card1 = new Card({
    userId: user._id,
    productName: ventureX.name,
    lastFour: '3892',
    network: ventureX.network,
    annualFee: ventureX.annualFee,
    rewardTiers: ventureX.rewardTiers,
    introOffer: ventureX.defaultIntroOffer
      ? { ...ventureX.defaultIntroOffer.toObject(), startDate: new Date(), amountSpent: 2100, earned: false }
      : null,
    visual: ventureX.visual,
    balance: 842.50,
    rewardsBalance: 14200,
    isDefault: true,
  });
  await card1.save();
  console.log(`Created card: Venture X (${card1._id})`);

  const card2 = new Card({
    userId: user._id,
    productName: savorOne.name,
    lastFour: '5517',
    network: savorOne.network,
    annualFee: savorOne.annualFee,
    rewardTiers: savorOne.rewardTiers,
    introOffer: savorOne.defaultIntroOffer
      ? { ...savorOne.defaultIntroOffer.toObject(), startDate: new Date(), amountSpent: 380, earned: false }
      : null,
    visual: savorOne.visual,
    balance: 215.75,
    rewardsBalance: 0,
    isDefault: false,
  });
  await card2.save();
  console.log(`Created card: SavorOne (${card2._id})`);

  // ── Create offers ─────────────────────────────────────────────────────────
  const offers = [
    {
      userId: user._id,
      cardId: card1._id,
      merchant: 'Delta Airlines',
      merchantIcon: '✈️',
      description: '10x miles on your next Delta flight',
      discountType: 'bonus_multiplier',
      discountValue: 10,
      maxSavings: null,
      maxRedemptions: 1,
      activated: false,
      expiresAt: new Date('2026-08-01'),
    },
    {
      userId: user._id,
      cardId: card1._id,
      merchant: 'Hilton Hotels',
      merchantIcon: '🏨',
      description: '5x miles on hotel stays this summer',
      discountType: 'bonus_multiplier',
      discountValue: 5,
      maxSavings: null,
      maxRedemptions: 2,
      activated: true,
      expiresAt: new Date('2026-09-15'),
    },
    {
      userId: user._id,
      cardId: card2._id,
      merchant: 'DoorDash',
      merchantIcon: '🚗',
      description: '5% back on your next 3 DoorDash orders',
      discountType: 'percent_back',
      discountValue: 5,
      maxSavings: 20,
      maxRedemptions: 3,
      activated: false,
      expiresAt: new Date('2026-07-01'),
    },
    {
      userId: user._id,
      cardId: card2._id,
      merchant: 'Spotify',
      merchantIcon: '🎵',
      description: '3 months of 3x cash back on streaming',
      discountType: 'bonus_multiplier',
      discountValue: 3,
      maxSavings: null,
      maxRedemptions: 3,
      activated: true,
      expiresAt: new Date('2026-06-30'),
    },
  ];
  await Offer.insertMany(offers);
  console.log(`Created ${offers.length} offers`);

  // ── Create transactions ───────────────────────────────────────────────────
  const daysAgo = n => new Date(Date.now() - n * 86400000);

  const transactions = [
    {
      userId: user._id, cardId: card1._id,
      merchant: 'Delta Airlines', merchantCategory: 'flights',
      amount: 412.00, rewardsEarned: 2060, rewardUnit: 'miles',
      rewardTierUsed: { rate: 5, categories: ['flights'] },
      status: 'completed', confirmationNumber: 'CO-DELTA01', date: daysAgo(2),
    },
    {
      userId: user._id, cardId: card1._id,
      merchant: 'Hilton Hotels', merchantCategory: 'hotels',
      amount: 289.00, rewardsEarned: 2890, rewardUnit: 'miles',
      rewardTierUsed: { rate: 10, categories: ['hotels', 'car-rental'] },
      status: 'completed', confirmationNumber: 'CO-HILTON01', date: daysAgo(5),
    },
    {
      userId: user._id, cardId: card1._id,
      merchant: 'Amazon', merchantCategory: 'general',
      amount: 67.49, rewardsEarned: 135, rewardUnit: 'miles',
      rewardTierUsed: { rate: 2, categories: ['everything'] },
      status: 'completed', confirmationNumber: 'CO-AMZN01', date: daysAgo(8),
    },
    {
      userId: user._id, cardId: card2._id,
      merchant: 'Chipotle', merchantCategory: 'dining',
      amount: 13.85, rewardsEarned: 0.42, rewardUnit: 'cash back',
      rewardTierUsed: { rate: 3, categories: ['dining', 'entertainment', 'streaming', 'groceries'] },
      status: 'completed', confirmationNumber: 'CO-CHIP01', date: daysAgo(3),
    },
    {
      userId: user._id, cardId: card2._id,
      merchant: 'Whole Foods', merchantCategory: 'groceries',
      amount: 94.22, rewardsEarned: 2.83, rewardUnit: 'cash back',
      rewardTierUsed: { rate: 3, categories: ['dining', 'entertainment', 'streaming', 'groceries'] },
      status: 'completed', confirmationNumber: 'CO-WF01', date: daysAgo(6),
    },
    {
      userId: user._id, cardId: card2._id,
      merchant: 'Netflix', merchantCategory: 'streaming',
      amount: 15.99, rewardsEarned: 0.48, rewardUnit: 'cash back',
      rewardTierUsed: { rate: 3, categories: ['dining', 'entertainment', 'streaming', 'groceries'] },
      status: 'completed', confirmationNumber: 'CO-NFLX01', date: daysAgo(10),
    },
    {
      userId: user._id, cardId: card2._id,
      merchant: 'Starbucks', merchantCategory: 'dining',
      amount: 8.75, rewardsEarned: 0.26, rewardUnit: 'cash back',
      rewardTierUsed: { rate: 3, categories: ['dining', 'entertainment', 'streaming', 'groceries'] },
      status: 'completed', confirmationNumber: 'CO-SBUX01', date: daysAgo(12),
    },
  ];
  await Transaction.insertMany(transactions);
  console.log(`Created ${transactions.length} transactions`);

  console.log('\n========================================');
  console.log('Done! Login with:');
  console.log('  Username: Thomas');
  console.log('  Password: Thomas');
  console.log('========================================');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
