const Sale = require('../models/Sale');
const Lead = require('../models/Lead');

// @desc    Convert Lead to Sale
// @route   POST /api/v1/sales/convert
exports.convertToSale = async (req, res) => {
    try {
        const { leadId, amount, notes } = req.body;

        // 1. Check karo Lead exist karti hai?
        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // 2. Security: Check karo CSR apni hi lead convert kar raha hai? (Admins excluded)
        if (req.user.role === 'csr' && lead.assignedTo.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to convert this lead' });
        }

        // 3. Check karo lead pehle hi convert toh nahi ho chuki?
        if (lead.status === 'Converted') {
            return res.status(400).json({ success: false, message: 'Lead is already converted to a sale' });
        }

        // 4. Create Sale Record
        const sale = await Sale.create({
            leadId,
            csrId: req.user.id,
            amount,
            notes
        });

        // 5. Update Lead Status to "Converted"
        lead.status = 'Converted';
        await lead.save();

        res.status(201).json({
            success: true,
            message: 'Lead successfully converted to sale',
            data: sale
        });
    } catch (error) {
        // Mongoose Unique error handle (LeadId unique check)
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Sale record already exists for this lead' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Sales Records (Admin: All, CSR: Own)
// @route   GET /api/v1/sales
exports.getSales = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'csr') {
            query.csrId = req.user.id;
        }

        const sales = await Sale.find(query)
            .populate('leadId', 'name email phone')
            .populate('csrId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: sales.length, data: sales });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};