/**
 * Utility functions for authentication
 */

/**
 * Check if the user is logged in by looking for auth cookies
 * This is a client-side check and is not secure, but it's useful for UI decisions
 * @returns True if the user appears to be logged in
 */
export function isLoggedInClient(): boolean {
  if (typeof document === 'undefined') return false;
  
  // Check for auth-related cookies
  const cookies = document.cookie.split(';');
  const authCookies = [
    'auth_session',
    'next-auth.session-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    '__Host-next-auth.csrf-token'
  ];
  
  return authCookies.some(authCookie => 
    cookies.some(cookie => cookie.trim().startsWith(`${authCookie}=`))
  );
}

/**
 * Get the current user's session state
 * @returns An object with isLoggedIn property
 */
export function getSessionState() {
  return {
    isLoggedIn: isLoggedInClient()
  };
}
