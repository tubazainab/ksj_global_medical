const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  sku: { type: String, required: true, unique: true },
  genericName: { type: String, required: true },
  brand: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, default: 10 }, // For low stock alerts
  imageURIs: [{ type: String }],
  expiryDate: { type: Date, required: true },
  requiresPrescription: { type: Boolean, default: false },
  sideEffects: { type: String },
  dosage: { type: String },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', MedicineSchema);
