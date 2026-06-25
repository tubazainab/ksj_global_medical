const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'ksj_secret_auth_token_for_pharmacy_2026';

// Helper to generate JWT Token
const generateToken = (id, role, type) => {
  return jwt.sign({ id, role, type }, JWT_SECRET, { expiresIn: '7d' });
};

// Simulated email/SMS sender (logs to console + sends if config exists)
const sendNotificationMessage = async (toEmail, subject, text) => {
  console.log(`[Notification Send] To: ${toEmail} | Subject: ${subject} | Message: ${text}`);
  // Pluggable nodemailer configuration
  if (process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '2525'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ksjglobalmedical.com',
        to: toEmail,
        subject: subject,
        text: text
      });
    } catch (err) {
      console.error('Mail delivery failure:', err.message);
    }
  }
};

// Register Customer
exports.registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = new User({
      name,
      email,
      phone,
      password,
      otpCode,
      otpExpires
    });

    await user.save();

    // Initialize cart and wishlist
    await new Cart({ user: user._id, items: [] }).save();
    await new Wishlist({ user: user._id, medicines: [] }).save();

    // Send OTP
    await sendNotificationMessage(
      email,
      'KSJ Global Medical - Verify Your Account',
      `Welcome to KSJ Global Medical! Your OTP for verification is ${otpCode}. Valid for 10 minutes.`
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful. OTP sent to email/phone.',
      userId: user._id
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Customer OTP
exports.verifyOTP = async (req, res) => {
  const { email, otpCode } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User is already verified' });
    }

    if (!user.otpCode || user.otpCode !== otpCode || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id, 'user', 'user');

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Login Customer
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account is blocked. Please contact support.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      // Re-trigger OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otpCode;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendNotificationMessage(
        email,
        'KSJ Global Medical - OTP Re-verification',
        `Your OTP for account verification is ${otpCode}.`
      );

      return res.status(403).json({
        success: false,
        message: 'Account not verified. OTP has been re-sent.',
        requiresVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user._id, 'user', 'user');

    return res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Forgot Password Request
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN for simple mobile resets
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    await user.save();

    await sendNotificationMessage(
      email,
      'KSJ Global Medical - Password Reset PIN',
      `Your password reset PIN is ${resetToken}. Valid for 30 minutes.`
    );

    return res.status(200).json({ success: true, message: 'Password reset PIN sent to your email.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reset Password with PIN
exports.resetPassword = async (req, res) => {
  const { email, resetPin, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: resetPin,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset PIN' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successful. You can log in now.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Register Employee (Admin restricted)
exports.registerEmployee = async (req, res) => {
  const { name, email, password, role, permissions, customEmployeeId } = req.body;
  try {
    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Employee already exists with this email' });
    }

    // Generate ID automatically or manually
    let employeeId = customEmployeeId;
    if (!employeeId) {
      const year = new Date().getFullYear();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      employeeId = `EMP-${year}-${randNum}`;
    }

    const employee = new Employee({
      employeeId,
      name,
      email,
      password,
      role,
      permissions: permissions || [],
      status: 'Active'
    });

    await employee.save();

    return res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        permissions: employee.permissions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Employee Login
exports.loginEmployee = async (req, res) => {
  const { email, password } = req.body;
  try {
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    if (employee.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact Admin.' });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(employee._id, employee.role, 'employee');

    return res.status(200).json({
      success: true,
      token,
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        permissions: employee.permissions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
