import { useInView } from "react-intersection-observer";
import { useCallback, useEffect, useRef } from "react";
import { throttle } from "@/lib/performance-utils";

interface InfiniteScrollContainerProps extends React.PropsWithChildren {
  onBottomReached: () => void;
  className?: string;
  /**
   * Throttle time in milliseconds to prevent excessive calls
   * @default 500
   */
  throttleTime?: number;
}

export default function InfiniteScrollContainer({
  children,
  onBottomReached,
  className,
  throttleTime = 500,
}: InfiniteScrollContainerProps) {
  // Track if we're currently fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);

  // Create a throttled version of onBottomReached
  const throttledOnBottomReached = useCallback(
    throttle(() => {
      if (!isFetchingRef.current) {
        isFetchingRef.current = true;
        onBottomReached();
      }
    }, throttleTime),
    [onBottomReached, throttleTime]
  );

  // Reset isFetching when component re-renders with new children
  useEffect(() => {
    isFetchingRef.current = false;
  }, [children]);

  const { ref } = useInView({
    rootMargin: "300px", // Increased from 200px to load earlier
    threshold: 0.1,      // Trigger when at least 10% of the element is visible
    onChange(inView) {
      if (inView) {
        throttledOnBottomReached();
      }
    },
  });

  return (
    <div className={className}>
      {children}
      <div ref={ref} className="h-10" /> {/* Added height to make sure it's visible */}
    </div>
  );
}
