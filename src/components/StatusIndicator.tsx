'use client';

import { OnlineStatus } from '@/lib/types/onlineStatus';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: OnlineStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusIndicator({
  status,
  className,
  size = 'md'
}: StatusIndicatorProps) {
  // Determine the color based on the status
  const getStatusColor = () => {
    switch (status) {
      case OnlineStatus.ONLINE:
        return 'bg-green-500'; // Green for online
      case OnlineStatus.IDLE:
        return 'bg-orange-500'; // Orange for idle
      case OnlineStatus.OFFLINE:
        return 'bg-gray-400'; // Gray for offline
      default:
        return 'bg-gray-400';
    }
  };

  // Determine the size based on the size prop
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'h-2 w-2';
      case 'md':
        return 'h-3 w-3';
      case 'lg':
        return 'h-4 w-4';
      default:
        return 'h-3 w-3';
    }
  };

  return (
    <div
      className={cn(
        'rounded-full',
        getStatusColor(),
        getSize(),
        className
      )}
      title={status.toLowerCase()}
    />
  );
}
