const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // Polymorphic: User or Employee
  recipientModel: { type: String, required: true, enum: ['User', 'Employee'] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['Order', 'Promo', 'Alert', 'System'], default: 'System' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
