const mongoose = require('mongoose');

const rewardTierSchema = new mongoose.Schema({
  rate: { type: Number, required: true },
  unit: { type: String, required: true, enum: ['miles', 'percent_cashback', 'points'] },
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
  network: { type: String, required: true, enum: ['visa', 'mastercard', 'amex'] },
  annualFee: { type: Number, default: 0 },
  rewardTiers: {
    type: [rewardTierSchema],
    required: true,
    validate: {
      validator: function (tiers) {
        return tiers.length > 0 && tiers[tiers.length - 1].categories.includes('everything');
      },
      message: 'Must have at least one tier with a catch-all "everything" tier last.',
    },
  },
  introOffer: { type: introOfferSchema, default: null },
  visual: { type: cardVisualSchema, required: true },
  balance: { type: Number, default: 0 },
  rewardsBalance: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

cardSchema.index({ userId: 1, isActive: 1 });
cardSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model('Card', cardSchema);
