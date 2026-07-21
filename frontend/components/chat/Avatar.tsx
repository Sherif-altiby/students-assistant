import { getInitials, getUserColor } from "@/lib/chat-avatar";

interface AvatarProps {
  userId: string;
  name: string;
  size?: "sm" | "md";
}

export function Avatar({ userId, name, size = "md" }: AvatarProps) {
  const color = getUserColor(userId);
  const dimension = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${dimension}`}
      style={{ backgroundColor: color }}
    >
      {getInitials(name)}
    </div>
  );
}