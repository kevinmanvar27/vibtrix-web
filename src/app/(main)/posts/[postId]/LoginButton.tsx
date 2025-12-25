"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function LoginButton() {
  // Get the current path on the client side
  const pathname = usePathname();
  
  return (
    <Link
      href={`/login/google?from=${encodeURIComponent(pathname)}`}
      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md inline-block"
    >
      Sign in to interact
    </Link>
  );
}
