import { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";
import type { Channel } from "@shared/schema";

const LoginModal = () => {
  const { channels, joinChat } = useChat();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableChannels, setAvailableChannels] = useState<Channel[]>([
    { id: 1, name: "general", description: "General toe discussion" },
    { id: 2, name: "toe-tips", description: "Share advice and toe care tips" },
    { id: 3, name: "toe-tales", description: "Share funny toe stories" },
    { id: 4, name: "toe-support", description: "Get help with your toe issues" }
  ]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to join the chat",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await joinChat(username, selectedChannel);
    } catch (error) {
      console.error("Failed to join chat:", error);
      toast({
        title: "Failed to join chat",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div data-login-modal className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/80 text-white">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h2 className="mt-3 text-lg font-medium text-gray-900">Welcome to TOEhub</h2>
            <p className="mt-1 text-sm text-gray-500">Join the conversation with your toe friends</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Which toe are you?
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Big Toe, Pinky Toe..."
                className="w-full"
                required
                autoFocus
              />
            </div>
            
            <div className="mb-6">
              <Label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">
                Join Channel
              </Label>
              <Select
                value={selectedChannel}
                onValueChange={setSelectedChannel}
              >
                <SelectTrigger id="channel" className="w-full">
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {availableChannels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.name}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Joining..." : "Join Chat"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginModal;
