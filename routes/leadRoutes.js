const express = require('express');
// Day 10: uploadLeadDocument controller add kiya
const { 
    createLead, 
    getAllLeads, 
    getMyLeads, 
    updateLeadStatus, 
    filterLeads, 
    uploadLeadDocument 
} = require('../controllers/Lead');

const { protect, authorize } = require('../middleware/auth');
const { createLeadValidation, updateStatusValidation } = require('../validations/leadValidation');
const { runValidation } = require('../middleware/validate');

// Day 10: Multer middleware for Cloudinary
const upload = require('../middleware/upload');

const router = express.Router();


router.post('/create-lead', protect, createLeadValidation, runValidation, createLead);

// Route: Get All Leads (Admin Only)
router.get('/get-all-leads', protect, authorize('admin'), getAllLeads);

// Route: Get My Leads (CSR Only)
router.get('/get-my-leads', protect, authorize('csr'), getMyLeads);


router.get('/filter', protect, filterLeads);

// Route: Update Lead Status
router.put(
    '/:id/status', 
    protect, 
    updateStatusValidation, 
    runValidation, 
    updateLeadStatus
);

// ==========================================
// Day 10: Document Management (New)
// ==========================================

// Route: Upload Lead Document (CNIC, Images, PDFs)
// 'document' wo field name hai jo Postman ke form-data mein use hoga
router.put(
    '/:id/document', 
    protect, 
    upload.single('document'), 
    uploadLeadDocument
);

module.exports = router;