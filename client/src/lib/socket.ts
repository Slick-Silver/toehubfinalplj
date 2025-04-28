import { type WebSocketMessage } from "@shared/schema";

type MessageHandler = (message: WebSocketMessage) => void;
type ErrorHandler = (event: Event) => void;
type CloseHandler = (event: CloseEvent) => void;

// Create WebSocket connection
export function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  console.log(`Connecting to WebSocket at ${wsUrl}`);
  
  // Check if we already have a connection
  if (window.chatSocket) {
    console.log(`WebSocket already exists, readyState: ${window.chatSocket.readyState}`);
    
    if (window.chatSocket.readyState === WebSocket.OPEN) {
      console.log("Using existing open WebSocket connection");
      const socket = window.chatSocket;
      
      let messageHandler: MessageHandler | null = null;
      let errorHandler: ErrorHandler | null = null;
      let closeHandler: CloseHandler | null = null;
      
      return {
        socket,
        onMessage: (handler: MessageHandler) => {
          messageHandler = handler;
          
          // Re-add event listener
          socket.addEventListener("message", (event) => {
            try {
              const message = JSON.parse(event.data) as WebSocketMessage;
              if (messageHandler) {
                messageHandler(message);
              }
            } catch (error) {
              console.error("Error parsing WebSocket message:", error);
            }
          });
        },
        onError: (handler: ErrorHandler) => {
          errorHandler = handler;
          
          // Re-add event listener
          socket.addEventListener("error", (event) => {
            console.error("WebSocket error:", event);
            if (errorHandler) {
              errorHandler(event);
            }
          });
        },
        onClose: (handler: CloseHandler) => {
          closeHandler = handler;
          
          // Re-add event listener
          socket.addEventListener("close", (event) => {
            console.log("WebSocket connection closed:", event.code, event.reason);
            window.chatSocket = undefined;
            if (closeHandler) {
              closeHandler(event);
            }
          });
        }
      };
    } else if (window.chatSocket.readyState === WebSocket.CLOSING || window.chatSocket.readyState === WebSocket.CLOSED) {
      console.log("Previous WebSocket connection is closing or closed, creating new one");
      window.chatSocket = undefined;
    }
  }
  
  // Create new socket
  const socket = new WebSocket(wsUrl);
  window.chatSocket = socket;
  
  let messageHandler: MessageHandler | null = null;
  let errorHandler: ErrorHandler | null = null;
  let closeHandler: CloseHandler | null = null;
  
  // Log connection opened
  socket.addEventListener("open", () => {
    console.log("WebSocket connection opened successfully");
    
    // Send a ping every 25 seconds to keep the connection alive
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        // Send a custom ping message
        socket.send(JSON.stringify({ type: "PING" }));
        console.log("Sent ping to server");
      } else {
        clearInterval(pingInterval);
      }
    }, 25000);
    
    // Clear interval when socket closes
    socket.addEventListener("close", () => {
      clearInterval(pingInterval);
    });
  });
  
  // Set up message event listener
  socket.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      console.log("WebSocket message received:", message.type);
      if (messageHandler) {
        messageHandler(message);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });
  
  // Set up error event listener
  socket.addEventListener("error", (event) => {
    console.error("WebSocket error:", event);
    if (errorHandler) {
      errorHandler(event);
    }
  });
  
  // Set up close event listener
  socket.addEventListener("close", (event) => {
    console.log("WebSocket connection closed:", event.code, event.reason);
    window.chatSocket = undefined;
    if (closeHandler) {
      closeHandler(event);
    }
  });
  
  return {
    socket,
    onMessage: (handler: MessageHandler) => {
      messageHandler = handler;
    },
    onError: (handler: ErrorHandler) => {
      errorHandler = handler;
    },
    onClose: (handler: CloseHandler) => {
      closeHandler = handler;
    }
  };
}

// Send message through WebSocket
export function sendMessage(message: WebSocketMessage) {
  console.log("Sending message:", message.type);
  
  // Check if we already have an active connection
  if (!window.chatSocket || window.chatSocket.readyState !== WebSocket.OPEN) {
    console.log("No active WebSocket connection, creating a new one");
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create a new connection
    const socket = new WebSocket(wsUrl);
    window.chatSocket = socket;
    
    // Wait for connection to open before sending
    socket.addEventListener("open", () => {
      console.log("WebSocket connection opened, sending message");
      socket.send(JSON.stringify(message));
    });
    
    socket.addEventListener("error", (err) => {
      console.error("WebSocket connection error:", err);
    });
  } else {
    // Use existing connection
    console.log("Using existing WebSocket connection");
    try {
      window.chatSocket.send(JSON.stringify(message));
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }
}

// Add WebSocket to Window interface
declare global {
  interface Window {
    chatSocket?: WebSocket;
  }
}
