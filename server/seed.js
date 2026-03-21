require('dotenv').config();
const mongoose = require('mongoose');
const CardProduct = require('./models/CardProduct');
const MerchantCategory = require('./models/MerchantCategory');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing seed data
  await CardProduct.deleteMany({});
  await MerchantCategory.deleteMany({});

  // ===== Card Products =====
  const products = [
    {
      name: 'Venture X',
      network: 'visa',
      annualFee: 395,
      rewardTiers: [
        { rate: 10, unit: 'miles', categories: ['hotels', 'car-rental'], qualifier: 'via Capital One Travel' },
        { rate: 5, unit: 'miles', categories: ['flights'], qualifier: 'via Capital One Travel' },
        { rate: 2, unit: 'miles', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 75000, bonusUnit: 'miles', spendRequired: 4000, timeframeDays: 90,
        description: 'Earn 75,000 bonus miles after spending $4,000 in the first 3 months',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: 'Premium travel rewards card with airport lounge access',
    },
    {
      name: 'SavorOne',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 3, unit: 'percent_cashback', categories: ['dining', 'entertainment', 'streaming', 'groceries'], qualifier: null },
        { rate: 1, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 200, bonusUnit: 'cash', spendRequired: 500, timeframeDays: 90,
        description: 'Earn $200 cash bonus after spending $500 in the first 3 months',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: 'Cash back on dining, entertainment, streaming, and groceries',
    },
    {
      name: 'Quicksilver',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 1.5, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 200, bonusUnit: 'cash', spendRequired: 500, timeframeDays: 90,
        description: 'Earn $200 cash bonus after spending $500 in the first 3 months',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 50%, #808080 100%)',
        textColor: '#1A1A1A', logoVariant: 'dark',
      },
      description: 'Unlimited 1.5% cash back on every purchase',
    },
    {
      name: 'Venture',
      network: 'visa',
      annualFee: 95,
      rewardTiers: [
        { rate: 5, unit: 'miles', categories: ['hotels', 'car-rental'], qualifier: 'via Capital One Travel' },
        { rate: 2, unit: 'miles', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 75000, bonusUnit: 'miles', spendRequired: 4000, timeframeDays: 90,
        description: 'Earn 75,000 bonus miles after spending $4,000 in the first 3 months',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #004977 0%, #003557 50%, #002840 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: 'Travel rewards with 2x miles on every purchase',
    },
    {
      name: 'Savor',
      network: 'mastercard',
      annualFee: 95,
      rewardTiers: [
        { rate: 4, unit: 'percent_cashback', categories: ['dining', 'entertainment'], qualifier: null },
        { rate: 3, unit: 'percent_cashback', categories: ['streaming', 'groceries'], qualifier: null },
        { rate: 1, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 300, bonusUnit: 'cash', spendRequired: 3000, timeframeDays: 90,
        description: 'Earn $300 cash bonus after spending $3,000 in the first 3 months',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #333333 50%, #0d0d0d 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: 'Premium dining and entertainment cash back card',
    },
    {
      name: 'Platinum',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 1, unit: 'points', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'points', spendRequired: 0, timeframeDays: 0,
        description: 'No intro offer — 0% intro APR for 15 months',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 50%, #b8b8b8 100%)',
        textColor: '#1A1A1A', logoVariant: 'dark',
      },
      description: 'Low-interest card with 0% intro APR',
    },
  ];

  await CardProduct.insertMany(products);
  console.log(`Seeded ${products.length} card products`);

  // ===== Merchant Categories =====
  const merchants = [
    // Dining
    { merchantPattern: 'chipotle', category: 'dining' },
    { merchantPattern: 'mcdonald', category: 'dining' },
    { merchantPattern: 'starbucks', category: 'dining' },
    { merchantPattern: 'doordash', category: 'dining' },
    { merchantPattern: 'ubereats', category: 'dining' },
    { merchantPattern: 'grubhub', category: 'dining' },
    { merchantPattern: 'dominos', category: 'dining' },
    { merchantPattern: 'subway', category: 'dining' },
    { merchantPattern: 'restaurant', category: 'dining' },
    { merchantPattern: 'cafe', category: 'dining' },
    { merchantPattern: 'pizza', category: 'dining' },
    { merchantPattern: 'sushi', category: 'dining' },
    { merchantPattern: 'wendys', category: 'dining' },
    { merchantPattern: 'chickfila', category: 'dining' },
    { merchantPattern: 'panera', category: 'dining' },
    // Groceries
    { merchantPattern: 'wholefood', category: 'groceries' },
    { merchantPattern: 'kroger', category: 'groceries' },
    { merchantPattern: 'walmart', category: 'groceries' },
    { merchantPattern: 'target', category: 'groceries' },
    { merchantPattern: 'costco', category: 'groceries' },
    { merchantPattern: 'trader', category: 'groceries' },
    { merchantPattern: 'aldi', category: 'groceries' },
    { merchantPattern: 'publix', category: 'groceries' },
    { merchantPattern: 'safeway', category: 'groceries' },
    // Flights
    { merchantPattern: 'delta', category: 'flights' },
    { merchantPattern: 'united', category: 'flights' },
    { merchantPattern: 'american airlines', category: 'flights' },
    { merchantPattern: 'southwest', category: 'flights' },
    { merchantPattern: 'jetblue', category: 'flights' },
    { merchantPattern: 'spirit', category: 'flights' },
    { merchantPattern: 'frontier', category: 'flights' },
    { merchantPattern: 'airline', category: 'flights' },
    { merchantPattern: 'flight', category: 'flights' },
    // Hotels
    { merchantPattern: 'marriott', category: 'hotels' },
    { merchantPattern: 'hilton', category: 'hotels' },
    { merchantPattern: 'hyatt', category: 'hotels' },
    { merchantPattern: 'airbnb', category: 'hotels' },
    { merchantPattern: 'booking', category: 'hotels' },
    { merchantPattern: 'expedia', category: 'hotels' },
    // Car Rental
    { merchantPattern: 'hertz', category: 'car-rental' },
    { merchantPattern: 'enterprise', category: 'car-rental' },
    { merchantPattern: 'avis', category: 'car-rental' },
    // Streaming
    { merchantPattern: 'netflix', category: 'streaming' },
    { merchantPattern: 'spotify', category: 'streaming' },
    { merchantPattern: 'hulu', category: 'streaming' },
    { merchantPattern: 'disney', category: 'streaming' },
    { merchantPattern: 'hbo', category: 'streaming' },
    { merchantPattern: 'youtube', category: 'streaming' },
    { merchantPattern: 'appletv', category: 'streaming' },
    // Entertainment
    { merchantPattern: 'amc', category: 'entertainment' },
    { merchantPattern: 'cinema', category: 'entertainment' },
    { merchantPattern: 'concert', category: 'entertainment' },
    { merchantPattern: 'ticketmaster', category: 'entertainment' },
    // Gas/Transit
    { merchantPattern: 'shell', category: 'gas' },
    { merchantPattern: 'exxon', category: 'gas' },
    { merchantPattern: 'chevron', category: 'gas' },
    { merchantPattern: 'bpgas', category: 'gas' },
    { merchantPattern: 'uber', category: 'transit' },
    { merchantPattern: 'lyft', category: 'transit' },
  ];

  await MerchantCategory.insertMany(merchants);
  console.log(`Seeded ${merchants.length} merchant categories`);

  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
