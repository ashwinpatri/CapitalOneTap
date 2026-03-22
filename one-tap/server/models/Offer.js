const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', default: null },
  merchant: { type: String, required: true },
  merchantIcon: { type: String, default: null },
  description: { type: String, required: true },
  discountType: {
    type: String,
    required: true,
    enum: ['percent_back', 'bonus_multiplier', 'flat_discount'],
  },
  discountValue: { type: Number, required: true },
  maxSavings: { type: Number, default: null },
  maxRedemptions: { type: Number, default: 1 },
  timesRedeemed: { type: Number, default: 0 },
  activated: { type: Boolean, default: false },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

offerSchema.index({ userId: 1, activated: 1 });
offerSchema.index({ userId: 1, expiresAt: 1 });
offerSchema.index({ merchant: 1 });

module.exports = mongoose.model('Offer', offerSchema);
