// backend/src/controllers/ai.controller.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Initialize Gemini AI with better error handling
let genAI = null;
let initError = null;

try {
  if (!process.env.GEMINI_API_KEY) {
    initError = "GEMINI_API_KEY environment variable is not set";
    console.error("❌ " + initError);
  } else {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("✅ Gemini AI initialized successfully");
  }
} catch (error) {
  initError = `Failed to initialize Gemini AI: ${error.message}`;
  console.error("❌ " + initError);
}

export const getAIMessages = async (req, res) => {
  try {
    console.log("🔍 Getting AI messages for user:", req.user._id);
    
    const myId = req.user._id;
    const aiUserId = "ai-assistant";

    // Use $in operator and direct field matching to avoid ObjectId casting issues
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: aiUserId },
        { senderId: aiUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    console.log(`✅ Found ${messages.length} AI messages`);
    res.status(200).json(messages);
    
  } catch (error) {
    console.error("❌ Error in getAIMessages:", error.message);
    res.status(500).json({ 
      error: "Failed to retrieve AI messages",
      details: error.message 
    });
  }
};

export const sendMessageToAI = async (req, res) => {
  try {
    const { text } = req.body;
    const senderId = req.user._id;
    const aiUserId = "ai-assistant";

    console.log("💬 Sending message to AI:", text);

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    // Check if Gemini is available
    if (!genAI || initError) {
      console.error("❌ Gemini AI not available:", initError);
      return res.status(503).json({ 
        error: "AI service is temporarily unavailable",
        details: initError 
      });
    }

    // Save user message first
    const userMessage = new Message({
      senderId,
      receiverId: aiUserId,
      text: text.trim(),
    });
    await userMessage.save();
    console.log("✅ User message saved");

    let aiResponse = "I apologize, but I'm having trouble generating a response right now. Please try again in a moment.";

    try {
      // Generate AI response
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are a helpful AI assistant in a chat application. Please respond to this message in a friendly and conversational way (keep responses under 200 words): "${text.trim()}"`;
      
      const result = await model.generateContent(prompt);
      aiResponse = result.response.text();
      console.log("✅ AI response generated");
      
    } catch (aiError) {
      console.error("❌ Error generating AI response:", aiError.message);
      // Use fallback response
    }

    // Save AI response
    const aiMessage = new Message({
      senderId: aiUserId,
      receiverId: senderId,
      text: aiResponse,
    });
    await aiMessage.save();
    console.log("✅ AI message saved");

    // Emit real-time updates
    const userSocketId = getReceiverSocketId(senderId);
    if (userSocketId) {
      io.to(userSocketId).emit("newMessage", userMessage);
      io.to(userSocketId).emit("newMessage", aiMessage);
      console.log("✅ Messages sent via socket");
    }

    res.status(201).json({
      userMessage,
      aiMessage
    });

  } catch (error) {
    console.error("❌ Error in sendMessageToAI:", error.message);
    res.status(500).json({ 
      error: "Failed to process AI chat",
      details: error.message 
    });
  }
};