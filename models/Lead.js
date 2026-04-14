const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Lead name is required'],
        trim: true
    },
    email: {
        type: String,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    source: {
        type: String,
        enum: ['Facebook', 'Google', 'Referral', 'Website', 'Other'],
        default: 'Other'
    },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'In Progress', 'Converted', 'Rejected'],
        default: 'New'
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true 
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true 
    },
    documentUrl: {
        type: String,
        default: 'no-document'
    }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);