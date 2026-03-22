const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'onetap';
const COLLECTION = 'users';

let db;

MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB v2');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.post('/api/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  try {
    const existing = await db.collection(COLLECTION).findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered.' });
    return res.status(200).json({ available: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/register-google', async (req, res) => {
  const { email, firstName, lastName, googleId, username } = req.body;

  if (!email || !googleId || !username) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const existingEmail = await db.collection(COLLECTION).findOne({ email });
    if (existingEmail) return res.status(409).json({ error: 'Email already registered.' });

    const existingUsername = await db.collection(COLLECTION).findOne({ username });
    if (existingUsername) return res.status(409).json({ error: 'Username already taken.' });

    const now = new Date();
    await db.collection(COLLECTION).insertOne({
      username,
      email,
      passwordHash: null,
      googleId,
      firstName: firstName || null,
      lastName: lastName || null,
      settings: { autoDetect: true, showFloatingButton: true, notifications: true, defaultCardId: null },
      createdAt: now,
      updatedAt: now,
      __v: 0
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

app.post('/api/register', async (req, res) => {
  const { email, username, firstName, lastName, password } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    const existingEmail = await db.collection(COLLECTION).findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const existingUsername = await db.collection(COLLECTION).findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    await db.collection(COLLECTION).insertOne({
      username: username || null,
      email,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      settings: {
        autoDetect: true,
        showFloatingButton: true,
        notifications: true,
        defaultCardId: null
      },
      createdAt: now,
      updatedAt: now,
      __v: 0
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
