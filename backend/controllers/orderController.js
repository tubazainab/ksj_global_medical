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

// Generate TAX Invoice HTML
exports.getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email phone');
    if (!order) {
      return res.status(404).send('<h1>Order not found</h1>');
    }

    const itemsRows = order.items.map((it, idx) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;"><b>${it.name}</b></td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${it.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${it.price}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${parseFloat(it.price) * it.quantity}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${order.orderId}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 14px; line-height: 24px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f4c81; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #0f4c81; }
          .meta-info { text-align: right; }
          .billing-info { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .billing-info div { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
          .totals { text-align: right; }
          .totals table { width: 300px; margin-left: auto; }
          .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          .print-btn { background: #10b981; color: #fff; border: 0; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; display: block; margin: 20px auto 0; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="logo">KSJ Global Medical</div>
              <div style="font-size: 11px; color: #666;">Your Trusted Online Medical Store</div>
              <div style="font-size: 11px; color: #666;">Lic No: DL-39281-KSJ | GSTIN: 27AAAAA1111A1Z1</div>
            </div>
            <div class="meta-info">
              <h2 style="margin: 0; color: #0f4c81;">TAX INVOICE</h2>
              <div style="font-size: 12px; margin-top: 5px;">
                <b>Invoice Ref:</b> ${order.orderId}<br>
                <b>Date:</b> ${new Date(order.createdAt).toLocaleDateString()}<br>
                <b>Status:</b> ${order.paymentStatus} (${order.paymentMethod})
              </div>
            </div>
          </div>

          <div class="billing-info">
            <div>
              <h4 style="margin: 0 0 5px; color: #0f4c81;">Sold By:</h4>
              <b>KSJ Pharmacy Pvt. Ltd.</b><br>
              12, Medical Plaza, Sector 4<br>
              New Delhi, India, 110001<br>
              support@ksjmedical.com
            </div>
            <div style="text-align: right;">
              <h4 style="margin: 0 0 5px; color: #0f4c81;">Shipped To:</h4>
              <b>${order.customer?.name || 'Customer'}</b><br>
              ${order.shippingAddress?.street || ''}<br>
              ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.postalCode || ''}<br>
              Phone: ${order.customer?.phone || ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">S.No</th>
                <th>Medicine / Product Details</th>
                <th style="width: 80px; text-align: center;">Qty</th>
                <th style="width: 100px; text-align: right;">Rate (₹)</th>
                <th style="width: 100px; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td style="padding: 5px 0;">Subtotal:</td>
                <td style="padding: 5px 0; text-align: right;">₹${order.totals.subtotal}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">GST Tax (12%):</td>
                <td style="padding: 5px 0; text-align: right;">₹${order.totals.gst}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">Shipping Charges:</td>
                <td style="padding: 5px 0; text-align: right;">₹${order.totals.shipping}</td>
              </tr>
              ${order.totals.discount > 0 ? `
              <tr style="color: #10b981; font-weight: bold;">
                <td style="padding: 5px 0;">Discount:</td>
                <td style="padding: 5px 0; text-align: right;">- ₹${order.totals.discount}</td>
              </tr>
              ` : ''}
              <tr style="font-weight: bold; font-size: 16px; border-top: 2px solid #333; color: #0f4c81;">
                <td style="padding: 10px 0;">Grand Total:</td>
                <td style="padding: 10px 0; text-align: right;">₹${order.totals.grandTotal}</td>
              </tr>
            </table>
          </div>

          <button class="print-btn" onclick="window.print()">Print / Download PDF</button>

          <div class="footer">
            <p>This is a computer-generated GST Tax Invoice. No signature is required.</p>
            <p>Thank you for choosing KSJ Global Medical as your wellness partner.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    return res.status(500).send(`<h1>Server error generating invoice: ${error.message}</h1>`);
  }
};
