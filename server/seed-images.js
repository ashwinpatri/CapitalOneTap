require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const CardProduct = require('./models/CardProduct');

async function seedImages() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const raw = fs.readFileSync(path.join(__dirname, 'card-images.txt'), 'utf8');
  const lines = raw.split('\n');

  let updated = 0;
  for (const line of lines) {
    // Skip comments and empty lines
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const parts = line.split('|');
    if (parts.length < 2) continue;

    const name = parts[0].trim();
    const imageUrl = parts[1].trim();
    if (!name || !imageUrl) continue;

    const result = await CardProduct.findOneAndUpdate(
      { name },
      { imageUrl },
      { new: true }
    );

    if (result) {
      console.log(`  Updated: ${name}`);
      updated++;
    } else {
      console.log(`  NOT FOUND: ${name}`);
    }
  }

  console.log(`\nUpdated ${updated} card products with images`);
  await mongoose.disconnect();
  console.log('Done!');
}

seedImages().catch(err => {
  console.error('Seed images failed:', err);
  process.exit(1);
});
