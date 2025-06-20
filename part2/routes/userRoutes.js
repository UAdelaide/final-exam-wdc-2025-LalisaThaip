const express = require('express');
const router = express.Router();
const db = require('../models/db');

// POST login using username and password
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query the database for a user matching the credentials
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE username = ? AND password_hash = ?
    `, [username, password]);
    // If no user found, return 401 Unauthorized
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = rows[0]; // Save user info in session
    res.json({ message: 'Login success!', user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

router.post('logout/', (req,res) => {
  req.session.destroy(err =>{ //destroy session
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); //clear session cookie
    res.json({ message: 'Logged out success!' });
  });
});

module.exports = router;