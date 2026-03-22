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
    // ===== Personal Cards =====
    {
      name: 'Platinum',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'points', spendRequired: 0, timeframeDays: 0,
        description: 'Build credit with responsible use',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 50%, #b8b8b8 100%)',
        textColor: '#1A1A1A', logoVariant: 'dark',
      },
      description: 'Build credit with responsible use',
      creditLevel: 'fair',
      cardType: 'personal',
    },
    {
      name: 'Venture X Rewards',
      network: 'visa',
      annualFee: 395,
      rewardTiers: [
        { rate: 10, unit: 'miles', categories: ['hotels', 'car-rental'], qualifier: 'via Capital One Travel' },
        { rate: 5, unit: 'miles', categories: ['flights'], qualifier: 'via Capital One Travel' },
        { rate: 2, unit: 'miles', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 75000, bonusUnit: 'miles', spendRequired: 4000, timeframeDays: 90,
        description: 'Earn 75,000 bonus miles. 10,000 anniversary miles & $300 annual Capital One Travel credit',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: 'Premium travel rewards card with airport lounge access',
      creditLevel: 'excellent',
      cardType: 'personal',
    },
    {
      name: 'Venture Rewards',
      network: 'visa',
      annualFee: 95,
      rewardTiers: [
        { rate: 5, unit: 'miles', categories: ['hotels', 'car-rental'], qualifier: 'via Capital One Travel' },
        { rate: 2, unit: 'miles', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 75000, bonusUnit: 'miles', spendRequired: 4000, timeframeDays: 90,
        description: 'Enjoy a $250 Capital One Travel credit & earn 75,000 bonus miles',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #004977 0%, #003557 50%, #002840 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '2X miles on every purchase',
      creditLevel: 'excellent',
      cardType: 'personal',
    },
    {
      name: 'VentureOne Rewards',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 1.25, unit: 'miles', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 20000, bonusUnit: 'miles', spendRequired: 500, timeframeDays: 90,
        description: 'Earn 20,000 bonus miles. Low intro APR for 15 months',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #005a8c 0%, #004670 50%, #003355 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '1.25X miles on every purchase',
      creditLevel: 'excellent',
      cardType: 'personal',
    },
    {
      name: 'VentureOne Rewards for Good Credit',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 1.25, unit: 'miles', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'miles', spendRequired: 0, timeframeDays: 0,
        description: '1.25X miles on every purchase',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #006a9e 0%, #005580 50%, #004060 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '1.25X miles on every purchase',
      creditLevel: 'good',
      cardType: 'personal',
    },
    {
      name: 'Quicksilver Rewards',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 1.5, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 200, bonusUnit: 'cash', spendRequired: 500, timeframeDays: 90,
        description: 'Earn a $200 cash bonus. Low intro APR for 15 months',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 50%, #808080 100%)',
        textColor: '#1A1A1A', logoVariant: 'dark',
      },
      description: '1.5% cash back on every purchase',
      creditLevel: 'excellent',
      cardType: 'personal',
    },
    {
      name: 'Quicksilver Rewards for Good Credit',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 1.5, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: '1.5% cash back on every purchase',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #b0b0b0 0%, #989898 50%, #707070 100%)',
        textColor: '#1A1A1A', logoVariant: 'dark',
      },
      description: '1.5% cash back on every purchase',
      creditLevel: 'good',
      cardType: 'personal',
    },
    {
      name: 'Savor Rewards',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 3, unit: 'percent_cashback', categories: ['groceries', 'dining', 'entertainment'], qualifier: null },
        { rate: 1, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 200, bonusUnit: 'cash', spendRequired: 500, timeframeDays: 90,
        description: 'Earn a $200 cash bonus. Low intro APR for 12 months',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #333333 50%, #0d0d0d 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '3% cash back at grocery stores, on dining & entertainment and 1% on other purchases',
      creditLevel: 'excellent',
      cardType: 'personal',
    },
    {
      name: 'Savor Rewards for Good Credit',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 3, unit: 'percent_cashback', categories: ['groceries', 'dining', 'entertainment'], qualifier: null },
        { rate: 1, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: '3% cash back at grocery stores, on dining & entertainment',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #252525 0%, #3a3a3a 50%, #151515 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '3% cash back at grocery stores, on dining & entertainment and 1% on other purchases',
      creditLevel: 'good',
      cardType: 'personal',
    },
    {
      name: 'SavorOne Rewards',
      network: 'mastercard',
      annualFee: 39,
      rewardTiers: [
        { rate: 3, unit: 'percent_cashback', categories: ['groceries', 'dining', 'entertainment'], qualifier: null },
        { rate: 1, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: 'Build credit with responsible use',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 50%, #0d0d0d 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '3% cash back at grocery stores, on dining & entertainment and 1% on other purchases',
      creditLevel: 'fair',
      cardType: 'personal',
    },
    {
      name: 'QuicksilverOne Rewards',
      network: 'visa',
      annualFee: 39,
      rewardTiers: [
        { rate: 1.5, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: 'Build credit with responsible use',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #a0a0a0 0%, #888888 50%, #666666 100%)',
        textColor: '#1A1A1A', logoVariant: 'dark',
      },
      description: '1.5% cash back on every purchase. Build credit with responsible use',
      creditLevel: 'fair',
      cardType: 'personal',
    },
    {
      name: 'Savor Rewards for Students',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 3, unit: 'percent_cashback', categories: ['groceries', 'dining', 'entertainment'], qualifier: null },
        { rate: 1, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 50, bonusUnit: 'cash', spendRequired: 100, timeframeDays: 90,
        description: 'Earn a $50 cash bonus. Build credit with responsible use',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #2a2a2a 0%, #404040 50%, #1a1a1a 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '3% cash back at grocery stores, on dining & entertainment and 1% on other purchases',
      creditLevel: 'fair',
      cardType: 'personal',
    },
    {
      name: 'Quicksilver Rewards for Students',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 1.5, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 50, bonusUnit: 'cash', spendRequired: 100, timeframeDays: 90,
        description: 'Earn a $50 cash bonus. Build credit with responsible use',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #d0d0d0 0%, #b8b8b8 50%, #909090 100%)',
        textColor: '#1A1A1A', logoVariant: 'dark',
      },
      description: '1.5% cash back on every purchase. Build credit with responsible use',
      creditLevel: 'fair',
      cardType: 'personal',
    },
    {
      name: 'Quicksilver Secured Rewards',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 1.5, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: 'Build credit with responsible use. $200 refundable minimum deposit',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #c8c8c8 0%, #b0b0b0 50%, #888888 100%)',
        textColor: '#1A1A1A', logoVariant: 'dark',
      },
      description: '1.5% cash back on every purchase. $200 refundable minimum deposit',
      creditLevel: 'fair',
      cardType: 'personal',
    },
    {
      name: 'Platinum Secured',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'points', spendRequired: 0, timeframeDays: 0,
        description: 'Build credit with responsible use. $49, $99, or $200 refundable deposit',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #d8d8d8 0%, #c0c0c0 50%, #a0a0a0 100%)',
        textColor: '#1A1A1A', logoVariant: 'dark',
      },
      description: 'Build credit with responsible use. $49, $99, or $200 refundable deposit',
      creditLevel: 'rebuilding',
      cardType: 'personal',
    },

    // ===== Partner Cards =====
    {
      name: 'T-Mobile Visa',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 5, unit: 'percent_back', categories: ['t-mobile'], qualifier: 'Phone, device, or accessory at T-Mobile' },
        { rate: 2, unit: 'percent_back', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: 'Redeem rewards towards a new phone, device, or your T-Mobile bill',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #e20074 0%, #b8005d 50%, #8a0046 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '2% in rewards on every purchase. 5% in rewards at T-Mobile',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },
    {
      name: 'Kohl\'s Rewards Visa',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 7.5, unit: 'percent_back', categories: ['kohls'], qualifier: 'At Kohl\'s' },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: '40% off your first purchase within 30 days. Exclusive cardholder discounts',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #333333 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '7.5% back in Kohl\'s rewards. Exclusive cardholder discounts',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },
    {
      name: 'REI Co-op Mastercard',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 5, unit: 'percent_back', categories: ['rei'], qualifier: 'On REI Co-op purchases' },
        { rate: 1.5, unit: 'percent_back', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: '5% in rewards on REI Co-op purchases and 1.5% on all other purchases',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #1a5632 0%, #134425 50%, #0d331a 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '5% in rewards on REI Co-op purchases. 1.5% on all other purchases',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },
    {
      name: 'Pottery Barn Key Rewards Visa',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 5, unit: 'percent_back', categories: ['pottery-barn'], qualifier: 'Up to 5% back in rewards' },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: 'Intro 10% back on in-store purchases',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #4a3728 0%, #3b2c20 50%, #2c2118 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: 'Up to 5% back in rewards. Intro 10% back on in-store purchases',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },
    {
      name: 'Williams Sonoma Key Rewards Visa',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 5, unit: 'percent_back', categories: ['williams-sonoma'], qualifier: 'Up to 5% back in rewards' },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: 'Intro 10% back on in-store purchases',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #2c3e50 0%, #1a2a3a 50%, #0f1c28 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: 'Up to 5% back in rewards. Intro 10% back on in-store purchases',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },
    {
      name: 'West Elm Key Rewards Visa',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 5, unit: 'percent_back', categories: ['west-elm'], qualifier: 'Up to 5% back in rewards' },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: 'Intro 10% back on in-store purchases',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #d4a574 0%, #c49464 50%, #a67c54 100%)',
        textColor: '#1A1A1A', logoVariant: 'dark',
      },
      description: 'Up to 5% back in rewards. Intro 10% back on in-store purchases',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },
    {
      name: 'Key Rewards Visa',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 5, unit: 'percent_back', categories: ['key-rewards'], qualifier: 'Up to 5% back in rewards' },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: 'Intro 10% back on in-store purchases',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #3d3d3d 0%, #2a2a2a 50%, #1a1a1a 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: 'Up to 5% back in rewards. Intro 10% back on in-store purchases',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },
    {
      name: 'Cabela\'s CLUB Card',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 2, unit: 'percent_back', categories: ['bass-pro', 'cabelas'], qualifier: 'On Bass Pro Shops & Cabela\'s purchases' },
        { rate: 1, unit: 'percent_back', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 50, bonusUnit: 'points', spendRequired: 0, timeframeDays: 0,
        description: 'Earn up to $50 in CLUB Points. Unlimited points for FREE GEAR',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #2d4a1e 0%, #1f3514 50%, #14240d 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '2% back on Bass Pro Shops & Cabela\'s purchases. Unlimited points for FREE GEAR',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },
    {
      name: 'Bass Pro Shops CLUB Card',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 2, unit: 'percent_back', categories: ['bass-pro', 'cabelas'], qualifier: 'On Bass Pro Shops & Cabela\'s purchases' },
        { rate: 1, unit: 'percent_back', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 50, bonusUnit: 'points', spendRequired: 0, timeframeDays: 0,
        description: 'Earn up to $50 in CLUB Points. Unlimited points for FREE GEAR',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #3a5a28 0%, #2b451c 50%, #1c3012 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '2% back on Bass Pro Shops & Cabela\'s purchases. Unlimited points for FREE GEAR',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },
    {
      name: 'Bass Pro Shops & Cabela\'s CLUB Business',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 5, unit: 'percent_back', categories: ['bass-pro', 'cabelas'], qualifier: 'On Bass Pro Shops & Cabela\'s purchases' },
        { rate: 1, unit: 'percent_back', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 75, bonusUnit: 'points', spendRequired: 1000, timeframeDays: 60,
        description: 'Earn $75 in CLUB Points when you spend $1,000 within 60 days',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #4a6a30 0%, #3a5524 50%, #2a4018 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '5% back in CLUB Points. Unlimited points for FREE GEAR',
      creditLevel: 'excellent',
      cardType: 'partner',
    },
    {
      name: 'BJ\'s One Mastercard',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 3, unit: 'percent_back', categories: ['bjs'], qualifier: 'On most purchases at BJ\'s' },
        { rate: 1.5, unit: 'percent_back', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: '3% back at BJ\'s. 1.5% everywhere else. 10¢ off/gallon at BJ\'s Gas',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #cc0000 0%, #a30000 50%, #800000 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '3% back at BJ\'s. 1.5% back everywhere else. 10¢ off/gallon at BJ\'s Gas',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },
    {
      name: 'BJ\'s One+ Mastercard',
      network: 'mastercard',
      annualFee: 0,
      rewardTiers: [
        { rate: 5, unit: 'percent_back', categories: ['bjs'], qualifier: 'On most purchases at BJ\'s' },
        { rate: 2, unit: 'percent_back', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: '5% back at BJ\'s. 2% everywhere else. 15¢ off/gallon at BJ\'s Gas',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #e60000 0%, #b80000 50%, #900000 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '5% back at BJ\'s. 2% back everywhere else. 15¢ off/gallon at BJ\'s Gas',
      creditLevel: 'good-excellent',
      cardType: 'partner',
    },

    // ===== Business Cards =====
    {
      name: 'Spark 2% Cash Plus',
      network: 'visa',
      annualFee: 150,
      rewardTiers: [
        { rate: 2, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 4000, bonusUnit: 'cash', spendRequired: 30000, timeframeDays: 90,
        description: 'Earn $4,000 or more in cash bonuses. Annual fee refunded if you spend $150,000 annually',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 50%, #050510 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '2% cash back on every purchase. $150 annual fee refunded at $150K spend',
      creditLevel: 'excellent',
      cardType: 'business',
    },
    {
      name: 'Spark 2% Cash',
      network: 'visa',
      annualFee: 95,
      rewardTiers: [
        { rate: 2, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 1000, bonusUnit: 'cash', spendRequired: 5000, timeframeDays: 90,
        description: 'Earn a $1,000 cash bonus. $0 intro annual fee for the first year',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #22223b 0%, #1a1a30 50%, #111125 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '2% cash back on every purchase. $0 intro annual fee for first year',
      creditLevel: 'excellent',
      cardType: 'business',
    },
    {
      name: 'Spark 1.5% Cash Select',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 1.5, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 750, bonusUnit: 'cash', spendRequired: 5000, timeframeDays: 90,
        description: 'Earn a $750 cash bonus',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #2b2b3d 0%, #1e1e2e 50%, #121220 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '1.5% cash back on every purchase',
      creditLevel: 'excellent',
      cardType: 'business',
    },
    {
      name: 'Spark 1% Classic',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 1, unit: 'percent_cashback', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 0, bonusUnit: 'cash', spendRequired: 0, timeframeDays: 0,
        description: '1% cash back on every purchase',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #3a3a4d 0%, #2d2d3e 50%, #202030 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '1% cash back on every purchase',
      creditLevel: 'fair',
      cardType: 'business',
    },
    {
      name: 'Venture X Business',
      network: 'visa',
      annualFee: 395,
      rewardTiers: [
        { rate: 10, unit: 'miles', categories: ['hotels', 'car-rental'], qualifier: 'via Capital One Travel' },
        { rate: 5, unit: 'miles', categories: ['flights'], qualifier: 'via Capital One Travel' },
        { rate: 2, unit: 'miles', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 150000, bonusUnit: 'miles', spendRequired: 30000, timeframeDays: 90,
        description: 'Earn 150,000 bonus miles',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #0a1520 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '2X miles on every purchase. Premium business travel card',
      creditLevel: 'excellent',
      cardType: 'business',
    },
    {
      name: 'Spark 2X Miles',
      network: 'visa',
      annualFee: 95,
      rewardTiers: [
        { rate: 2, unit: 'miles', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 50000, bonusUnit: 'miles', spendRequired: 4500, timeframeDays: 90,
        description: 'Earn 50,000 bonus miles. $0 intro annual fee for the first year',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #003d66 0%, #002e4d 50%, #001f33 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '2X miles on every purchase. $0 intro annual fee for first year',
      creditLevel: 'excellent',
      cardType: 'business',
    },
    {
      name: 'Spark 1.5X Miles Select',
      network: 'visa',
      annualFee: 0,
      rewardTiers: [
        { rate: 1.5, unit: 'miles', categories: ['everything'], qualifier: null },
      ],
      defaultIntroOffer: {
        bonusAmount: 50000, bonusUnit: 'miles', spendRequired: 4500, timeframeDays: 90,
        description: 'Earn 50,000 bonus miles',
      },
      visual: {
        gradient: 'linear-gradient(135deg, #004d80 0%, #003d66 50%, #002e4d 100%)',
        textColor: '#FFFFFF', logoVariant: 'light',
      },
      description: '1.5X miles on every purchase',
      creditLevel: 'excellent',
      cardType: 'business',
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
