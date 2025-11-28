// backend/src/index.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import aiRoutes from "./routes/ai.route.js";
import { app, server } from "./lib/socket.js";

// Load environment variables FIRST
dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Add logging middleware to debug routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes); // Make sure AI routes are registered

// Test route to verify API is working
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!", timestamp: new Date() });
});

// Health check for AI service
app.get("/api/ai/health", (req, res) => {
  res.json({ 
    status: "AI service is running",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date()
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("=================================");
  console.log(`Server is running on PORT: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Not Set'}`);
  console.log(`Gemini API Key: ${process.env.GEMINI_API_KEY ? 'Set' : 'Not Set'}`);
  console.log("=================================");
  connectDB();
});