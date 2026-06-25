const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'ai'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatbotConversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // Optional for non-logged-in guest sessions
  sessionId: { type: String, required: true, index: true },
  messages: [MessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('ChatbotConversation', ChatbotConversationSchema);
