const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  updateEmployeeRole,
  toggleEmployeeStatus,
  assignTask,
  updateTaskStatus,
  getEmployeeDashboard
} = require('../controllers/employeeController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/all', protect, restrictTo('Admin', 'Manager'), getAllEmployees);
router.get('/dashboard', protect, restrictTo('Admin', 'Manager', 'Pharmacist', 'Inventory Manager', 'Sales Executive', 'Customer Support', 'Delivery Coordinator'), getEmployeeDashboard);

// Role & Task controls
router.put('/:id/role', protect, restrictTo('Admin'), updateEmployeeRole);
router.put('/:id/status', protect, restrictTo('Admin'), toggleEmployeeStatus);
router.post('/:id/tasks', protect, restrictTo('Admin', 'Manager'), assignTask);

// Task progress update
router.put('/tasks/status', protect, updateTaskStatus);

module.exports = router;
