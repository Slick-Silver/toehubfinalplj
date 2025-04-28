import { useMemo } from "react";
import { type Channel, type UserStatus } from "@shared/schema";
import UserAvatar from "./UserAvatar";

interface SidebarProps {
  channels: Channel[];
  currentChannelId?: number;
  onChannelSelect: (channel: Channel) => void;
  users: UserStatus[];
  visible: boolean;
}

const Sidebar = ({ 
  channels, 
  currentChannelId, 
  onChannelSelect, 
  users,
  visible 
}: SidebarProps) => {
  // Count online users
  const onlineCount = useMemo(() => {
    return users.filter(user => user.online).length;
  }, [users]);
  
  return (
    <aside className={`sidebar w-64 bg-white border-r border-gray-200 shadow-md flex flex-col ${visible ? 'show' : ''}`}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-700">Channels</h2>
        <div className="mt-3 space-y-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onChannelSelect(channel)}
              className={`block w-full text-left rounded px-3 py-2 text-gray-700 hover:bg-gray-100 ${
                currentChannelId === channel.id ? "bg-gray-100 font-medium" : ""
              }`}
            >
              # {channel.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-700">Online Users</h2>
          <span className="text-xs text-gray-500">{onlineCount} online</span>
        </div>
        <div className="space-y-2">
          {users.map((user) => (
            <div 
              key={user.userId} 
              className="flex items-center px-2 py-1 rounded hover:bg-gray-100"
            >
              <div className="relative">
                <UserAvatar username={user.username} />
                <span className={`online-indicator ${user.online ? 'online' : 'offline'} absolute bottom-0 right-0 border-2 border-white`}></span>
              </div>
              <span className={`ml-2 text-sm font-medium ${user.online ? 'text-gray-700' : 'text-gray-500'}`}>
                {user.username}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
