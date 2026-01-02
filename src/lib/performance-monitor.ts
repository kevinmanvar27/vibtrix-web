/**
 * Production-optimized performance monitoring utility
 * Minimal overhead in production, detailed metrics in development
 */

const isBrowser = typeof window !== 'undefined';
const isProduction = process.env.NODE_ENV === 'production';

// Completely disable in production unless explicitly enabled
const ENABLED = !isProduction || process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_METRICS === 'true';

/**
 * Track a performance metric
 */
export function trackMetric(name: string, value: number): void {
  if (!isBrowser || !ENABLED) return;
  
  try {
    if (!isProduction && window.performance?.mark) {
      window.performance.mark(`${name}-${value}`);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Start measuring a performance metric
 */
export function startMeasure(name: string): () => number {
  if (!isBrowser || !ENABLED) return () => 0;

  const startTime = performance.now();
  return () => {
    const duration = performance.now() - startTime;
    trackMetric(name, duration);
    return duration;
  };
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(fn: () => Promise<T>, name: string): Promise<T> {
  const stop = startMeasure(name);
  try {
    return await fn();
  } finally {
    stop();
  }
}

/**
 * Measure sync function execution time
 */
export function measure<T>(fn: () => T, name: string): T {
  const stop = startMeasure(name);
  try {
    return fn();
  } finally {
    stop();
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (!isBrowser || !ENABLED) return;

  // In production, only track critical Web Vitals
  if (isProduction) {
    trackCriticalMetrics();
    return;
  }

  // Development: track detailed metrics
  try {
    if ('PerformanceObserver' in window) {
      // Track paint timing
      new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          trackMetric(entry.name, entry.startTime);
        });
      }).observe({ type: 'paint', buffered: true });

      // Track navigation timing
      new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          const nav = entry as PerformanceNavigationTiming;
          trackMetric('navigationDuration', nav.duration);
          trackMetric('domInteractive', nav.domInteractive);
        });
      }).observe({ type: 'navigation', buffered: true });
    }
  } catch {
    // Silently fail
  }
}

/**
 * Track only critical Web Vitals in production
 */
function trackCriticalMetrics(): void {
  if (!isBrowser || !('PerformanceObserver' in window)) return;

  try {
    // FCP - First Contentful Paint
    new PerformanceObserver((list) => {
      const fcp = list.getEntries().find(e => e.name === 'first-contentful-paint');
      if (fcp) trackMetric('FCP', fcp.startTime);
    }).observe({ type: 'paint', buffered: true });

    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length) trackMetric('LCP', entries[entries.length - 1].startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // Silently fail
  }
}
