const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * POST /api/auth/login
 * Simple single-admin login using env credentials
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@signage.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (email !== adminEmail) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Support both plain and bcrypt hashed passwords
  let valid = false;
  if (adminPassword.startsWith('$2')) {
    valid = await bcrypt.compare(password, adminPassword);
  } else {
    valid = password === adminPassword;
  }

  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { email: adminEmail, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return res.json({
    token,
    user: { email: adminEmail, role: 'admin' },
  });
});

/**
 * GET /api/auth/me
 */
router.get('/me', require('../middleware/auth.middleware'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
