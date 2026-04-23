const express = require('express');
const { getDashboardStats } = require('../controllers/Analytics');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Sirf Admin hi poori company ki analytics dekh sakta hai
router.get('/dashboard', protect, authorize('admin'), getDashboardStats);

module.exports = router;