import { useMemo } from "react";
import { getInitials, getAvatarColor } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  size?: "sm" | "md" | "lg";
}

const UserAvatar = ({ username, size = "md" }: UserAvatarProps) => {
  const initials = useMemo(() => getInitials(username), [username]);
  const bgColor = useMemo(() => getAvatarColor(username), [username]);
  
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base"
  };
  
  return (
    <div 
      className={`rounded-full flex items-center justify-center text-white font-semibold ${sizeClasses[size]}`}
      style={{ backgroundColor: bgColor }}
      aria-label={`${username}'s avatar`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
