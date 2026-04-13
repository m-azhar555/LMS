const { check } = require('express-validator');

exports.convertSaleValidation = [
    check('leadId', 'Valid Lead ID is required').isMongoId(),
    check('amount', 'Amount must be a positive number').isFloat({ min: 0 }),
    check('notes', 'Notes should be a string').optional().isString()
];