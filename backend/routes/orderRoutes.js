const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getOrderDetails,
  getCustomerOrders,
  updateOrderStatus,
  requestReturn,
  getAllOrders
} = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/', protect, restrictTo('user'), createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.get('/customer', protect, restrictTo('user'), getCustomerOrders);
router.get('/all', protect, restrictTo('Admin', 'Manager', 'Sales Executive', 'Delivery Coordinator'), getAllOrders);
router.get('/:id', protect, getOrderDetails);
router.put('/:id/status', protect, restrictTo('Admin', 'Manager', 'Pharmacist', 'Sales Executive', 'Delivery Coordinator'), updateOrderStatus);
router.post('/:id/return', protect, restrictTo('user'), requestReturn);

module.exports = router;
