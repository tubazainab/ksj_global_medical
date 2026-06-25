const User = require('../models/User');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');

// Get current user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  const { name, phone } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.name = name || user.name;
    user.phone = phone || user.phone;
    await user.save();

    return res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Block / Unblock User (Admin only)
exports.toggleUserBlock = async (req, res) => {
  const { id } = req.params;
  const { isBlocked } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isBlocked = isBlocked;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User has been successfully ${isBlocked ? 'blocked' : 'unblocked'}`,
      data: user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- CART MANAGEMENT ---

// Get User Cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.medicine');
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }
    return res.status(200).json({ success: true, data: cart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Add / Update Cart Items
exports.addToCart = async (req, res) => {
  const { medicineId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.medicine.toString() === medicineId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      cart.items.push({ medicine: medicineId, quantity });
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.medicine');
    return res.status(200).json({ success: true, message: 'Cart updated', data: updatedCart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove item from Cart
exports.removeFromCart = async (req, res) => {
  const { medicineId } = req.params;
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.medicine.toString() !== medicineId);
    await cart.save();

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.medicine');
    return res.status(200).json({ success: true, message: 'Item removed from cart', data: updatedCart });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Clear Cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return res.status(200).json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- WISHLIST MANAGEMENT ---

// Get User Wishlist
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('medicines');
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, medicines: [] });
      await wishlist.save();
    }
    return res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Wishlist Item
exports.toggleWishlist = async (req, res) => {
  const { medicineId } = req.body;
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, medicines: [] });
    }

    const itemIndex = wishlist.medicines.indexOf(medicineId);
    if (itemIndex > -1) {
      wishlist.medicines.splice(itemIndex, 1);
      await wishlist.save();
      return res.status(200).json({ success: true, message: 'Removed from wishlist', action: 'removed' });
    } else {
      wishlist.medicines.push(medicineId);
      await wishlist.save();
      return res.status(200).json({ success: true, message: 'Added to wishlist', action: 'added' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- ADDRESS MANAGEMENT ---

// Add a Shipping Address
exports.addAddress = async (req, res) => {
  const { street, city, state, postalCode, country, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    user.addresses.push({
      street,
      city,
      state,
      postalCode,
      country: country || 'India',
      isDefault: user.addresses.length === 0 ? true : isDefault
    });

    await user.save();
    return res.status(200).json({ success: true, message: 'Address added successfully', data: user.addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  const { addressId } = req.params;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
    await user.save();

    return res.status(200).json({ success: true, message: 'Address deleted successfully', data: user.addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
