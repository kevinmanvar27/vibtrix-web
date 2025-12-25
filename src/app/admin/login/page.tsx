import { redirect } from "next/navigation";

/**
 * Admin login redirect page
 * Redirects from /admin/login to /admin-login to bypass admin authentication middleware
 */
export default function AdminLoginRedirect({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  // Get the query parameters
  const redirectParam = searchParams.redirect ? `?redirect=${searchParams.redirect}` : "";
  const errorParam = searchParams.error ? `${redirectParam ? "&" : "?"}error=${searchParams.error}` : "";

  // Redirect to the admin-login page which is outside the /admin path
  // This ensures the login page is not subject to the admin authentication middleware
  // Perform the redirect
  redirect(`/admin-login${redirectParam}${errorParam}`);

  // This is just a fallback, the redirect above should handle it
  return null;
}
