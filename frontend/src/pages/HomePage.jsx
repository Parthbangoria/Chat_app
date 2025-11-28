// frontend/src/pages/HomePage.jsx
import { useState } from "react";
import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import AIChatContainer from "../components/AIChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const [showAIChat, setShowAIChat] = useState(false);

  return (
    <>
      <div className="h-screen bg-base-200">
        <div className="flex items-center justify-center pt-20 px-4">
          <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
            <div className="flex h-full rounded-lg overflow-hidden">
              <Sidebar onAIChat={() => setShowAIChat(true)} />

              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChatContainer onClose={() => setShowAIChat(false)} />
      )}
    </>
  );
};

export default HomePage;