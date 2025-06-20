const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET dogs by owner_id
router.get('/owner/:ownerId', async (req, res) => {
    const ownerId = req.params.ownerId;
    try {
        const [rows] = await db.query(`
        SELECT dog_id, name
        FROM Dogs
        WHERE owner_id = ?
        `, [ownerId]);
        
    }
})