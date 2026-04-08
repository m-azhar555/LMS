const { check } = require('express-validator');

exports.createLeadValidation = [
    check('name', 'Lead name is required').not().isEmpty().trim(),
    check('phone', 'Phone number is required').not().isEmpty(),
    check('source', 'Invalid source').optional().isIn(['Facebook', 'Google', 'Referral', 'Website', 'Other'])
];

// Naya Code (Day 5)
exports.updateStatusValidation = [
    check('status', 'Invalid status provided')
        .isIn(['New', 'Contacted', 'In Progress', 'Converted', 'Rejected'])
];