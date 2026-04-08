const express = require('express');
const { convertToSale, getSales } = require('../controllers/Sale');
const { protect } = require('../middleware/auth');
const { convertSaleValidation } = require('../validations/salesValidation');
const { runValidation } = require('../middleware/validate');

const router = express.Router();

// Dono routes login (protect) hone chahiye
router.post('/convert', protect, convertSaleValidation, runValidation, convertToSale);
router.get('/', protect, getSales);

module.exports = router;