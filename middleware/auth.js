const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc   Protect routes (Check if user is logged in)
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Token hum Authorization header se extract karenge (Bearer Token)
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Agar token nahi mila
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
        }

        // Token verify karna
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // User ko find karke request object mein daal dena taake aage use ho sake
        req.user = await User.findById(decoded.id);
        
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

// @desc   Grant access to specific roles (Admin vs CSR)
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `User role '${req.user.role}' is not authorized to access this route` 
            });
        }
        next();
    };
};
