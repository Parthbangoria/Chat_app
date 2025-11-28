import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

const seedAIBot = async () => {
  try {
    await connectDB();

    const existingBot = await User.findOne({ email: "aibot@chatapp.com" });
    if (existingBot) {
      console.log("AI Bot already exists");
      return;
    }

    const aiBot = new User({
      email: "aibot@chatapp.com",
      fullName: "AI Assistant",
      password: "dummy_password", // Won't be used for login
      profilePic: "https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
    });

    await aiBot.save();
    console.log("AI Bot created successfully");
  } catch (error) {
    console.error("Error seeding AI bot:", error);
  }
};

seedAIBot();