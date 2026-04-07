const { check } = require('express-validator');

// Register API rules
exports.registerValidation = [
    check('name', 'Name is required').not().isEmpty().trim(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
    check('role', 'Role must be either admin or csr').optional().isIn(['admin', 'csr'])
];

// Login API rules
exports.loginValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists()
];