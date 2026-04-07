require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./connect/db'); 
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');


connectDB();

const app = express();


app.use(helmet()); 
app.use(cors());
app.use(express.json()); 
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); 

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}


app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to CodeVector LMS API',
        version: '1.0.0'
    });
});


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/lead', leadRoutes);



app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'API route not found'
    });
});


const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    server.close(() => process.exit(1));
});