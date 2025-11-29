// frontend/src/store/useAIChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useAIChatStore = create((set, get) => ({
  messages: [],
  isMessagesLoading: false,
  isSendingMessage: false,

  getAIMessages: async () => {
    set({ isMessagesLoading: true });
    try {
      console.log("Fetching AI messages...");
      const res = await axiosInstance.get("/ai/messages");
      console.log("AI messages fetched:", res.data);
      set({ messages: res.data });
    } catch (error) {
      console.error("Error fetching AI messages:", error);
      
      if (error.response?.status === 401) {
        toast.error("Please log in to access AI chat");
      } else if (error.response?.status === 404) {
        toast.error("AI service not found. Please contact support.");
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.message === "Network Error") {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to load AI messages. Please try again.");
      }
      
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessageToAI: async (text, language = "en") => {
    if (!text.trim()) return;

    set({ isSendingMessage: true });
    try {
      console.log("Sending message to AI:", text, "Language:", language);
      const res = await axiosInstance.post("/ai/chat", { 
        text: text.trim(),
        language 
      });
      console.log("AI response received:", res.data);
      
      // Add both messages directly from HTTP response
      // DO NOT wait for socket events as they will cause duplicates
      const currentMessages = get().messages;
      set({ 
        messages: [...currentMessages, res.data.userMessage, res.data.aiMessage]
      });
      
    } catch (error) {
      console.error("Error sending message to AI:", error);
      
      if (error.response?.status === 401) {
        toast.error("Please log in to chat with AI");
      } else if (error.response?.status === 400) {
        toast.error("Please enter a valid message");
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.message === "Network Error") {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to send message to AI. Please try again.");
      }
    } finally {
      set({ isSendingMessage: false });
    }
  },

  subscribeToAIMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.log("No socket connection available for AI messages");
      return;
    }

    console.log("Subscribing to AI messages");
    
    // Only listen for messages when OTHER users send to AI
    // This prevents duplicates from our own messages
    socket.on("newMessage", (newMessage) => {
      const currentUserId = useAuthStore.getState().authUser?._id;
      
      // Only add message if:
      // 1. It's an AI message (from ai-assistant)
      // 2. It's directed to this user
      // 3. It's not from this user (to prevent duplicates from our own sends)
      if (
        newMessage.senderId === "ai-assistant" && 
        newMessage.receiverId === currentUserId
      ) {
        // Check if message already exists to prevent duplicates
        const messageExists = get().messages.some(msg => msg._id === newMessage._id);
        
        if (!messageExists) {
          console.log("Received new AI message via socket:", newMessage);
          set({
            messages: [...get().messages, newMessage],
          });
        }
      }
    });
  },

  unsubscribeFromAIMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      console.log("Unsubscribing from AI messages");
      socket.off("newMessage");
    }
  },

  clearMessages: () => set({ messages: [] }),
}));