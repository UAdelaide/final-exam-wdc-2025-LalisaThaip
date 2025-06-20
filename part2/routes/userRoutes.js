const { router } = require("../../part1/app");

// POSE login using username and password
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(`
      SELECT user_id, username, role FROM Users
      WHERE username - ? AND password_hash = ?
    `, [usernme, password]);

    if (rows.length ===0) {
      
    }
  }

});