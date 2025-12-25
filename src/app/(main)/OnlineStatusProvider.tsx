'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { createContext, useContext, ReactNode } from 'react';
import { OnlineStatus } from '@/lib/types/onlineStatus';

// Create a context for the online status
interface OnlineStatusContextType {
  status: OnlineStatus;
}

const OnlineStatusContext = createContext<OnlineStatusContextType>({
  status: OnlineStatus.OFFLINE,
});

// Hook to use the online status context
export const useOnlineStatusContext = () => useContext(OnlineStatusContext);

// Provider component
export default function OnlineStatusProvider({
  children
}: {
  children: ReactNode
}) {
  // Use the hook to manage the online status
  const status = useOnlineStatus();

  return (
    <OnlineStatusContext.Provider value={{ status }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}
