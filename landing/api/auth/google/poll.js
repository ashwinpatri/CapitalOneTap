const { MongoClient } = require('mongodb');

let cachedClient = null;
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }
  return cachedClient.db();
}

module.exports = async function handler(req, res) {
  const { session } = req.query;
  if (!session) return res.json({ ready: false });

  try {
    const db = await getDb();
    const doc = await db.collection('onetap_sessions').findOneAndDelete({ sessionId: session });
    if (doc && doc.token) {
      return res.json({ ready: true, token: doc.token });
    }
    res.json({ ready: false });
  } catch (err) {
    res.json({ ready: false });
  }
};
