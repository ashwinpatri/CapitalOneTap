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
  startDate: { type: Date, default: null },
  amountSpent: { type: Number, default: 0 },
  earned: { type: Boolean, default: false },
}, { _id: false });

const cardVisualSchema = new mongoose.Schema({
  gradient: { type: String, required: true },
  textColor: { type: String, required: true },
  logoVariant: { type: String, enum: ['light', 'dark'], default: 'light' },
}, { _id: false });

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productName: { type: String, required: true },
  nickname: { type: String, default: null },
  lastFour: { type: String, required: true, match: /^\d{4}$/ },
  fullNumber: { type: String, default: null },
  expMonth: { type: String, default: null },
  expYear: { type: String, default: null },
  cvv: { type: String, default: null },
  cardholderName: { type: String, default: null },
  network: { type: String, required: true, enum: ['visa', 'mastercard', 'amex'] },
  annualFee: { type: Number, default: 0 },
  rewardTiers: {
    type: [rewardTierSchema],
    default: [],
  },
  introOffer: { type: introOfferSchema, default: null },
  visual: { type: cardVisualSchema, required: true },
  imageUrl: { type: String, default: null },
  balance: { type: Number, default: 0 },
  rewardsBalance: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

cardSchema.index({ userId: 1, isActive: 1 });
cardSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model('Card', cardSchema);
