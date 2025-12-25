"use client";

import { useEffect, useState } from "react";
import AdminImpersonationBanner from "@/components/AdminImpersonationBanner";

export default function AdminImpersonationCheck() {
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    // Check if the admin_user_id cookie exists
    const adminUserId = document.cookie
      .split("; ")
      .find(row => row.startsWith("admin_user_id="));

    setIsImpersonating(!!adminUserId);
  }, []);

  if (!isImpersonating) {
    return null;
  }

  return <AdminImpersonationBanner />;
}
