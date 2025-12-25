"use client";

import AdminSidebar from "./AdminSidebar";
import { User } from "lucia";

interface AdminSidebarWrapperProps {
  user: User | null;
}

export default function AdminSidebarWrapper({ user }: AdminSidebarWrapperProps) {
  return <AdminSidebar user={user} />;
}
