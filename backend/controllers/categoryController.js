const Category = require('../models/Category');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a category (Admin/Manager)
exports.createCategory = async (req, res) => {
  const { name, slug, description, imageURI } = req.body;
  try {
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this slug already exists' });
    }

    const category = new Category({ name, slug, description, imageURI });
    await category.save();

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update a category (Admin/Manager)
exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, imageURI } = req.body;
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.name = name || category.name;
    category.slug = slug || category.slug;
    category.description = description || category.description;
    category.imageURI = imageURI || category.imageURI;

    await category.save();

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a category (Admin/Manager)
exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
