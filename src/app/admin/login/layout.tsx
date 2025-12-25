import debug from "@/lib/debug";

export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is specifically for the login page and doesn't include the admin sidebar
  // It's accessible without authentication
  debug.log("Admin login layout - Rendering login page");

  return children;
}
