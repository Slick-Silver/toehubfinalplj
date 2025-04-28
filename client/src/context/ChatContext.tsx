import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { connectWebSocket, sendMessage as wsSendMessage } from "@/lib/socket";
import { 
  type Channel, 
  type ChatMessage, 
  type UserStatus,
  type WebSocketMessage
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Define user type for the context
interface User {
  id: number;
  username: string;
}

// Chat context type
interface ChatContextType {
  user: User | null;
  channels: Channel[];
  currentChannel: Channel | null;
  messages: ChatMessage[];
  onlineUsers: UserStatus[];
  connected: boolean;
  joinChat: (username: string, channelName: string) => Promise<void>;
  switchChannel: (channel: Channel) => void;
  sendMessage: (content: string, channelId: number) => void;
  setCurrentChannel: (channel: Channel) => void;
}

// Create the context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  
  const { toast } = useToast();
  
  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    console.log("Handling WebSocket message:", message.type, message.payload);
    
    switch (message.type) {
      case "JOIN_SUCCESS":
        console.log("JOIN_SUCCESS received with payload:", message.payload);
        
        // First set the channels to ensure they're available for channel switching
        setChannels(message.payload.channels || []);
        console.log("Channels set:", message.payload.channels);
        
        // Set the user and connected state
        setUser(message.payload.user);
        console.log("User set:", message.payload.user);
        
        // Update connected state
        setConnected(true);
        console.log("Connected state set to true");
        break;
        
      case "USERS_STATUS":
        console.log("USERS_STATUS received:", message.payload.users);
        setOnlineUsers(message.payload.users || []);
        break;
        
      case "CHANNEL_MESSAGES":
        console.log("CHANNEL_MESSAGES received:", message.payload);
        setMessages(message.payload.messages || []);
        break;
        
      case "NEW_MESSAGE":
        console.log("NEW_MESSAGE received:", message.payload);
        setMessages(prev => {
          // Avoid duplicate messages
          if (prev.some(m => m.id === message.payload.id)) {
            return prev;
          }
          return [...prev, message.payload];
        });
        break;
        
      case "PONG":
        console.log("PONG received from server");
        break;
        
      case "ERROR":
        console.error("ERROR received from server:", message.payload);
        toast({
          title: "Error",
          description: message.payload.message,
          variant: "destructive",
        });
        break;
        
      default:
        console.warn("Unknown message type:", message.type);
    }
  }, [toast]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    console.log("Initializing WebSocket connection");
    try {
      // Use a direct connection approach for simplicity
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create WebSocket connection
      const socket = new WebSocket(wsUrl);
      window.chatSocket = socket;
      
      // Log connection opened
      socket.addEventListener("open", () => {
        console.log("WebSocket connection opened successfully");
      });
      
      // Set up message handler
      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log("WebSocket message received:", message.type);
          
          // Process the message using our handler
          handleWebSocketMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      });
      
      // Error handler
      socket.addEventListener("error", (event) => {
        console.error("WebSocket error in context:", event);
        toast({
          title: "Connection Error",
          description: "Failed to connect to the chat server. Please try again.",
          variant: "destructive",
        });
      });
      
      // Close handler
      socket.addEventListener("close", (event) => {
        console.log("WebSocket closed with code:", event.code);
        setConnected(false);
        window.chatSocket = undefined;
        
        toast({
          title: "Disconnected",
          description: "You've been disconnected from the chat server.",
          variant: "destructive",
        });
      });
      
      // Setup ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "PING" }));
          console.log("Sent ping to server");
        } else {
          clearInterval(pingInterval);
        }
      }, 25000);
      
      // Cleanup on unmount
      return () => {
        console.log("Cleaning up WebSocket connection");
        clearInterval(pingInterval);
        socket.close();
      };
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize chat connection. Please reload the page.",
        variant: "destructive",
      });
    }
  }, [handleWebSocketMessage, toast]);
  
  // Function to handle channel switching internally
  const handleSwitchChannel = (channel: Channel) => {
    setCurrentChannel(channel);
    
    // Request messages for this channel
    wsSendMessage({
      type: "SWITCH_CHANNEL",
      payload: { channelId: channel.id }
    });
  };
  
  // Switch channel function as part of the public API 
  const switchChannel = useCallback((channel: Channel) => {
    handleSwitchChannel(channel);
  }, []);
  
  // Join chat function
  const joinChat = useCallback(async (username: string, channelName: string) => {
    console.log(`Attempting to join chat as "${username}" in channel "${channelName}"`);
    
    // Set up a promise to be resolved when the JOIN_SUCCESS event is received
    return new Promise<void>((resolve, reject) => {
      // Create a one-time message handler that will resolve our promise
      const joinSuccessHandler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Message received in join handler:", message.type);
          
          if (message.type === "JOIN_SUCCESS") {
            console.log("Received JOIN_SUCCESS in direct handler", message.payload);
            
            // Update state directly here as a backup
            setUser(message.payload.user);
            setChannels(message.payload.channels);
            setConnected(true);
            
            // Find the channel
            const channel = message.payload.channels.find((c: Channel) => c.name === channelName);
            if (channel) {
              console.log(`Switching to requested channel: ${channel.name}`);
              handleSwitchChannel(channel);
            } else if (message.payload.channels.length > 0) {
              console.log(`Requested channel not found, using default: ${message.payload.channels[0].name}`);
              handleSwitchChannel(message.payload.channels[0]);
            } else {
              console.warn("No channels available");
            }
            
            window.chatSocket?.removeEventListener('message', joinSuccessHandler);
            resolve();
          } else if (message.type === "ERROR") {
            console.error("Error joining chat:", message.payload);
            window.chatSocket?.removeEventListener('message', joinSuccessHandler);
            reject(new Error(message.payload.message || "Failed to join chat"));
          }
        } catch (error) {
          console.error("Error parsing message in join handler:", error);
        }
      };
      
      // Add our one-time handler
      if (window.chatSocket) {
        window.chatSocket.addEventListener('message', joinSuccessHandler);
      } else {
        reject(new Error("WebSocket connection not available"));
        return;
      }
      
      // Set timeout for join
      const timeout = setTimeout(() => {
        window.chatSocket?.removeEventListener('message', joinSuccessHandler);
        console.warn("Join timeout reached");
        reject(new Error("Connection timeout. Please try again."));
      }, 10000);
      
      // Send join message
      try {
        wsSendMessage({
          type: "JOIN",
          payload: { username }
        });
        
        console.log("JOIN message sent to server");
      } catch (error) {
        console.error("Error sending JOIN message:", error);
        window.chatSocket?.removeEventListener('message', joinSuccessHandler);
        clearTimeout(timeout);
        reject(new Error("Failed to connect to chat server. Please try again."));
      }
    });
  }, [handleSwitchChannel]);
  
  // Send message
  const sendMessage = useCallback((content: string, channelId: number) => {
    wsSendMessage({
      type: "SEND_MESSAGE",
      payload: { content, channelId }
    });
  }, []);
  
  const contextValue: ChatContextType = {
    user,
    channels,
    currentChannel,
    messages,
    onlineUsers,
    connected,
    joinChat,
    switchChannel,
    sendMessage,
    setCurrentChannel
  };
  
  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

// Hook for using the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
