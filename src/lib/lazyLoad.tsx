import { Suspense, lazy } from 'react';

/**
 * Utility for lazy loading components with a fallback
 * @param importFn - Dynamic import function
 * @param fallback - Optional custom fallback component
 * @returns Lazy loaded component with suspense
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <div className="w-full h-40 flex items-center justify-center bg-muted/10 animate-pulse rounded-md"></div>
) {
  // Use preload hint to start loading the component as soon as possible
  const preloadComponent = () => {
    const componentPromise = importFn();
    return componentPromise;
  };

  // Create the lazy component
  const LazyComponent = lazy(() => {
    // Start preloading
    return preloadComponent();
  });

  const LazyLoadComponent = (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  // Add display name
  LazyLoadComponent.displayName = `LazyLoad(${importFn.name || 'Component'})`;

  return LazyLoadComponent;
}

export default lazyLoad;
