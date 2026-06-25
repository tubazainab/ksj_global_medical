const Employee = require('../models/Employee');
const Order = require('../models/Order');
const Medicine = require('../models/Medicine');

// Get all employees (Admin/Manager restricted)
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}).select('-password');
    return res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Employee Role and Permissions (Admin only)
exports.updateEmployeeRole = async (req, res) => {
  const { id } = req.params;
  const { role, permissions } = req.body;
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    if (role) employee.role = role;
    if (permissions) employee.permissions = permissions;

    await employee.save();

    return res.status(200).json({
      success: true,
      message: 'Employee role/permissions updated successfully',
      data: {
        id: employee._id,
        employeeId: employee.employeeId,
        role: employee.role,
        permissions: employee.permissions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Employee Activation Status (Admin only)
exports.toggleEmployeeStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Active' or 'Inactive'
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    employee.status = status;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: `Employee is now ${status}`,
      data: employee
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Assign Task to Employee (Admin/Manager)
exports.assignTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline } = req.body;
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    employee.tasks.push({
      title,
      description,
      status: 'Pending',
      deadline: deadline ? new Date(deadline) : undefined
    });

    await employee.save();

    return res.status(200).json({ success: true, message: 'Task assigned successfully', data: employee.tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Task Status (Employee updating own tasks)
exports.updateTaskStatus = async (req, res) => {
  const { taskId, status } = req.body; // 'Pending', 'In Progress', 'Completed', 'Cancelled'
  try {
    const employee = await Employee.findById(req.user._id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const task = employee.tasks.id(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.status = status;
    await employee.save();

    return res.status(200).json({ success: true, message: 'Task status updated', data: employee.tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Employee Dashboard Metrics (Specific to role permissions)
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

    const role = employee.role;
    const metrics = {
      role,
      tasks: employee.tasks,
      performanceRating: employee.performanceRating
    };

    // Include context-specific inventory metrics
    if (role === 'Inventory Manager' || role === 'Pharmacist' || role === 'Admin') {
      const lowStockCount = await Medicine.countDocuments({ $expr: { $lte: ['$stock', '$minStockLevel'] } });
      metrics.lowStockAlerts = lowStockCount;
    }

    // Include order status metrics
    if (role === 'Sales Executive' || role === 'Delivery Coordinator' || role === 'Admin') {
      const pendingOrdersCount = await Order.countDocuments({ orderStatus: 'Pending' });
      const processingOrdersCount = await Order.countDocuments({ orderStatus: 'Processing' });
      const shippedOrdersCount = await Order.countDocuments({ orderStatus: 'Shipped' });
      metrics.orderQueue = {
        Pending: pendingOrdersCount,
        Processing: processingOrdersCount,
        Shipped: shippedOrdersCount
      };
    }

    return res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
