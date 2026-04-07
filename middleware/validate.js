const { validationResult } = require('express-validator');

exports.runValidation = (req, res, next) => {
    const errors = validationResult(req);
    
    // Agar input data mein koi error hai toh yahin se wapis bhej do (400 Bad Request)
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array().map(err => err.msg) // Sirf clean error messages bhejna
        });
    }
    
    // Agar sab theek hai toh controller ki taraf aage barho
    next();
};