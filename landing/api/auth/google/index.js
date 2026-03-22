module.exports = function handler(req, res) {
  const session = req.query.session || '';
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: 'https://onetap-ten.vercel.app/api/auth/google/callback',
    response_type: 'code',
    scope: 'email profile',
    access_type: 'online',
    state: session,
  });
  res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};
