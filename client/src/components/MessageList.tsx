import { useRef, useEffect } from "react";
import { type ChatMessage } from "@shared/schema";
import { formatMessageTime } from "@/lib/utils";
import UserAvatar from "./UserAvatar";

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: number;
}

const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Group messages by day
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);
  
  return (
    <div ref={messageContainerRef} className="message-container bg-gray-50">
      <div className="space-y-4">
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            <div className="text-center py-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {date === new Date().toLocaleDateString() ? 'Today' : date}
              </span>
            </div>
            
            {dayMessages.map((message) => (
              message.userId === currentUserId ? (
                // Current user's message
                <div key={message.id} className="flex justify-end">
                  <div className="message sent">
                    {message.content}
                  </div>
                </div>
              ) : (
                // Other user's message
                <div key={message.id} className="flex items-start">
                  <UserAvatar username={message.username} size="sm" />
                  <div className="ml-3">
                    <div className="flex items-baseline">
                      <span className="font-medium text-gray-900">{message.username}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="message received mt-1">
                      {message.content}
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <MessageSquareIcon className="h-12 w-12 mb-2" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Message square icon component
const MessageSquareIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export default MessageList;
