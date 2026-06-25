const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', getCategories);
router.post('/', protect, restrictTo('Admin', 'Inventory Manager', 'Manager'), createCategory);
router.put('/:id', protect, restrictTo('Admin', 'Inventory Manager', 'Manager'), updateCategory);
router.delete('/:id', protect, restrictTo('Admin', 'Inventory Manager'), deleteCategory);

module.exports = router;
