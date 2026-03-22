const mongoose = require('mongoose');

const rewardTierSchema = new mongoose.Schema({
  rate: { type: Number, required: true },
  unit: { type: String, required: true, enum: ['miles', 'percent_cashback', 'points', 'percent_back'] },
  categories: { type: [String], required: true },
  qualifier: { type: String, default: null },
}, { _id: false });

const introOfferSchema = new mongoose.Schema({
  bonusAmount: { type: Number, required: true },
  bonusUnit: { type: String, required: true, enum: ['miles', 'cash', 'points'] },
  spendRequired: { type: Number, required: true },
  timeframeDays: { type: Number, required: true },
  description: { type: String, required: true },
}, { _id: false });

const cardVisualSchema = new mongoose.Schema({
  gradient: { type: String, required: true },
  textColor: { type: String, required: true },
  logoVariant: { type: String, enum: ['light', 'dark'], default: 'light' },
}, { _id: false });

const cardProductSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  network: { type: String, required: true, enum: ['visa', 'mastercard', 'amex'] },
  annualFee: { type: Number, default: 0 },
  rewardTiers: [rewardTierSchema],
  defaultIntroOffer: introOfferSchema,
  visual: cardVisualSchema,
  description: { type: String, default: null },
  imageUrl: { type: String, default: null },
  creditLevel: { type: String, enum: ['fair', 'good', 'excellent', 'good-excellent', 'rebuilding'], default: null },
  cardType: { type: String, enum: ['personal', 'business', 'partner'], default: 'personal' },
  isAvailable: { type: Boolean, default: true },
});

module.exports = mongoose.model('CardProduct', cardProductSchema);
