import debug from "@/lib/debug";

/**
 * Performance monitoring utility
 * This utility helps track and monitor performance metrics in the application
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only enable detailed logging in development
const isProduction = process.env.NODE_ENV === 'production';

// Only collect detailed metrics in development or when explicitly enabled
const DETAILED_METRICS = !isProduction || process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_METRICS === 'true';

// Sample rate for performance metrics in production (1 = 100%, 0.1 = 10%)
const METRICS_SAMPLE_RATE = isProduction ? 0.1 : 1;

/**
 * Track a performance metric
 * @param name The name of the metric
 * @param value The value of the metric
 */
export function trackMetric(name: string, value: number): void {
  if (!isBrowser) return;

  // In production, only sample a percentage of metrics to reduce overhead
  if (isProduction && Math.random() > METRICS_SAMPLE_RATE) return;

  try {
    // Use the Performance API
    if (window.performance && window.performance.mark) {
      // Only create marks for critical metrics in production
      if (!isProduction || name.startsWith('critical_')) {
        window.performance.mark(`${name}-${value}`);
      }

      // Log metrics in development for debugging
      if (!isProduction) {
        debug.log(`[Performance Metric] ${name}: ${value.toFixed(2)}`);
      }
    }
  } catch (error) {
    // Silently fail in production
    if (!isProduction) {
      debug.error('Error tracking metric:', error);
    }
  }
}

/**
 * Start measuring a performance metric
 * @param name The name of the metric
 * @returns A function to stop measuring
 */
export function startMeasure(name: string): () => number {
  if (!isBrowser) return () => 0;

  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (isProduction) {
      trackMetric(name, duration);
    } else {
      debug.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  };
}

/**
 * Measure the execution time of a function
 * @param fn The function to measure
 * @param name The name of the metric
 * @returns The result of the function
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  name: string
): Promise<T> {
  const stop = startMeasure(name);
  try {
    const result = await fn();
    stop();
    return result;
  } catch (error) {
    stop();
    throw error;
  }
}

/**
 * Measure the execution time of a synchronous function
 * @param fn The function to measure
 * @param name The name of the metric
 * @returns The result of the function
 */
export function measure<T>(fn: () => T, name: string): T {
  const stop = startMeasure(name);
  try {
    const result = fn();
    stop();
    return result;
  } catch (error) {
    stop();
    throw error;
  }
}

/**
 * Generate a unique ID for metrics
 * @returns A unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (!isBrowser) return;

  // Skip detailed monitoring in production unless explicitly enabled
  if (isProduction && !DETAILED_METRICS) {
    // Only track critical metrics in production by default
    trackCriticalMetricsOnly();
    return;
  }

  try {
    // Listen for navigation events
    if (window.performance && window.performance.getEntriesByType) {
      window.addEventListener('load', () => {
        // Use requestIdleCallback to defer non-critical work
        const runDeferredMetrics = () => {
          // Track navigation timing metrics
          const navigationEntries = window.performance.getEntriesByType('navigation');
          if (navigationEntries.length > 0) {
            const navigationEntry = navigationEntries[0] as PerformanceNavigationTiming;
            trackMetric('critical_navigationTime', navigationEntry.duration);
            trackMetric('domContentLoaded', navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart);
            trackMetric('loadEvent', navigationEntry.loadEventEnd - navigationEntry.loadEventStart);
            trackMetric('critical_domInteractive', navigationEntry.domInteractive);
            trackMetric('domComplete', navigationEntry.domComplete);
          }

          // Only track detailed resource metrics in development
          if (DETAILED_METRICS) {
            // Track resource timing metrics
            const resourceEntries = window.performance.getEntriesByType('resource');
            if (resourceEntries.length > 0) {
              // Calculate average resource load time
              const totalDuration = resourceEntries.reduce((sum, entry) => sum + entry.duration, 0);
              const avgDuration = totalDuration / resourceEntries.length;
              trackMetric('avgResourceLoad', avgDuration);

              // Track slow resources (over 1000ms)
              const slowResources = resourceEntries.filter(entry => entry.duration > 1000);
              if (slowResources.length > 0) {
                trackMetric('slowResourcesCount', slowResources.length);
              }
            }
          }

          // Track paint timing metrics (critical for user experience)
          const paintEntries = window.performance.getEntriesByType('paint');
          paintEntries.forEach(entry => {
            trackMetric(`critical_${entry.name}`, entry.startTime);
          });
        };

        // Use requestIdleCallback if available, otherwise use setTimeout
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(runDeferredMetrics, { timeout: 2000 });
        } else {
          setTimeout(runDeferredMetrics, 500);
        }
      });
    }

    // Track client-side navigation performance
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Create performance observer for navigation timing
        const navObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              trackMetric('critical_navigationDuration', navEntry.duration);
            }
          });
        });
        navObserver.observe({ type: 'navigation', buffered: true });

        // Create performance observer for paint timing
        const paintObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            trackMetric(`critical_${entry.name}`, entry.startTime);
          });
        });
        paintObserver.observe({ type: 'paint', buffered: true });

        // Only observe long tasks in development or when detailed metrics are enabled
        if (DETAILED_METRICS && 'PerformanceObserver' in window) {
          try {
            const longTaskObserver = new PerformanceObserver((entryList) => {
              const entries = entryList.getEntries();
              entries.forEach(entry => {
                trackMetric('longTask', entry.duration);
              });
            });
            longTaskObserver.observe({ type: 'longtask', buffered: true });
          } catch (e) {
            // Long task observation not supported in all browsers
          }
        }
      } catch (e) {
        // Some browsers might not support all observer types
        if (!isProduction) {
          debug.warn('Performance observer not fully supported:', e);
        }
      }
    }
  } catch (error) {
    // Silently fail in production
    if (!isProduction) {
      debug.error('Error initializing performance monitoring:', error);
    }
  }
}

/**
 * Track only the most critical metrics for performance
 * This is used in production to minimize overhead
 */
function trackCriticalMetricsOnly(): void {
  if (!isBrowser) return;

  try {
    // Only track FCP and LCP in production by default
    if ('PerformanceObserver' in window) {
      // Track paint metrics (FCP)
      try {
        const paintObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              trackMetric('critical_first-contentful-paint', entry.startTime);
            }
          });
        });
        paintObserver.observe({ type: 'paint', buffered: true });
      } catch (e) {}

      // Track largest contentful paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            trackMetric('critical_largest-contentful-paint', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {}
    }
  } catch (error) {
    // Silently fail in production
  }
}
