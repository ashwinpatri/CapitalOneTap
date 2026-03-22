const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Temporary in-memory store: session_id → JWT (expires after 2 min)
const pendingSessions = new Map();
function storePendingToken(sessionId, token) {
  pendingSessions.set(sessionId, token);
  setTimeout(() => pendingSessions.delete(sessionId), 120_000);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const user = new User({
      username,
      email,
      passwordHash: password, // pre-save hook will hash it
      firstName,
      lastName,
    });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        settings: user.settings,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        settings: user.settings,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token provided' });

    // Fetch user info from Google
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
    if (!googleRes.ok) return res.status(401).json({ error: 'Invalid Google token' });
    const profile = await googleRes.json();

    const { email, given_name: firstName, family_name: lastName, sub: googleId } = profile;

    // Find existing user or create one
    let user = await User.findOne({ email });
    if (!user) {
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + googleId.slice(-4);
      user = new User({
        username,
        email,
        passwordHash: googleId, // placeholder, never used for login
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        settings: user.settings,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/google — initiate OAuth
router.get('/google', (req, res) => {
  const session = req.query.session || '';
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: 'https://onetap-api.onrender.com/api/auth/google/callback',
    response_type: 'code',
    scope: 'email profile',
    access_type: 'online',
    state: session,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// GET /api/auth/google/poll — extension polls for token
router.get('/google/poll', (req, res) => {
  const { session } = req.query;
  if (!session) return res.json({ ready: false });
  const token = pendingSessions.get(session);
  if (!token) return res.json({ ready: false });
  pendingSessions.delete(session);
  res.json({ ready: true, token });
});

// GET /api/auth/google/callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect('https://onetap-ten.vercel.app/signin.html?error=no_code');

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'https://onetap-api.onrender.com/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect('https://onetap-ten.vercel.app/signin.html?error=token_failed');

    // Get user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    const { email, given_name: firstName, family_name: lastName, sub: googleId } = profile;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect(`https://onetap-ten.vercel.app/signin.html?error=not_registered&email=${encodeURIComponent(email)}`);
    }

    // Store JWT keyed by session, extension will poll for it
    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const sessionId = req.query.state || '';
    if (sessionId) storePendingToken(sessionId, jwtToken);
    res.send(`<!DOCTYPE html><html><head><title>Signed In</title></head><body>
      <p style="font-family:sans-serif;text-align:center;margin-top:20vh;font-size:1.1rem;">
        Signed in successfully! You can close this tab.
      </p>
    </body></html>`);
  } catch (err) {
    res.redirect('https://onetap-ten.vercel.app/signin.html?error=server_error');
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/settings
router.put('/settings', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { settings: { ...req.body } } },
      { new: true }
    ).select('-passwordHash');
    res.json({ settings: user.settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
