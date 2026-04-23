const Lead = require('../models/Lead');
const Sale = require('../models/Sale');
const asyncHandler = require('../middleware/async');

// @desc    Get Dashboard Statistics
// @route   GET /api/v1/analytics/dashboard
// @access  Private (Admin Only)
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
    // 1. Total Counts & Revenue
    const totalLeads = await Lead.countDocuments();
    const totalSales = await Sale.countDocuments();
    
    const revenueData = await Sale.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // 2. Lead Status Breakup (Pie Chart Data)
    const statusStats = await Lead.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 3. Monthly Sales Growth (Line Chart Data)
    const monthlySales = await Sale.aggregate([
        {
            $group: {
                _id: { $month: "$createdAt" },
                salesCount: { $sum: 1 },
                monthlyRevenue: { $sum: "$amount" }
            }
        },
        { $sort: { "_id": 1 } } // Sort by Month
    ]);

    res.status(200).json({
        success: true,
        data: {
            summary: {
                totalLeads,
                totalSales,
                totalRevenue
            },
            statusBreakup: statusStats,
            monthlyPerformance: monthlySales
        }
    });
});