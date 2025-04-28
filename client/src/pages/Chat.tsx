import { useState, useEffect, useRef } from "react";
import { useChat } from "@/context/ChatContext";
import ChatHeader from "@/components/ChatHeader";
import Sidebar from "@/components/Sidebar";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";

const Chat = () => {
  const { 
    user, 
    currentChannel, 
    setCurrentChannel, 
    channels,
    onlineUsers,
    messages,
    sendMessage
  } = useChat();
  
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // Toggle sidebar visibility on mobile
  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };
  
  // Close sidebar when clicking overlay
  const handleOverlayClick = () => {
    setSidebarVisible(false);
  };
  
  if (!user) return null;
  
  return (
    <div className="flex flex-col h-screen">
      <ChatHeader 
        toggleSidebar={toggleSidebar} 
        username={user.username} 
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Overlay for mobile sidebar */}
        {sidebarVisible && (
          <div 
            className="overlay fixed inset-0 bg-black bg-opacity-50 z-30" 
            onClick={handleOverlayClick}
          />
        )}
        
        {/* Sidebar */}
        <Sidebar 
          channels={channels}
          currentChannelId={currentChannel?.id}
          onChannelSelect={setCurrentChannel}
          users={onlineUsers}
          visible={sidebarVisible}
        />
        
        {/* Main chat area */}
        <main className="flex-1 flex flex-col bg-white">
          {currentChannel && (
            <>
              <div className="border-b border-gray-200 px-6 py-3 shadow-sm bg-white flex items-center">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-800">
                      # {currentChannel.name}
                    </span>
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {onlineUsers.filter(u => u.online).length} users
                    </span>
                  </div>
                  {currentChannel.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {currentChannel.description}
                    </p>
                  )}
                </div>
              </div>
              
              <MessageList 
                messages={messages}
                currentUserId={user.id}
              />
              
              <MessageInput 
                onSendMessage={(content) => {
                  if (currentChannel && content.trim()) {
                    sendMessage(content, currentChannel.id);
                  }
                }}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;
