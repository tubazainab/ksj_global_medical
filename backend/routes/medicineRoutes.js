const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  addReview,
  getLowStockMedicines
} = require('../controllers/medicineController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/', getMedicines);
router.get('/alerts/low-stock', protect, restrictTo('Admin', 'Inventory Manager', 'Pharmacist'), getLowStockMedicines);
router.get('/:id', getMedicineById);

// Product controls
router.post('/', protect, restrictTo('Admin', 'Inventory Manager', 'Pharmacist'), createMedicine);
router.put('/:id', protect, restrictTo('Admin', 'Inventory Manager', 'Pharmacist'), updateMedicine);
router.delete('/:id', protect, restrictTo('Admin', 'Inventory Manager'), deleteMedicine);

// Review submission
router.post('/:id/reviews', protect, restrictTo('user'), addReview);

module.exports = router;
