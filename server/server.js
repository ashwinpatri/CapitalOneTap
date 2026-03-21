const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onetap';
const JWT_SECRET = process.env.JWT_SECRET || 'onetap-hackathon-secret';
const PORT = process.env.PORT || 3001;

// ─── Schemas ─────────────────────────────────────────────────────────────────

const cardSchema = new mongoose.Schema({
  nessieId:   String,
  cardId:     String,   // 'venture-x', 'savor-one', etc.
  name:       String,
  lastFour:   String,
  type:       String,
  rewardRate: Number,
  bonusRate:  Number,
  rewardUnit: String,
  categories: [String],
  gradient:   String,
  textColor:  String,
  isDefault:  Boolean,
  rewards:    { type: Number, default: 0 },
  addedAt:    { type: Date, default: Date.now },
});

const transactionSchema = new mongoose.Schema({
  txId:         String,   // Nessie purchase _id or local tx-xxx
  merchant:     String,
  amount:       Number,
  cardId:       String,
  cardName:     String,
  rewardsEarned: Number,
  rewardUnit:   String,
  date:         String,
  status:       String,
  createdAt:    { type: Date, default: Date.now },
});

const offerSchema = new mongoose.Schema({
  offerId:      String,
  merchant:     String,
  merchantIcon: String,
  description:  String,
  discount:     Number,
  maxSavings:   Number,
  expiresAt:    String,
  cardId:       String,
  activated:    { type: Boolean, default: false },
});

const settingsSchema = new mongoose.Schema({
  autoDetect:         { type: Boolean, default: true },
  showFloatingButton: { type: Boolean, default: true },
  defaultCardId:      { type: String,  default: 'venture-x' },
  notifications:      { type: Boolean, default: true },
});

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true },
  name:         { type: String, default: '' },
  cards:        [cardSchema],
  transactions: [transactionSchema],
  offers:       [offerSchema],
  settings:     { type: settingsSchema, default: () => ({}) },
  createdAt:    { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// ─── Auth middleware ──────────────────────────────────────────────────────────

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Auth routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Account already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashed, name: name || email.split('@')[0] });

  const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, userId: user._id, email: user.email, name: user.name });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, userId: user._id, email: user.email, name: user.name });
});

// ─── User data routes ─────────────────────────────────────────────────────────

// Get full profile (cards, transactions, offers, settings)
app.get('/api/users/:id', auth, async (req, res) => {
  if (req.user.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Sync cards from Nessie into MongoDB
app.put('/api/users/:id/cards', auth, async (req, res) => {
  if (req.user.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const { cards } = req.body;
  if (!Array.isArray(cards)) return res.status(400).json({ error: 'cards must be an array' });

  const mapped = cards.map(c => ({
    nessieId:   c.nessieId,
    cardId:     c.id,
    name:       c.name,
    lastFour:   c.lastFour,
    type:       c.type,
    rewardRate: c.rewardRate,
    bonusRate:  c.bonusRate,
    rewardUnit: c.rewardUnit,
    categories: c.categories,
    gradient:   c.gradient,
    textColor:  c.textColor,
    isDefault:  c.isDefault,
    rewards:    c.rewards || 0,
  }));

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { cards: mapped },
    { new: true }
  ).select('-password');
  res.json({ cards: user.cards });
});

// Add a transaction
app.post('/api/users/:id/transactions', auth, async (req, res) => {
  if (req.user.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const tx = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $push: { transactions: { $each: [{ txId: tx.id, ...tx }], $position: 0 } } },
    { new: true }
  ).select('-password');
  res.json({ transaction: user.transactions[0] });
});

// Get transactions
app.get('/api/users/:id/transactions', auth, async (req, res) => {
  if (req.user.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const user = await User.findById(req.params.id).select('transactions');
  res.json({ transactions: user.transactions });
});

// Sync offers
app.put('/api/users/:id/offers', auth, async (req, res) => {
  if (req.user.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const { offers } = req.body;
  const mapped = offers.map(o => ({ offerId: o.id, ...o }));
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { offers: mapped },
    { new: true }
  ).select('-password');
  res.json({ offers: user.offers });
});

// Update settings
app.patch('/api/users/:id/settings', auth, async (req, res) => {
  if (req.user.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { settings: { ...req.body } },
    { new: true }
  ).select('-password');
  res.json({ settings: user.settings });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`[One Tap] MongoDB connected → ${MONGO_URI}`);
    app.listen(PORT, () => console.log(`[One Tap] Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('[One Tap] MongoDB connection failed:', err.message);
    process.exit(1);
  });
