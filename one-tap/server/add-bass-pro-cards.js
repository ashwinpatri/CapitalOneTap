// add-bass-pro-cards.js — adds Bass Pro cards to Thomas's account
// Usage: node add-bass-pro-cards.js

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Card = require('./models/Card');
const CardProduct = require('./models/CardProduct');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const user = await User.findOne({ username: 'Thomas' });
  if (!user) { console.error('Thomas not found'); process.exit(1); }
  console.log(`Found user: ${user.username} (${user._id})`);

  // Normalize unit values from CardProduct to what Card schema accepts
  function normalizeTiers(tiers) {
    return tiers.map(t => ({
      ...t.toObject ? t.toObject() : t,
      unit: t.unit === 'percent_back' ? 'percent_cashback' : t.unit,
    }));
  }

  const clubCard = await CardProduct.findOne({ name: 'Bass Pro Shops CLUB Card' });
  const bizCard  = await CardProduct.findOne({ name: "Bass Pro Shops & Cabela's CLUB Business" });

  if (!clubCard || !bizCard) {
    console.error('Bass Pro CardProducts not found — check your CardProduct collection');
    process.exit(1);
  }

  const card1 = new Card({
    userId: user._id,
    productName: clubCard.name,
    lastFour: '4471',
    network: clubCard.network,
    annualFee: clubCard.annualFee,
    rewardTiers: normalizeTiers(clubCard.rewardTiers),
    introOffer: clubCard.defaultIntroOffer
      ? { ...clubCard.defaultIntroOffer.toObject(), startDate: new Date(), amountSpent: 0, earned: false }
      : null,
    visual: clubCard.visual,
    balance: 0,
    rewardsBalance: 0,
    isDefault: false,
  });
  await card1.save();
  console.log(`Created card: ${clubCard.name} (${card1._id})`);

  const card2 = new Card({
    userId: user._id,
    productName: bizCard.name,
    lastFour: '8823',
    network: bizCard.network,
    annualFee: bizCard.annualFee,
    rewardTiers: normalizeTiers(bizCard.rewardTiers),
    introOffer: bizCard.defaultIntroOffer
      ? { ...bizCard.defaultIntroOffer.toObject(), startDate: new Date(), amountSpent: 0, earned: false }
      : null,
    visual: bizCard.visual,
    balance: 0,
    rewardsBalance: 0,
    isDefault: false,
  });
  await card2.save();
  console.log(`Created card: ${bizCard.name} (${card2._id})`);

  console.log('\nDone!');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
