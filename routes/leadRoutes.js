const express = require('express');
// Day 5 ke naye controllers (updateLeadStatus, filterLeads) add kiye hain
const { createLead, getAllLeads, getMyLeads, updateLeadStatus, filterLeads } = require('../controllers/Lead');
const { protect, authorize } = require('../middleware/auth');
// Day 5 ki nayi validation (updateStatusValidation) add ki hai
const { createLeadValidation, updateStatusValidation } = require('../validations/leadValidation');
const { runValidation } = require('../middleware/validate');

const router = express.Router();

// ==========================================
// Day 4 Routes (Core CRUD)
// ==========================================

// Route: Create Lead (Admin aur CSR dono kar sakte hain)
router.post('/create-lead', protect, createLeadValidation, runValidation, createLead);

// Route: Get All Leads (Sirf Admin dekh sakta hai)
router.get('/get-all-leads', protect, authorize('admin'), getAllLeads);

// Route: Get My Leads (Sirf CSR apni leads dekh sakta hai)
router.get('/get-my-leads', protect, authorize('csr'), getMyLeads);


// ==========================================
// Day 5 Routes (Advanced Features)
// ==========================================

// Route: Advanced Filter & Pagination (Admin & CSR dono ke liye)
// Note: Is route ko humesha /:id wale routes se upar rakhte hain
router.get('/filter', protect, filterLeads);

// Route: Update Lead Status (Admin & CSR dono kar sakte hain)
router.put(
    '/:id/status', 
    protect, 
    updateStatusValidation, 
    runValidation, 
    updateLeadStatus
);

module.exports = router;