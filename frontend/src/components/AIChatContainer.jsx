// frontend/src/components/AIChatContainer.jsx
import { useEffect, useRef, useState } from "react";
import { useAIChatStore } from "../store/useAIChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Bot, Send, X, Languages } from "lucide-react";
import MessageSkeleton from "./skeletons/MessageSkeleton";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi - हिंदी" },
  { code: "gu", name: "Gujarati - ગુજરાતી" },
  { code: "mr", name: "Marathi - मराठी" },
  { code: "ta", name: "Tamil - தமிழ்" },
  { code: "te", name: "Telugu - తెలుగు" },
  { code: "bn", name: "Bengali - বাংলা" },
  { code: "kn", name: "Kannada - ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam - മലയാളം" },
  { code: "pa", name: "Punjabi - ਪੰਜਾਬੀ" },
];

const AIChatContainer = ({ onClose }) => {
  const {
    messages,
    getAIMessages,
    sendMessageToAI,
    isMessagesLoading,
    isSendingMessage,
    subscribeToAIMessages,
    unsubscribeFromAIMessages,
  } = useAIChatStore();
  
  const { authUser } = useAuthStore();
  const [inputText, setInputText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const messageEndRef = useRef(null);

  useEffect(() => {
    getAIMessages();
    subscribeToAIMessages();

    return () => unsubscribeFromAIMessages();
  }, [getAIMessages, subscribeToAIMessages, unsubscribeFromAIMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSendingMessage) return;

    const messageText = inputText;
    setInputText("");
    await sendMessageToAI(messageText, selectedLanguage);
  };

  if (isMessagesLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-base-100 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-medium">AI Assistant</h3>
                <p className="text-sm text-base-content/70">Powered by Gemini AI</p>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
          <MessageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">AI Assistant</h3>
              <p className="text-sm text-base-content/70">Powered by Gemini AI</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Selection */}
        <div className="px-4 py-2 border-b border-base-300 bg-base-200/50">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-base-content/70" />
            <label className="text-sm text-base-content/70">Response Language:</label>
            <select 
              className="select select-bordered select-sm w-full max-w-xs"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-base-content/60 py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-primary/50" />
              <p>Start a conversation with the AI assistant!</p>
              <p className="text-sm mt-2">Select your preferred language above</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                ref={messageEndRef}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    {message.senderId === authUser._id ? (
                      <img
                        src={authUser.profilePic || "/avatar.png"}
                        alt="Your avatar"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="chat-header mb-1">
                  <span className="text-xs opacity-50">
                    {message.senderId === authUser._id ? "You" : "AI Assistant"}
                  </span>
                  <time className="text-xs opacity-50 ml-2">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div className="chat-bubble">
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))
          )}
          
          {isSendingMessage && (
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="chat-bubble">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-base-300">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 input input-bordered"
              placeholder="Ask AI anything..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSendingMessage}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputText.trim() || isSendingMessage}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatContainer;