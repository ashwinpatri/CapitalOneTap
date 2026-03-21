const mongoose = require('mongoose');

const merchantCategorySchema = new mongoose.Schema({
  merchantPattern: { type: String, required: true, unique: true },
  category: { type: String, required: true },
});

merchantCategorySchema.index({ merchantPattern: 1 });
merchantCategorySchema.index({ category: 1 });

module.exports = mongoose.model('MerchantCategory', merchantCategorySchema);
