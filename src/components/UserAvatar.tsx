import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import { OnlineStatus } from "@/lib/types/onlineStatus";
import { cn } from "@/lib/utils";
import Image from "next/image";
import StatusIndicator from "./StatusIndicator";

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  size?: number;
  className?: string;
  showStatus?: boolean;
  status?: OnlineStatus;
  statusSize?: 'sm' | 'md' | 'lg';
}

export default function UserAvatar({
  avatarUrl,
  size,
  className,
  showStatus = false,
  status = OnlineStatus.OFFLINE,
  statusSize = 'md',
}: UserAvatarProps) {
  const avatarSize = size ?? 48;

  return (
    <div className="relative inline-block">
      <Image
        src={avatarUrl || avatarPlaceholder}
        alt="User avatar"
        width={avatarSize}
        height={avatarSize}
        className={cn(
          "aspect-square h-fit flex-none rounded-full bg-secondary object-cover",
          className,
        )}
      />
      {showStatus && (
        <div className="absolute bottom-0 right-0 translate-x-[15%] translate-y-[15%]">
          <StatusIndicator status={status} size={statusSize} />
        </div>
      )}
    </div>
  );
}
