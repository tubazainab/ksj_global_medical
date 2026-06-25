const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  performedBy: { type: mongoose.Schema.Types.ObjectId, required: true }, // Polymorphic: Employee or User
  performedByModel: { type: String, required: true, enum: ['Employee', 'User'] },
  action: { type: String, required: true }, // e.g. 'ADD_PRODUCT', 'UPDATE_ROLE', 'DEACTIVATE_EMPLOYEE', 'PROCESS_REFUND'
  description: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
