//const { router } = require("../../part1/app");

// POST login using username and password
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE username = ? AND password_hash = ?
    `, [username, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = rows[0]; //save user to session
    res.json({ message: 'Login success!', user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }

});

module.exports = router;