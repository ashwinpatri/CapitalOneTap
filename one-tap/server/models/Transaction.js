const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  merchant: { type: String, required: true },
  merchantCategory: { type: String, default: 'general' },
  amount: { type: Number, required: true, min: 0 },
  rewardsEarned: { type: Number, required: true },
  rewardUnit: { type: String, required: true, enum: ['miles', 'cash back', 'points'] },
  rewardTierUsed: {
    rate: Number,
    categories: [String],
  },
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', default: null },
  status: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
  confirmationNumber: { type: String, default: null },
  date: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ cardId: 1, date: -1 });
transactionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
