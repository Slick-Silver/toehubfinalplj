import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smile, Paperclip, Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
}

const MessageInput = ({ onSendMessage }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
      
      // Focus the input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="w-full border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
          />
          <div className="absolute right-0 flex items-center h-full pr-3 space-x-1">
            <button 
              type="button"
              className="text-gray-500 hover:text-gray-700 focus:outline-none" 
              title="Add emoji"
            >
              <Smile className="h-5 w-5" />
            </button>
            <button 
              type="button"
              className="text-gray-500 hover:text-gray-700 focus:outline-none" 
              title="Upload file"
            >
              <Paperclip className="h-5 w-5" />
            </button>
          </div>
        </div>
        <Button
          type="submit"
          size="icon"
          className="ml-3 bg-primary hover:bg-primary/90 text-white p-2 rounded-full"
          disabled={!message.trim()}
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  );
};

export default MessageInput;
