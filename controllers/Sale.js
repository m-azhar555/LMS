const path = require('path');
const fs = require('fs');
const Sale = require('../models/Sale');
const Lead = require('../models/Lead');
const ErrorResponse = require('../utils/errorResponse'); 
const asyncHandler = require('../middleware/async');
const generateInvoice = require('../utils/pdfGenerator'); // Day 11 Utility

// @desc    Convert Lead to Sale
// @route   POST /api/v1/sales/convert
exports.convertToSale = asyncHandler(async (req, res, next) => {
    const { leadId, amount, notes, courseName } = req.body;

    // 1. Check karo Lead exist karti hai?
    const lead = await Lead.findById(leadId);
    if (!lead) {
        return next(new ErrorResponse(`Lead not found with id of ${leadId}`, 404));
    }

    // 2. Security: CSR apni hi lead convert kar sakta hai
    if (req.user.role === 'csr' && lead.assignedTo.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to convert this lead', 403));
    }

    // 3. Check duplicate conversion
    if (lead.status === 'Converted') {
        return next(new ErrorResponse('Lead is already converted to a sale', 400));
    }

    // 4. Create Sale Record
    const sale = await Sale.create({
        leadId,
        csrId: req.user.id,
        amount,
        courseName, // Course name add kiya invoice ke liye
        notes
    });

    // 5. Update Lead Status
    lead.status = 'Converted';
    await lead.save();

    res.status(201).json({
        success: true,
        message: 'Lead successfully converted to sale',
        data: sale
    });
});

// @desc    Get Sales Records (Admin: All, CSR: Own)
// @route   GET /api/v1/sales
exports.getSales = asyncHandler(async (req, res, next) => {
    let query = {};
    if (req.user.role === 'csr') {
        query.csrId = req.user.id;
    }

    const sales = await Sale.find(query)
        .populate('leadId', 'name email phone')
        .populate('csrId', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: sales.length, data: sales });
});

// ==========================================
// DAY 11: PDF INVOICE GENERATION
// ==========================================

// @desc    Download Sale Invoice (PDF)
// @route   GET /api/v1/sales/:id/invoice
exports.downloadInvoice = asyncHandler(async (req, res, next) => {
    // Lead details populate karna zaroori hai invoice ke liye
    const sale = await Sale.findById(req.params.id).populate('leadId', 'name email');

    if (!sale) {
        return next(new ErrorResponse('Sale record not found', 404));
    }

    // Security Check: CSR sirf apni sale ka invoice download kar sake
    if (req.user.role === 'csr' && sale.csrId.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to access this invoice', 403));
    }

    // PDF filename aur path set karo
    const invoiceName = `invoice-${sale._id}.pdf`;
    const tempDir = path.join(__dirname, '..', 'temp');
    const invoicePath = path.join(tempDir, invoiceName);

    // Temp folder check (agar nahi hai toh bana do)
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    // PDF Generate karo
    generateInvoice(sale, invoicePath);

    // File generate hone ke liye chota sa delay (500ms) taake stream complete ho jaye
    setTimeout(() => {
        res.download(invoicePath, invoiceName, (err) => {
            if (err) {
                return next(new ErrorResponse('Could not download the file', 500));
            }
            // Download ke baad server se file delete kar do (Clean up)
            fs.unlinkSync(invoicePath);
        });
    }, 500);
});