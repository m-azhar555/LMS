const express = require('express');
const { getDashboardStats, getTopPerformers } = require('../controllers/Stats');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Dono routes protected hain, lekin Top Performers sirf Admin dekh sakta hai
router.get('/dashboard', protect, getDashboardStats);
router.get('/top-performers', protect, authorize('admin'), getTopPerformers);

module.exports = router;