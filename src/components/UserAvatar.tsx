import { OnlineStatus } from "@/lib/types/onlineStatus";
import { cn } from "@/lib/utils";
import StatusIndicator from "./StatusIndicator";
import ImageWithFallback from "./ImageWithFallback";

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  size?: number;
  className?: string;
  showStatus?: boolean;
  status?: OnlineStatus;
  statusSize?: 'sm' | 'md' | 'lg';
  displayName?: string;
}

export default function UserAvatar({
  avatarUrl,
  size,
  className,
  showStatus = false,
  status = OnlineStatus.OFFLINE,
  statusSize = 'md',
  displayName,
}: UserAvatarProps) {
  const avatarSize = size ?? 48;

  return (
    <div className="relative inline-block">
      <ImageWithFallback
        src={avatarUrl}
        alt="User avatar"
        width={avatarSize}
        height={avatarSize}
        fallbackType="avatar"
        fallbackText={displayName}
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
