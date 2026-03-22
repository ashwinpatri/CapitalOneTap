const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MONGO_URI = 'mongodb+srv://admin:VandyHacks2026@caponetapdb.wibiqzc.mongodb.net/?appName=CapOneTapDB';
const DB_NAME = 'onetap';
const COLLECTION = 'users';

let db;

MongoClient.connect(MONGO_URI)
  .then(client => {
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.post('/api/register', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  try {
    const existing = await db.collection(COLLECTION).findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    await db.collection(COLLECTION).insertOne({ email, registeredAt: new Date() });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
