const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const Employee = require('../models/Employee');

// Fetch Revenue Analytics & Order Counts over a timeframe
exports.getSalesReport = async (req, res) => {
  const { timeframe } = req.query; // 'daily', 'weekly', 'monthly', 'annual'
  let groupByFormat = '%Y-%m-%d';

  if (timeframe === 'weekly') {
    groupByFormat = '%Y-%U'; // Year and week number
  } else if (timeframe === 'monthly') {
    groupByFormat = '%Y-%m'; // Year and month
  } else if (timeframe === 'annual') {
    groupByFormat = '%Y'; // Year only
  }

  try {
    const salesData = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
          totalSales: { $sum: '$totals.grandTotal' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totals.grandTotal' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({ success: true, timeframe, data: salesData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch Top Selling Medicines (Analytics)
exports.getTopSellingMedicines = async (req, res) => {
  try {
    const topMedicines = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.medicine',
          name: { $first: '$items.name' },
          totalQtySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: [{ $toDouble: '$items.price' }, '$items.quantity'] } }
        }
      },
      { $sort: { totalQtySold: -1 } },
      { $limit: 5 }
    ]);

    return res.status(200).json({ success: true, data: topMedicines });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch Inventory Reports (In-stock vs Out-of-stock metrics)
exports.getInventoryReport = async (req, res) => {
  try {
    const inStock = await Medicine.countDocuments({ stock: { $gt: 0 } });
    const lowStock = await Medicine.countDocuments({ $expr: { $lte: ['$stock', '$minStockLevel'] }, stock: { $gt: 0 } });
    const outOfStock = await Medicine.countDocuments({ stock: 0 });

    const categoryDistribution = await Medicine.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStockValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      }
    ]);

    // Populate category names manually or through populate utility
    const populatedDist = await Medicine.populate(categoryDistribution, {
      path: '_id',
      select: 'name',
      model: 'Category'
    });

    return res.status(200).json({
      success: true,
      summary: {
        inStock,
        lowStock,
        outOfStock
      },
      categories: populatedDist
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch Employee Task and Performance Reports
exports.getEmployeePerformanceReport = async (req, res) => {
  try {
    const employees = await Employee.find({}).select('employeeId name role tasks performanceRating');
    const report = employees.map(emp => {
      const totalTasks = emp.tasks.length;
      const completedTasks = emp.tasks.filter(t => t.status === 'Completed').length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;

      return {
        id: emp._id,
        employeeId: emp.employeeId,
        name: emp.name,
        role: emp.role,
        performanceRating: emp.performanceRating,
        totalTasks,
        completedTasks,
        completionRate: parseFloat(completionRate.toFixed(2))
      };
    });

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
