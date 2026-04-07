const express = require('express');
const { createLead, getAllLeads, getMyLeads } = require('../controllers/Lead');
const { protect, authorize } = require('../middleware/auth');
const { createLeadValidation } = require('../validations/leadValidation');
const { runValidation } = require('../middleware/validate');

const router = express.Router();

// Route: Create Lead (Admin aur CSR dono kar sakte hain)
router.post('/create-lead', protect, createLeadValidation, runValidation, createLead);

// Route: Get All Leads (Sirf Admin dekh sakta hai)
router.get('/get-all-leads', protect, authorize('admin'), getAllLeads);

// Route: Get My Leads (Sirf CSR apni leads dekh sakta hai)
router.get('/get-my-leads', protect, authorize('csr'), getMyLeads);

module.exports = router;