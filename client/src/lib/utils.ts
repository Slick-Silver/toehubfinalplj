import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format message timestamp
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Get initials from username
export function getInitials(username: string): string {
  if (!username) return "?";
  
  // For single word usernames, use the first two characters
  if (!username.includes(" ")) {
    return username.substring(0, 2).toUpperCase();
  }
  
  // For multiple words, use first letter of each word
  const words = username.split(" ");
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

// Generate consistent color from username
export function getAvatarColor(username: string): string {
  const colors = [
    "#4F46E5", // primary - indigo
    "#10B981", // success - green
    "#F59E0B", // yellow
    "#8B5CF6", // purple
    "#EF4444", // red
    "#3B82F6", // blue
    "#EC4899", // pink
    "#14B8A6", // teal
  ];
  
  // Simple hash function to get consistent index
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use absolute value of hash to get color index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
