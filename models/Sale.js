const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Lead',
        required: [true, 'Sale must belong to a lead'],
        unique: true // Ek lead ki do sales nahi ho sakti
    },
    csrId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Sale amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    closingDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);