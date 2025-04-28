import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  type WebSocketMessage, 
  type ChatMessage, 
  type UserStatus, 
  insertUserSchema, 
  insertMessageSchema 
} from "@shared/schema";
import { ZodError } from "zod";

// Connected clients map (userId -> WebSocket)
const clients = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Create WebSocket server on /ws path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/ws",
    // Add ping interval to keep connections alive
    clientTracking: true,
  });

  console.log("WebSocket server initialized");

  // Ping clients every 30 seconds to keep connections alive
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
        console.log("Ping sent to client");
      }
    });
  }, 30000);

  // Handle WebSocket connections
  wss.on("connection", async (ws, req) => {
    console.log(`WebSocket client connected from ${req.socket.remoteAddress}`);
    let userId: number | null = null;

    // Setup ping-pong to detect dropped connections
    ws.on("pong", () => {
      console.log("Received pong from client");
    });

    ws.on("message", async (message) => {
      console.log("Received message from client");
      try {
        const parsedMessage: WebSocketMessage = JSON.parse(message.toString());
        
        switch (parsedMessage.type) {
          case "JOIN":
            try {
              console.log("Received JOIN message with payload:", parsedMessage.payload);
              
              // Validate username
              const { username } = insertUserSchema.parse(parsedMessage.payload);
              console.log("Validated username:", username);
              
              // Check if user already exists
              let user = await storage.getUserByUsername(username);
              console.log("Existing user:", user);
              
              if (user) {
                // Update existing user status
                user = await storage.updateUserStatus(user.id, true);
                console.log("Updated user status:", user);
              } else {
                // Create new user
                user = await storage.createUser({ username });
                console.log("Created new user:", user);
              }
              
              if (!user) {
                throw new Error("Failed to create or update user");
              }
              
              // Set userId for this connection
              userId = user.id;
              console.log("Set userId for connection:", userId);
              
              // Store client connection
              clients.set(userId, ws);
              console.log("Stored client connection for user:", userId);
              
              // Send channels and initial state
              const channels = await storage.getAllChannels();
              console.log("Retrieved channels:", channels);
              
              // Send success response
              const responsePayload = {
                type: "JOIN_SUCCESS",
                payload: {
                  user,
                  channels
                }
              };
              console.log("Sending JOIN_SUCCESS response:", responsePayload);
              
              ws.send(JSON.stringify(responsePayload));
              console.log("JOIN_SUCCESS response sent");
              
              // Broadcast user status update to all clients
              broadcastUserStatus();
              console.log("User status broadcast completed");
            } catch (error) {
              if (error instanceof ZodError) {
                ws.send(JSON.stringify({
                  type: "ERROR",
                  payload: { message: "Invalid username", details: error.format() }
                }));
              } else {
                ws.send(JSON.stringify({
                  type: "ERROR",
                  payload: { message: (error as Error).message || "Failed to join" }
                }));
              }
            }
            break;
            
          case "SWITCH_CHANNEL":
            if (!userId) {
              ws.send(JSON.stringify({
                type: "ERROR",
                payload: { message: "Not authenticated" }
              }));
              break;
            }
            
            try {
              const channelId = parsedMessage.payload.channelId;
              const channel = await storage.getChannel(channelId);
              
              if (!channel) {
                throw new Error("Channel not found");
              }
              
              // Get messages for channel
              const messages = await storage.getMessagesByChannel(channelId);
              
              ws.send(JSON.stringify({
                type: "CHANNEL_MESSAGES",
                payload: {
                  channelId,
                  messages
                }
              }));
            } catch (error) {
              ws.send(JSON.stringify({
                type: "ERROR",
                payload: { message: (error as Error).message || "Failed to switch channel" }
              }));
            }
            break;
            
          case "SEND_MESSAGE":
            if (!userId) {
              ws.send(JSON.stringify({
                type: "ERROR",
                payload: { message: "Not authenticated" }
              }));
              break;
            }
            
            try {
              // Validate message data
              const messageData = insertMessageSchema.parse({
                content: parsedMessage.payload.content,
                userId,
                channelId: parsedMessage.payload.channelId
              });
              
              // Store message
              const message = await storage.createMessage(messageData);
              
              // Get username
              const user = await storage.getUser(userId);
              
              if (!user) {
                throw new Error("User not found");
              }
              
              // Format as ChatMessage
              const chatMessage: ChatMessage = {
                id: message.id,
                content: message.content,
                userId: message.userId,
                username: user.username,
                channelId: message.channelId,
                timestamp: message.timestamp.toISOString()
              };
              
              // Broadcast message to all clients
              broadcastMessage(chatMessage);
            } catch (error) {
              if (error instanceof ZodError) {
                ws.send(JSON.stringify({
                  type: "ERROR",
                  payload: { message: "Invalid message data", details: error.format() }
                }));
              } else {
                ws.send(JSON.stringify({
                  type: "ERROR",
                  payload: { message: (error as Error).message || "Failed to send message" }
                }));
              }
            }
            break;
            
          case "PING":
            // Respond to ping with a pong
            ws.send(JSON.stringify({
              type: "PONG",
              payload: { timestamp: new Date().toISOString() }
            }));
            console.log("Received ping, sent pong");
            break;
            
          default:
            ws.send(JSON.stringify({
              type: "ERROR",
              payload: { message: "Unknown message type" }
            }));
        }
      } catch (error) {
        console.error("Error processing message:", error);
        ws.send(JSON.stringify({
          type: "ERROR",
          payload: { message: "Failed to process message" }
        }));
      }
    });

    // Handle disconnection
    ws.on("close", async () => {
      if (userId) {
        // Update user status
        await storage.updateUserStatus(userId, false);
        
        // Remove client from connected clients
        clients.delete(userId);
        
        // Broadcast user status update
        broadcastUserStatus();
      }
    });
  });

  // Helper function to broadcast messages to all connected clients
  function broadcastMessage(message: ChatMessage) {
    const messageData = JSON.stringify({
      type: "NEW_MESSAGE",
      payload: message
    });
    
    // Use Array.from to convert the Map values iterator to an array
    Array.from(clients.values()).forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageData);
      }
    });
  }

  // Helper function to broadcast user status updates
  async function broadcastUserStatus() {
    const users = await storage.getAllUsers();
    
    const usersStatus: UserStatus[] = users.map(user => ({
      userId: user.id,
      username: user.username,
      online: user.online
    }));
    
    const statusData = JSON.stringify({
      type: "USERS_STATUS",
      payload: { users: usersStatus }
    });
    
    // Use Array.from to convert the Map values iterator to an array
    Array.from(clients.values()).forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(statusData);
      }
    });
  }

  // API routes for REST endpoints if needed
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  return httpServer;
}
