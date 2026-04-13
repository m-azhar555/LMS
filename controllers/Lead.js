const Lead = require('../models/Lead');
const ErrorResponse = require('../utils/errorResponse'); // Custom error class
const asyncHandler = require('../middleware/async');   // Async wrapper

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
        // Pro-Level Error Handling
        return next(new ErrorResponse(`Lead not found with id of ${req.params.id}`, 404));
    }

    // Security Check
    if (req.user.role === 'csr' && lead.assignedTo.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to update this lead', 403));
    }

    lead.status = req.body.status;
    await lead.save();

    res.status(200).json({ success: true, message: 'Status updated successfully', data: lead });
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