import debug from "@/lib/debug";

/**
 * Register the service worker for PWA functionality
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    debug.log('Service workers are not supported in this browser');
    return;
  }

  // Register the service worker after the page has loaded
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      debug.log('PWA service worker registered successfully:', registration);
    } catch (error) {
      debug.error('Error registering PWA service worker:', error);
    }
  });
}

/**
 * Check if the app is running as a PWA
 */
export function isRunningAsPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

/**
 * Check if the browser supports PWA installation
 */
export function isPWAInstallSupported(): boolean {
  return typeof window !== 'undefined' && 
         'serviceWorker' in navigator && 
         'PushManager' in window;
}
