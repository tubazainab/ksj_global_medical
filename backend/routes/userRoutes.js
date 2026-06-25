const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  toggleUserBlock,
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getWishlist,
  toggleWishlist,
  addAddress,
  deleteAddress
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// Profile management
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Admin controls
router.get('/all', protect, restrictTo('Admin', 'Manager'), getAllUsers);
router.put('/:id/block', protect, restrictTo('Admin'), toggleUserBlock);

// Cart
router.get('/cart', protect, restrictTo('user'), getCart);
router.post('/cart', protect, restrictTo('user'), addToCart);
router.delete('/cart/clear', protect, restrictTo('user'), clearCart);
router.delete('/cart/:medicineId', protect, restrictTo('user'), removeFromCart);

// Wishlist
router.get('/wishlist', protect, restrictTo('user'), getWishlist);
router.post('/wishlist', protect, restrictTo('user'), toggleWishlist);

// Address Management
router.post('/address', protect, restrictTo('user'), addAddress);
router.delete('/address/:addressId', protect, restrictTo('user'), deleteAddress);

module.exports = router;
