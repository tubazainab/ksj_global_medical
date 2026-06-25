const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getTopSellingMedicines,
  getInventoryReport,
  getEmployeePerformanceReport
} = require('../controllers/reportController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/sales', protect, restrictTo('Admin', 'Manager'), getSalesReport);
router.get('/top-selling', protect, restrictTo('Admin', 'Manager'), getTopSellingMedicines);
router.get('/inventory', protect, restrictTo('Admin', 'Manager', 'Inventory Manager'), getInventoryReport);
router.get('/employee-performance', protect, restrictTo('Admin', 'Manager'), getEmployeePerformanceReport);

module.exports = router;
