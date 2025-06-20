const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET dogs by owner_id
router.get('/owner/:ownder')