const Lead = require('../models/Lead');


exports.createLead = async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getAllLeads = async (req, res) => {
    try {
        // .populate() use kar rahe hain taake CSR ka naam bhi aaye (sirf ID nahi)
        const leads = await Lead.find()
            .populate('assignedTo', 'name email role')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 }); // Newest first

        res.status(200).json({ success: true, count: leads.length, data: leads });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get leads assigned to logged-in CSR
// @route   GET /api/v1/lead/get-my-leads
exports.getMyLeads = async (req, res) => {
    try {
        // Sirf wo leads lao jo is current logged-in user ko assign hain
        const leads = await Lead.find({ assignedTo: req.user.id })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: leads.length, data: leads });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.updateLeadStatus = async (req, res) => {
    try {
        let lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // Security Check: Agar CSR hai, toh sirf apni lead update kar sakta hai
        if (req.user.role === 'csr' && lead.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this lead' 
            });
        }

        // Update status
        lead.status = req.body.status;
        await lead.save();

        res.status(200).json({ success: true, message: 'Status updated successfully', data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Filtered Leads with Pagination
// @route   GET /api/v1/lead/filter
exports.filterLeads = async (req, res) => {
    try {
        // Query Parameters URL se extract karo
        const { status, source, assignedTo, startDate, endDate, page, limit } = req.query;

        let query = {};

        // Role Based Query Restriction
        if (req.user.role === 'csr') {
            query.assignedTo = req.user.id; // CSR ko zabardasti sirf apni leads dikhao
        } else if (req.user.role === 'admin' && assignedTo) {
            query.assignedTo = assignedTo; // Admin kisi makhsoos CSR ki leads filter kar sakta hai
        }

        // Apply string filters
        if (status) query.status = status;
        if (source) query.source = source;

        // Apply Date Range Filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate); 
        }

        // Pro-Level Pagination Logic
        const pageNumber = parseInt(page, 10) || 1; // Default page 1
        const limitNumber = parseInt(limit, 10) || 10; // Default 10 leads per page
        const startIndex = (pageNumber - 1) * limitNumber;
        const endIndex = pageNumber * limitNumber;
        
        const total = await Lead.countDocuments(query); // Total records matching criteria

        // Database Query with limit and skip
        const leads = await Lead.find(query)
            .populate('assignedTo', 'name email role')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limitNumber);

        // Pagination Response Format
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
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};