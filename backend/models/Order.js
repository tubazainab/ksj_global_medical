const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  name: { type: String, required: true },
  price: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 }
});

const StatusUpdateSchema = new mongoose.Schema({
  status: { type: String, required: true },
  comment: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  totals: {
    subtotal: { type: Number, required: true },
    gst: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true }
  },
  paymentMethod: { type: String, enum: ['Stripe', 'Razorpay', 'COD'], required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Pending'
  },
  prescriptionURI: { type: String }, // For medicine uploads
  trackingDetails: {
    carrier: { type: String, default: 'KSJ Delivery Partner' },
    trackingNumber: { type: String },
    estimatedDelivery: { type: Date },
    statusUpdates: [StatusUpdateSchema]
  },
  returnRequest: {
    reason: { type: String },
    status: { type: String, enum: ['None', 'Requested', 'Approved', 'Rejected', 'Completed'], default: 'None' },
    refundAmount: { type: Number, default: 0 }
  },
  invoiceURI: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
