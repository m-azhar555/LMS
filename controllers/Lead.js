const Lead = require('../models/Lead');
const ErrorResponse = require('../utils/errorResponse'); // Custom error class
const asyncHandler = require('../middleware/async');   // Async wrapper
const sendEmail = require('../utils/sendEmail');       // Email Utility

// @desc    Create a new Lead
// @route   POST /api/v1/lead/create-lead
exports.createLead = asyncHandler(async (req, res, next) => {
    const { name, email, phone, source } = req.body;

    let assignedToCSR = req.user.id; 
    
    if (req.user.role === 'admin' && req.body.assignedTo) {
        assignedToCSR = req.body.assignedTo;
    }

    const lead = await Lead.create({
        name,
        email,
        phone,
        source,
        assignedTo: assignedToCSR,
        createdBy: req.user.id 
    });

    // ==========================================
    // EMAIL AUTOMATION LOGIC
    // ==========================================
    if (lead.email) {
        try {
            const htmlTemplate = `
                <div style="font-family: Arial, sans-serif; border: 1px solid #1e293b; padding: 20px; background-color: #0b132b; color: #ffffff; border-radius: 8px;">
                    <h2 style="color: #4ea8de;">Welcome to CodeVector!</h2>
                    <p style="color: #f8f9fa;">Hi ${lead.name},</p>
                    <p style="color: #f8f9fa;">Thank you for reaching out to us. Our team has received your inquiry and a CSR will contact you shortly.</p>
                    <hr style="border: 1px solid #1c2541;">
                    <p style="color: #adb5bd;"><b>Your Lead ID:</b> ${lead._id}</p>
                    <p style="color: #adb5bd;">Best Regards,<br><strong>CodeVector Team</strong></p>
                </div>
            `;

            await sendEmail({
                email: lead.email,
                subject: 'Inquiry Received - CodeVector LMS',
                html: htmlTemplate
            });
        } catch (err) {
            console.log('Email could not be sent: ', err.message);
        }
    }

    res.status(201).json({ success: true, data: lead });
});

// @desc    Get all leads (Admin Only)
// @route   GET /api/v1/lead/get-all-leads
exports.getAllLeads = asyncHandler(async (req, res, next) => {
    const leads = await Lead.find()
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leads.length, data: leads });
});

// @desc    Get leads assigned to logged-in CSR
// @route   GET /api/v1/lead/get-my-leads
exports.getMyLeads = asyncHandler(async (req, res, next) => {
    const leads = await Lead.find({ assignedTo: req.user.id })
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leads.length, data: leads });
});

// @desc    Update Lead Status
// @route   PUT /api/v1/lead/:id/status
exports.updateLeadStatus = asyncHandler(async (req, res, next) => {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
        return next(new ErrorResponse(`Lead not found with id of ${req.params.id}`, 404));
    }

    if (req.user.role === 'csr' && lead.assignedTo.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to update this lead', 403));
    }

    lead.status = req.body.status;
    await lead.save();

    res.status(200).json({ success: true, message: 'Status updated successfully', data: lead });
});

// ==========================================
// DAY 10: FILE UPLOAD LOGIC
// ==========================================

// @desc    Upload document for a lead
// @route   PUT /api/v1/lead/:id/document
exports.uploadLeadDocument = asyncHandler(async (req, res, next) => {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
        return next(new ErrorResponse(`Lead not found with id of ${req.params.id}`, 404));
    }

    // Security: Only Admin or the assigned CSR can upload
    if (req.user.role === 'csr' && lead.assignedTo.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to upload document for this lead', 403));
    }

    // Check if file was uploaded by Multer
    if (!req.file) {
        return next(new ErrorResponse('Please upload a file', 400));
    }

    // req.file.path mein Cloudinary ka URL hota hai
    lead.documentUrl = req.file.path;
    await lead.save();

    res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        data: lead.documentUrl
    });
});

// @desc    Get Filtered Leads with Pagination
// @route   GET /api/v1/lead/filter
exports.filterLeads = asyncHandler(async (req, res, next) => {
    const { status, source, assignedTo, startDate, endDate, page, limit } = req.query;

    let query = {};

    if (req.user.role === 'csr') {
        query.assignedTo = req.user.id;
    } else if (req.user.role === 'admin' && assignedTo) {
        query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (source) query.source = source;

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate); 
    }

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = pageNumber * limitNumber;
    
    const total = await Lead.countDocuments(query);

    const leads = await Lead.find(query)
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limitNumber);

    const pagination = {};
    if (endIndex < total) {
        pagination.next = { page: pageNumber + 1, limit: limitNumber };
    }
    if (startIndex > 0) {
        pagination.prev = { page: pageNumber - 1, limit: limitNumber };
    }

    res.status(200).json({
        success: true,
        totalRecords: total,
        count: leads.length,
        pagination,
        data: leads
    });
});