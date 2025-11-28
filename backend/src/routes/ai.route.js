// backend/src/routes/ai.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { sendMessageToAI, getAIMessages } from "../controllers/ai.controller.js";

const router = express.Router();

// Test route (no auth required)
router.get("/test", (req, res) => {
  res.json({ 
    message: "AI routes are working!",
    timestamp: new Date(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Health check (no auth required)
router.get("/health", (req, res) => {
  res.json({ 
    status: "AI service is running",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date()
  });
});

// Protected routes
router.get("/messages", protectRoute, getAIMessages);
router.post("/chat", protectRoute, sendMessageToAI);

// Add logging middleware for debugging
router.use((req, res, next) => {
  console.log(`AI Route: ${req.method} ${req.originalUrl}`);
  console.log("Headers:", req.headers);
  next();
});

export default router;