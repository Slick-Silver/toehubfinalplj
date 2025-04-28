import { MessageSquare } from "lucide-react";
import UserAvatar from "./UserAvatar";

interface ChatHeaderProps {
  toggleSidebar: () => void;
  username: string;
}

const ChatHeader = ({ toggleSidebar, username }: ChatHeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar} 
            className="block md:hidden mr-4 text-gray-600"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="ml-2 text-xl font-bold text-gray-800">TOEhub</h1>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="hidden md:block mr-3 text-sm font-medium text-gray-700">
            {username}
          </span>
          <div className="relative">
            <UserAvatar username={username} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
