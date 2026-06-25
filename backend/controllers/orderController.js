const Order = require('../models/Order');
const Medicine = require('../models/Medicine');
const Cart = require('../models/Cart');
const Payment = require('../models/Payment');
const Stripe = require('stripe');
const Razorpay = require('razorpay');

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const razorpayInstance = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

// Helper to generate Invoice ID
const generateInvoice = (order) => {
  return `/invoices/KSJ-INV-${order.orderId}.pdf`;
};

// Checkout & Place Order
exports.createOrder = async (req, res) => {
  const { items, shippingAddress, billingAddress, paymentMethod, couponCode } = req.body;
  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
    }

    let subtotal = 0;
    const validatedItems = [];

    // Verify stock and prices
    for (const item of items) {
      const med = await Medicine.findById(item.medicine);
      if (!med) {
        return res.status(404).json({ success: false, message: `Medicine ${item.name} not found` });
      }
      if (med.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${med.name}. Available: ${med.stock}`
        });
      }

      // Deduct stock immediately (soft booking)
      med.stock -= item.quantity;
      await med.save();

      const itemPrice = med.discountPrice > 0 ? med.discountPrice : med.price;
      subtotal += itemPrice * item.quantity;
      validatedItems.push({
        medicine: med._id,
        name: med.name,
        price: itemPrice,
        quantity: item.quantity
      });
    }

    // Calculations
    const gstRate = 0.12; // 12% GST on medicines
    const gst = parseFloat((subtotal * gstRate).toFixed(2));
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping above 500 INR
    let discount = 0;

    if (couponCode === 'WELCOME10') {
      discount = parseFloat((subtotal * 0.10).toFixed(2)); // 10% discount
    }

    const grandTotal = parseFloat((subtotal + gst + shipping - discount).toFixed(2));

    const timestamp = Date.now();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderId = `KSJ-ORD-${timestamp}-${rand}`;

    const order = new Order({
      orderId,
      customer: req.user._id,
      items: validatedItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      totals: { subtotal, gst, shipping, discount, grandTotal },
      paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Pending'
    });

    order.trackingDetails = {
      carrier: 'KSJ Logistics Partner',
      trackingNumber: `TRK-${rand}-${timestamp}`,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      statusUpdates: [{ status: 'Pending', comment: 'Order placed, awaiting processing.' }]
    };

    order.invoiceURI = generateInvoice(order);
    await order.save();

    // Clear user cart after checkout
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Handle payment integrations
    if (paymentMethod === 'Stripe') {
      if (!stripe) {
        return res.status(200).json({
          success: true,
          message: 'Order created with MOCK Stripe payment intent.',
          order,
          clientSecret: 'mock_stripe_client_secret_' + Math.random()
        });
      }
      // Create Stripe Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(grandTotal * 100), // Stripe expects cents
        currency: 'inr',
        metadata: { orderId: order.orderId }
      });
      return res.status(200).json({
        success: true,
        order,
        clientSecret: paymentIntent.client_secret
      });
    } else if (paymentMethod === 'Razorpay') {
      if (!razorpayInstance) {
        return res.status(200).json({
          success: true,
          message: 'Order created with MOCK Razorpay order credentials.',
          order,
          razorpayOrderId: 'rzp_order_mock_' + Math.random()
        });
      }
      // Create Razorpay Order
      const rzpOrder = await razorpayInstance.orders.create({
        amount: Math.round(grandTotal * 100), // Razorpay expects paisa
        currency: 'INR',
        receipt: order.orderId
      });
      return res.status(200).json({
        success: true,
        order,
        razorpayOrderId: rzpOrder.id
      });
    }

    // Default to COD (Cash on Delivery)
    return res.status(201).json({ success: true, message: 'Order placed under Cash on Delivery mode', order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Payment Confirmation
exports.verifyPayment = async (req, res) => {
  const { orderId, transactionId, paymentGateway, status } = req.body;
  try {
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (status === 'success') {
      order.paymentStatus = 'Paid';
      order.orderStatus = 'Processing';
      order.trackingDetails.statusUpdates.push({ status: 'Processing', comment: 'Payment verified successfully.' });
      await order.save();

      const payment = new Payment({
        order: order._id,
        transactionId,
        paymentGateway,
        amount: order.totals.grandTotal,
        status: 'Captured'
      });
      await payment.save();

      return res.status(200).json({ success: true, message: 'Payment confirmed and updated', order });
    } else {
      order.paymentStatus = 'Failed';
      order.trackingDetails.statusUpdates.push({ status: 'Pending', comment: 'Payment transaction failed.' });
      await order.save();

      // Return items back to stock
      for (const item of order.items) {
        await Medicine.findByIdAndUpdate(item.medicine, { $inc: { stock: item.quantity } });
      }

      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Order & Tracking details
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('items.medicine');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Customer Order History
exports.getCustomerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Order Status (Employee / Pharmacist / Admin)
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { orderStatus, comment, carrier, trackingNumber } = req.body;
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = orderStatus;
    if (carrier) order.trackingDetails.carrier = carrier;
    if (trackingNumber) order.trackingDetails.trackingNumber = trackingNumber;

    order.trackingDetails.statusUpdates.push({
      status: orderStatus,
      comment: comment || `Order state changed to: ${orderStatus}`
    });

    await order.save();
    return res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Handle return request
exports.requestReturn = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.orderStatus !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Can only request return for delivered orders' });
    }

    order.returnRequest = {
      reason,
      status: 'Requested',
      refundAmount: order.totals.grandTotal
    };

    order.trackingDetails.statusUpdates.push({
      status: 'Returned',
      comment: `Return requested: ${reason}`
    });

    await order.save();
    return res.status(200).json({ success: true, message: 'Return request submitted', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin list all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('customer', 'name email').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
