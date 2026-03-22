const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

let cachedClient = null;
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }
  return cachedClient.db();
}

const SUCCESS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signed In — OneTap</title>
  <link rel="preload" href="/assets/fonts/Optimist_W_XLt.woff2" as="font" type="font/woff2" crossorigin>
  <style>
    @font-face {
      font-family: 'Optimist';
      src: url('/assets/fonts/Optimist_W_XLt.woff2') format('woff2');
      font-weight: 300;
      font-display: block;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      background: linear-gradient(150deg, #002f4d 0%, #004977 50%, #005e96 100%);
      font-family: 'Optimist', sans-serif;
      color: #fff;
      overflow: hidden;
    }
    .container {
      padding: 48px 56px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    h1 {
      font-size: 11vw;
      font-weight: 300;
      line-height: 1.05;
      letter-spacing: -0.02em;
      max-width: 70%;
    }
    .sub {
      font-size: 2.4vw;
      font-weight: 300;
      color: rgba(255,255,255,0.6);
      margin-top: 20px;
    }
    .smiley {
      position: fixed;
      right: 56px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 22vw;
      font-weight: 300;
      color: #fff;
      user-select: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div>
      <h1>Signed in Successfully</h1>
      <p class="sub">You can safely close this page.</p>
    </div>
  </div>
  <div class="smiley">:)</div>
</body>
</html>`;

module.exports = async function handler(req, res) {
  const { code, state: sessionId, error } = req.query;

  if (error || !code) {
    return res.redirect(302, '/signin.html?error=no_code');
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'https://onetap-ten.vercel.app/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect(302, '/signin.html?error=token_failed');
    }

    // Get user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const { email } = await profileRes.json();

    // Check user exists in MongoDB
    const db = await getDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.redirect(302, `/signin.html?error=not_registered&email=${encodeURIComponent(email)}`);
    }

    // Issue JWT and store in sessions collection for polling
    const jwtToken = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '30d' });

    if (sessionId) {
      await db.collection('onetap_sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 120 });
      await db.collection('onetap_sessions').insertOne({
        sessionId,
        token: jwtToken,
        createdAt: new Date(),
      });
    }

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(SUCCESS_HTML);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(302, '/signin.html?error=server_error');
  }
};
