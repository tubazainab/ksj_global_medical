const Medicine = require('../models/Medicine');
const Review = require('../models/Review');

// Search & Filter medicines
exports.getMedicines = async (req, res) => {
  const { keyword, category, priceMin, priceMax, requiresPrescription, limit, skip } = req.query;
  let query = {};

  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { genericName: { $regex: keyword, $options: 'i' } },
      { brand: { $regex: keyword, $options: 'i' } },
      { description: { $regex: keyword, $options: 'i' } }
    ];
  }

  if (category) {
    query.category = category;
  }

  if (priceMin || priceMax) {
    query.price = {};
    if (priceMin) query.price.$gte = Number(priceMin);
    if (priceMax) query.price.$lte = Number(priceMax);
  }

  if (requiresPrescription !== undefined) {
    query.requiresPrescription = requiresPrescription === 'true';
  }

  try {
    const total = await Medicine.countDocuments(query);
    const medicines = await Medicine.find(query)
      .populate('category', 'name slug')
      .limit(Number(limit) || 12)
      .skip(Number(skip) || 0)
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, total, data: medicines });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get medicine details by ID
exports.getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate('category', 'name slug');
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Fetch reviews
    const reviews = await Review.find({ medicine: medicine._id }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: medicine, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a medicine (Admin / Inventory Manager / Pharmacist)
exports.createMedicine = async (req, res) => {
  const {
    name, sku, genericName, brand, description, category,
    price, discountPrice, stock, minStockLevel, imageURIs,
    expiryDate, requiresPrescription, sideEffects, dosage, isFeatured
  } = req.body;

  try {
    const existing = await Medicine.findOne({ sku });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Medicine SKU already exists' });
    }

    const medicine = new Medicine({
      name, sku, genericName, brand, description, category,
      price, discountPrice, stock, minStockLevel, imageURIs,
      expiryDate, requiresPrescription, sideEffects, dosage, isFeatured
    });

    await medicine.save();
    return res.status(201).json({ success: true, data: medicine });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update a medicine
exports.updateMedicine = async (req, res) => {
  const { id } = req.params;
  try {
    const medicine = await Medicine.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    return res.status(200).json({ success: true, data: medicine });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a medicine
exports.deleteMedicine = async (req, res) => {
  const { id } = req.params;
  try {
    const medicine = await Medicine.findByIdAndDelete(id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    return res.status(200).json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add product review
exports.addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const medicineId = req.params.id;

  try {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({ medicine: medicineId, user: req.user._id });
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this medicine' });
    }

    const review = new Review({
      medicine: medicineId,
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment
    });

    await review.save();

    // Recalculate average rating
    const reviews = await Review.find({ medicine: medicineId });
    medicine.numReviews = reviews.length;
    medicine.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await medicine.save();

    return res.status(201).json({ success: true, message: 'Review added successfully', data: review });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get inventory alert for low stock medicines (Employee/Manager task check)
exports.getLowStockMedicines = async (req, res) => {
  try {
    // Find medicines where current stock is less than minStockLevel
    const medicines = await Medicine.find({ $expr: { $lte: ['$stock', '$minStockLevel'] } })
      .populate('category', 'name');

    return res.status(200).json({ success: true, count: medicines.length, data: medicines });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
