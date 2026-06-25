const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatbotConversation = require('../models/ChatbotConversation');
const Medicine = require('../models/Medicine');

const DISCLAIMER = "⚠️ *Medical Disclaimer: The suggestions provided by this AI assistant are for informational purposes only and do not replace professional medical advice, diagnosis, or treatment. Please consult a qualified healthcare practitioner before taking any medicines.* \n\n";

// Query Chatbot
exports.queryChatbot = async (req, res) => {
  const { sessionId, message } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    let conversation = await ChatbotConversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new ChatbotConversation({
        sessionId,
        user: req.user ? req.user._id : undefined,
        messages: []
      });
    }

    // Save user message
    conversation.messages.push({ sender: 'user', text: message });

    let botResponse = '';

    // If Gemini key is set, call the actual API
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const promptContext = `
          You are an AI-powered medical store assistant for "KSJ Global Medical" (Tagline: "Your Trusted Online Medical Store").
          You answer medicine-related queries, guide users through the website features (like shop, categories, cart, user dashboards), and recommend healthcare products.
          
          Guidelines:
          1. Answer medicine-related queries accurately based on standard healthcare facts.
          2. Emphasize that you are an AI assistant and advise consulting a pharmacist or doctor.
          3. Keep responses clean, concise, and formatted in markdown.
          4. Do NOT output a disclaimer in your response text itself because the backend will prepend a standard one.
          
          User Message: "${message}"
        `;

        const result = await model.generateContent(promptContext);
        const responseText = await result.response.text();
        botResponse = responseText.trim();
      } catch (geminiError) {
        console.error('Gemini API Error:', geminiError.message);
        botResponse = getFallbackResponse(message);
      }
    } else {
      // Fallback response system
      botResponse = getFallbackResponse(message);
    }

    // Final response (Always prepended with the medical disclaimer if clinical query, or as a general header)
    const finalResponseText = botResponse.toLowerCase().includes('order')
      ? botResponse
      : DISCLAIMER + botResponse;

    // Save AI response
    conversation.messages.push({ sender: 'ai', text: finalResponseText });
    await conversation.save();

    return res.status(200).json({
      success: true,
      reply: finalResponseText,
      sessionId
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fallback search suggestions helper
function getFallbackResponse(query) {
  const lowercaseQuery = query.toLowerCase();

  if (lowercaseQuery.includes('fever') || lowercaseQuery.includes('pain') || lowercaseQuery.includes('headache')) {
    return "For mild fever or general body pain, common over-the-counter tablets include Paracetamol (Crocin/Dolo 650) or Ibuprofen (Combiflam). \n\nYou can browse these medicines in our tablets section: [Browse Tablets](/shop?category=Tablets).";
  }

  if (lowercaseQuery.includes('cough') || lowercaseQuery.includes('cold') || lowercaseQuery.includes('throat')) {
    return "For dry or wet cough, common options include Ascoril, Benadryl, or Honitus syrups. \n\nYou can find these in our syrup range: [Browse Syrups](/shop?category=Syrups).";
  }

  if (lowercaseQuery.includes('vitamin') || lowercaseQuery.includes('supplement') || lowercaseQuery.includes('energy')) {
    return "To boost immunity and stamina, popular options include Multivitamins, Vitamin C, Zincovit, or Calcium supplements. \n\nCheck out: [Browse Vitamins & Supplements](/shop?category=Vitamins%20%26%20Supplements).";
  }

  if (lowercaseQuery.includes('order') || lowercaseQuery.includes('track') || lowercaseQuery.includes('history')) {
    return "To track your current purchases or download invoices, log into your profile and go to the Order Tracking tab: [My Dashboard](/dashboard).";
  }

  if (lowercaseQuery.includes('payment') || lowercaseQuery.includes('stripe') || lowercaseQuery.includes('razorpay')) {
    return "We support Stripe (for global credit/debit cards) and Razorpay (for local cards, NetBanking, and UPI) during checkout. Both are secured using SSL encryption.";
  }

  if (lowercaseQuery.includes('hello') || lowercaseQuery.includes('hi') || lowercaseQuery.includes('hey')) {
    return "Hello! Welcome to KSJ Global Medical. I am your AI assistant. How can I help you today? You can ask about medicines, vitamins, category recommendations, or checking your order status!";
  }

  return "I understand your query. For specific medicines or devices, you can browse all categories in our store: [Go to Shop](/shop) or search by name. For medical conditions, please consult a practitioner.";
}
