const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  transactionId: { type: String, required: true },
  paymentGateway: { type: String, enum: ['Stripe', 'Razorpay'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['Captured', 'Failed', 'Refunded'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
