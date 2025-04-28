import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Chat from "@/pages/Chat";
import { useChat, ChatProvider } from "./context/ChatContext";
import LoginModal from "./components/LoginModal";

// Inner App component that uses the ChatContext
function AppContent() {
  const { user, connected } = useChat();

  return (
    <>
      <Toaster />
      {!user ? (
        <LoginModal />
      ) : (
        <div className="h-screen bg-white">
          <Switch>
            <Route path="/" component={Chat} />
            <Route component={NotFound} />
          </Switch>
        </div>
      )}
    </>
  );
}

// Main App component that sets up providers
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
