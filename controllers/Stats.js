const Lead = require('../models/Lead');
const Sale = require('../models/Sale');
const mongoose = require('mongoose');

// @desc    Get Dashboard Statistics
// @route   GET /api/v1/stats/dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Total Leads Count (Status wise)
        const leadStats = await Lead.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // 2. Total Sales & Revenue (Pro-Level Aggregation)
        const salesStats = await Sale.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalSales: { $sum: 1 },
                    averageSale: { $avg: '$amount' }
                }
            }
        ]);

        // 3. Last 6 Months Sales Trend (Chart banane ke liye data)
        const salesTrend = await Sale.aggregate([
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    monthlyRevenue: { $sum: "$amount" },
                    salesCount: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } } // Month wise sort (Jan, Feb...)
        ]);

        // Response prepare karna
        res.status(200).json({
            success: true,
            data: {
                leads: leadStats,
                finance: salesStats[0] || { totalRevenue: 0, totalSales: 0 },
                trend: salesTrend
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Top Performing CSRs (Admin Only)
// @route   GET /api/v1/stats/top-performers
exports.getTopPerformers = async (req, res) => {
    try {
        const topCSRs = await Sale.aggregate([
            {
                $group: {
                    _id: '$csrId',
                    totalSalesValue: { $sum: '$amount' },
                    leadsConverted: { $sum: 1 }
                }
            },
            { $sort: { totalSalesValue: -1 } }, // Jiske sabse zyada paise, wo top par
            { $limit: 5 }, // Sirf Top 5
            {
                $lookup: { // Dusre collection (User) se data join karna
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'csrDetails'
                }
            },
            { $unwind: '$csrDetails' },
            {
                $project: { // Sirf kaam ka data dikhana
                    'csrDetails.name': 1,
                    'csrDetails.email': 1,
                    totalSalesValue: 1,
                    leadsConverted: 1
                }
            }
        ]);

        res.status(200).json({ success: true, data: topCSRs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};