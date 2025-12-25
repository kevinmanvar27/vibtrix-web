"use client";

import { Session, User } from "lucia";
import React, { createContext, useContext } from "react";

interface SessionContext {
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
}

const SessionContext = createContext<SessionContext | null>(null);

export default function SessionProvider({
  children,
  value,
}: React.PropsWithChildren<{ value: SessionContext }>) {
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    // Return a default context with null values instead of throwing
    return { user: null, session: null, isLoggedIn: false };
  }
  return context;
}

// Helper hook to check if user is logged in
export function useIsLoggedIn() {
  const { isLoggedIn } = useSession();
  return isLoggedIn;
}
