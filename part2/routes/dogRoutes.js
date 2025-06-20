const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET dogs by owner_id Part 1
router.get('/owner/:ownerId', async (req, res) => {
    const ownerId = req.params.ownerId;
    try {
        const [rows] = await db.query(`
        SELECT dog_id, name
        FROM Dogs
        WHERE owner_id = ?
        `, [ownerId]);

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});

//GET all dogs for homepage part 2
router.get('/', async (req,res) => {
    try {
        const [rows] = await db.query(`
        SELECT dog_id , name, size, owner_id
        FROM Dogs
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch all dogs'}
    }
})



module.exports = router;