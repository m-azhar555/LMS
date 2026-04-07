const { check } = require('express-validator');

exports.createLeadValidation = [
    check('name', 'Lead name is required').not().isEmpty().trim(),
    check('phone', 'Phone number is required').not().isEmpty(),
    check('source', 'Invalid source').optional().isIn(['Facebook', 'Google', 'Referral', 'Website', 'Other'])
];