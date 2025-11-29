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

// Language codes mapping for translation with examples
const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
};

// Language-specific examples to help AI understand the script
const LANGUAGE_EXAMPLES = {
  hi: "उदाहरण: नमस्ते, मैं आपकी मदद करने के लिए यहाँ हूँ।",
  gu: "ઉદાહરણ: નમસ્તે, હું તમારી મદદ કરવા માટે અહીં છું.",
  mr: "उदाहरण: नमस्कार, मी तुमची मदत करण्यासाठी येथे आहे.",
  ta: "உதாரணம்: வணக்கம், நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்.",
  te: "ఉదాహరణ: నమస్కారం, నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను.",
  bn: "উদাহরণ: নমস্কার, আমি আপনাকে সাহায্য করতে এখানে আছি।",
  kn: "ಉದಾಹರಣೆ: ನಮಸ್ಕಾರ, ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ.",
  ml: "ഉദാഹരണം: നമസ്കാരം, ഞാൻ നിങ്ങളെ സഹായിക്കാൻ ഇവിടെയുണ്ട്.",
  pa: "ਉਦਾਹਰਣ: ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰਨ ਲਈ ਇੱਥੇ ਹਾਂ।",
};

export const getAIMessages = async (req, res) => {
  try {
    console.log("🔍 Getting AI messages for user:", req.user._id);
    
    const myId = req.user._id;
    const aiUserId = "ai-assistant";

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
    const { text, language = "en" } = req.body;
    const senderId = req.user._id;
    const aiUserId = "ai-assistant";

    console.log("💬 Sending message to AI:", text, "Language:", language);

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
      // Generate AI response with language specification
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const languageName = LANGUAGE_NAMES[language] || "English";
      
      let prompt;
      if (language === "en") {
        prompt = `You are a helpful AI assistant in a chat application. Please respond to this message in a friendly and conversational way (keep responses under 200 words): "${text.trim()}"`;
      } else {
        // More explicit translation instruction with examples
        const languageExample = LANGUAGE_EXAMPLES[language] || "";
        
        prompt = `You are a helpful AI assistant in a chat application. 

CRITICAL REQUIREMENT: You MUST respond COMPLETELY in ${languageName} language using proper ${languageName} script. DO NOT use English or Roman script at all.

${languageExample ? `Script Example: ${languageExample}` : ''}

User's message: "${text.trim()}"

Your Response Requirements:
1. Write your ENTIRE response using ${languageName} script/characters
2. Be helpful, friendly, and conversational
3. Keep response under 200 words
4. Use native ${languageName} words, not transliterated English
5. If you don't understand the message, still respond in ${languageName}

Now write your complete response in ${languageName} script:`;
      }
      
      console.log("🤖 Generating AI response in", languageName);
      console.log("📝 Prompt:", prompt);
      
      const result = await model.generateContent(prompt);
      aiResponse = result.response.text();
      
      console.log("✅ AI response generated:", aiResponse);
      console.log("✅ Language:", languageName);
      
    } catch (aiError) {
      console.error("❌ Error generating AI response:", aiError.message);
      // Use fallback response in selected language
      if (language !== "en") {
        aiResponse = `क्षमा करें, मैं अभी आपको उत्तर देने में असमर्थ हूं। कृपया पुनः प्रयास करें। (Sorry, I'm unable to respond right now. Please try again.)`;
      }
    }

    // Save AI response
    const aiMessage = new Message({
      senderId: aiUserId,
      receiverId: senderId,
      text: aiResponse,
    });
    await aiMessage.save();
    console.log("✅ AI message saved");

    // Send response BEFORE emitting to socket to avoid race conditions
    res.status(201).json({
      userMessage,
      aiMessage
    });

    // Emit real-time updates AFTER sending response
    // Only emit to the user's socket if they're connected
    const userSocketId = getReceiverSocketId(senderId);
    if (userSocketId) {
      // Small delay to ensure client has processed the HTTP response
      setTimeout(() => {
        io.to(userSocketId).emit("newMessage", userMessage);
        io.to(userSocketId).emit("newMessage", aiMessage);
        console.log("✅ Messages sent via socket");
      }, 100);
    }

  } catch (error) {
    console.error("❌ Error in sendMessageToAI:", error.message);
    res.status(500).json({ 
      error: "Failed to process AI chat",
      details: error.message 
    });
  }
};