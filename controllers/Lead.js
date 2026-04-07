const Lead = require('../models/Lead');

// @desc    Create a new Lead
// @route   POST /api/v1/lead/create-lead
exports.createLead = async (req, res) => {
    try {
        const { name, email, phone, source } = req.body;

        // Auto-assign logic: Agar CSR create kar raha hai, toh usi ko assign hogi.
        // Agar Admin kar raha hai, toh body mein assignedTo bhejna hoga, warna error.
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
            createdBy: req.user.id // Token se automatically id pick hogi
        });

        res.status(201).json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all leads (Admin Only)
// @route   GET /api/v1/lead/get-all-leads
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