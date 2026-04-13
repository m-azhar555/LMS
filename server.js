require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Security Packages
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Custom Middleware
const connectDB = require('./connect/db'); 
const errorHandler = require('./middleware/error'); // Day 8: Error Handler

// Route files
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const saleRoutes = require('./routes/saleRoutes');
const statsRoutes = require('./routes/statsRoutes');

// Connect Database
connectDB();

const app = express();

// ==========================================
// 1. Basic Middlewares & Security
// ==========================================
app.use(helmet()); // Secure HTTP headers
app.use(express.json()); 
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); 

// Data Sanitization (NoSQL injection prevention)
app.use(mongoSanitize());

// Prevent XSS attacks (Cross-site scripting)
app.use(xss());

// Prevent HTTP Param Pollution
app.use(hpp());

// Rate Limiting (Brute-force protection)
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Enable CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ==========================================
// 2. API Routes
// ==========================================
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to CodeVector LMS API',
        version: '1.0.0'
    });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/lead', leadRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/stats', statsRoutes);

// ==========================================
// 3. Post-Route Middlewares (Order Matters!)
// ==========================================

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'API route not found'
    });
});

// Day 8: Centralized Global Error Handler (Sabse last mein hona chahiye)
app.use(errorHandler);

// ==========================================
// 4. Server Initialization
// ==========================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    server.close(() => process.exit(1));
});