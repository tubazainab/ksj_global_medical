const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployeeTaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'], default: 'Pending' },
  assignedAt: { type: Date, default: Date.now },
  deadline: { type: Date }
});

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: [
      'Admin',
      'Manager',
      'Pharmacist',
      'Inventory Manager',
      'Sales Executive',
      'Customer Support',
      'Delivery Coordinator'
    ],
    required: true
  },
  permissions: [{ type: String }], // List of actions allowed, e.g., 'manage_inventory', 'update_orders', etc.
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  tasks: [EmployeeTaskSchema],
  performanceRating: { type: Number, default: 5.0 }
}, { timestamps: true });

EmployeeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

EmployeeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Employee', EmployeeSchema);
