const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatbotConversation = require('../models/ChatbotConversation');
const Medicine = require('../models/Medicine');

const DISCLAIMER = "\n\n*Note: I am your AI assistant, not a doctor. Please consult a healthcare professional for clinical advice or treatment.*";

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

    // Database Search logic for medicines availability/information
    const cleanMsg = message.toLowerCase().replace(/[?,.!]/g, '');
    const words = cleanMsg.split(/\s+/).filter(w => 
      w.length > 2 && 
      !['available', 'not', 'have', 'you', 'for', 'any', 'does', 'shop', 'store', 'buy', 'get', 'with', 'medicine', 'medicines', 'tablet', 'tablets', 'syrup', 'syrups', 'please', 'needed', 'status', 'deliver', 'delivered', 'order', 'add', 'cart', 'to', 'put'].includes(w)
    );

    let foundMedicines = [];
    if (words.length > 0) {
      const regexQueries = words.map(w => new RegExp(w, 'i'));
      foundMedicines = await Medicine.find({
        $or: [
          { name: { $in: regexQueries } },
          { genericName: { $in: regexQueries } },
          { brand: { $in: regexQueries } }
        ]
      }).populate('category', 'name');
    }

    let botResponse = '';

    // If Gemini key is set, call the actual API
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const dbMedicinesInfo = foundMedicines.map(med => {
          const stockText = med.stock > 0 ? `In Stock (${med.stock} units)` : "Out of Stock";
          const rxText = med.requiresPrescription ? "⚠️ Requires Prescription" : "Over-The-Counter (OTC)";
          return `Name: ${med.name}, SKU: ${med.sku}, Generic Name: ${med.genericName || 'N/A'}, Brand: ${med.brand}, Price: ₹${med.price}, Stock: ${stockText}, Type: ${rxText}, Category: ${med.category ? med.category.name : 'N/A'}, Link: /product/${med._id}`;
        }).join('\n');

        const promptContext = `
          You are an AI-powered medical store assistant for "KSJ Global Medical" (Tagline: "Your Trusted Online Medical Store").
          You answer medicine-related queries, guide users through the website features (like shop, categories, cart, user dashboards), and recommend healthcare products.
          
          Here are matching medicines currently in our database:
          ${dbMedicinesInfo || 'No direct database matches found.'}

          Guidelines:
          1. If the user is asking about the availability of a specific medicine and it's listed above in the database matches, confirm its availability using the exact price, brand, stock, and prescription details. Output a markdown link to the product using the relative path \`/product/<id>\` (e.g. [View Product](/product/<id>)).
          2. If the user asks about a medicine that is NOT in the database, explain that we don't have it in stock right now, but suggest checking back later or browsing categories.
          3. Emphasize that you are an AI assistant and advise consulting a pharmacist or doctor.
          4. Keep responses clean, concise, and formatted in markdown.
          5. Do NOT output a disclaimer in your response text itself because the backend will prepend a standard one.
          
          User Message: "${message}"
        `;

        const result = await model.generateContent(promptContext);
        const responseText = await result.response.text();
        botResponse = responseText.trim();
      } catch (geminiError) {
        console.error('Gemini API Error:', geminiError.message);
        botResponse = getFallbackResponse(message, foundMedicines);
      }
    } else {
      // Fallback response system
      botResponse = getFallbackResponse(message, foundMedicines);
    }

    // Final response formatting: show friendly disclaimer note at the bottom for clinical queries, omit for greetings or orders.
    const isGreeting = ['hello', 'hi', 'hey', 'good morning', 'good evening', 'thank you', 'thanks'].some(g => cleanMsg.startsWith(g) || cleanMsg === g);
    const isOrderQuery = cleanMsg.includes('order') || cleanMsg.includes('track') || cleanMsg.includes('history');

    const finalResponseText = (isGreeting || isOrderQuery)
      ? botResponse
      : botResponse + DISCLAIMER;

    // Save AI response
    conversation.messages.push({ sender: 'ai', text: finalResponseText });
    await conversation.save();

    return res.status(200).json({
      success: true,
      reply: finalResponseText,
      sessionId,
      medicines: foundMedicines
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fallback search suggestions helper
function getFallbackResponse(query, foundMedicines) {
  const lowercaseQuery = query.toLowerCase();

  // 1. If we found matching medicines in database, return a detailed markdown answer!
  if (foundMedicines && foundMedicines.length > 0) {
    let reply = "Yes! We have the following matching medicine(s) in our store:\n\n";
    foundMedicines.forEach(med => {
      const stockText = med.stock > 0 ? `In Stock (${med.stock} units)` : "Out of Stock";
      const rxText = med.requiresPrescription ? "⚠️ Requires Prescription to purchase" : "Over-The-Counter (OTC)";
      reply += `💊 **${med.name}** (${med.brand})\n`;
      reply += `- **Generic Ingredient**: ${med.genericName || 'N/A'}\n`;
      reply += `- **Price**: ₹${med.price}\n`;
      reply += `- **Availability**: ${stockText}\n`;
      reply += `- **Prescription Status**: ${rxText}\n`;
      reply += `- **Product Link**: [View Product Details](/product/${med._id})\n\n`;
    });
    reply += "Please click the link(s) above to view details, upload your prescription, or add items to your cart.";
    return reply;
  }

  // 2. Generic fallbacks if no database matches found
  if (lowercaseQuery.includes('dolo') || lowercaseQuery.includes('paracetamol')) {
    return "We have Paracetamol options like Dolo 650mg in stock. Please browse here: [Browse Tablets](/shop?category=Tablets) or search the catalog directly.";
  }

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

  return "I'm sorry, I couldn't find a matching product in our database right now. You can check all available medicines in the shop here: [Go to Shop](/shop) or search again with a different spelling.";
}

// Get all chatbot conversations (for admin/employees)
exports.getAllConversations = async (req, res) => {
  try {
    const conversations = await ChatbotConversation.find({})
      .populate('user', 'name email phone')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Suggest an AI reply for a chatbot session dialogue history
exports.suggestReply = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const conversation = await ChatbotConversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation session not found' });
    }

    const messages = conversation.messages || [];
    if (messages.length === 0) {
      return res.status(200).json({ success: true, suggestion: 'Hello! How can we assist you today?' });
    }

    const historyText = messages
      .map(m => `${m.sender === 'user' ? 'Customer' : 'AI Assistant'}: ${m.text}`)
      .join('\n');

    let suggestion = '';

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const promptContext = `
          You are the support administrator/AI assistant for "KSJ Global Medical" (Your Trusted Online Medical Store).
          Below is a dialogue history between a customer and our online portal.
          Based on the conversation context, draft the next reply for the customer.
          
          Guidelines:
          1. Answer directly and naturally. Do NOT wrap your output in quotes or add prefix/suffix labels like "AI:" or "Here is a draft:".
          2. Be highly polite, professional, and clear.
          3. Use markdown for lists or bold text if helpful.
          4. Do NOT output standard clinical disclaimers in the text itself.
          
          Dialogue History:
          ${historyText}
          
          Suggested Response:
        `;

        const result = await model.generateContent(promptContext);
        const responseText = await result.response.text();
        suggestion = responseText.trim();
      } catch (geminiError) {
        console.error('Gemini Suggestion Error:', geminiError.message);
        suggestion = 'Thank you for reaching out. We have logged your query and will assist you shortly.';
      }
    } else {
      suggestion = 'Thank you for contacting KSJ Global Medical Support. How can we help you?';
    }

    return res.status(200).json({
      success: true,
      suggestion
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Send an admin reply directly into a chatbot conversation
exports.sendReply = async (req, res) => {
  const { sessionId } = req.params;
  const { text } = req.body;

  try {
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    let conversation = await ChatbotConversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation session not found' });
    }

    // Push the admin message as 'ai' sender so customer chatbot displays it
    conversation.messages.push({ sender: 'ai', text });
    await conversation.save();

    return res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


