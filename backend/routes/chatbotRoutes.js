const express = require('express');
const router = express.Router();
const { queryChatbot, getAllConversations } = require('../controllers/chatbotController');
const { protect, restrictTo } = require('../middleware/auth');

// Retrieve all conversation logs for Admin/Staff directory
router.get('/conversations', protect, restrictTo('Admin', 'Manager', 'Pharmacist', 'Sales Executive', 'Delivery Coordinator', 'Customer Support'), getAllConversations);

// Handles guest or authenticated chatbot dialog sessions
router.post('/query', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ksj_secret_auth_token_for_pharmacy_2026');
      req.user = { _id: decoded.id };
    } catch (err) {
      // Ignore token decode errors to fall back to guest chat permissions
    }
  }
  next();
}, queryChatbot);

module.exports = router;
