// backend/src/models/message.model.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.Mixed, // Changed from ObjectId to Mixed to allow strings
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.Mixed, // Changed from ObjectId to Mixed to allow strings
      ref: "User", 
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;