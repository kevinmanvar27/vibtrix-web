import { useEffect, useState } from "react";

interface UseImageStatusReturn {
  isLoading: boolean;
  hasError: boolean;
  isLoaded: boolean;
}

/**
 * Hook to check if an image URL is valid and can be loaded
 * @param src - Image URL to check
 * @returns Object with loading, error, and loaded states
 */
export function useImageStatus(src: string | null | undefined): UseImageStatusReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      setIsLoaded(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    setIsLoaded(false);

    const img = new Image();

    img.onload = () => {
      setIsLoading(false);
      setHasError(false);
      setIsLoaded(true);
    };

    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      setIsLoaded(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoading, hasError, isLoaded };
}

/**
 * Utility function to check if a URL is a valid image URL
 * @param url - URL to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Utility function to preload images
 * @param urls - Array of image URLs to preload
 * @returns Promise that resolves when all images are loaded
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      if (!isValidImageUrl(url)) {
        reject(new Error(`Invalid URL: ${url}`));
        return;
      }

      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load: ${url}`));
      img.src = url;
    });
  });

  return Promise.all(promises);
}

/**
 * Hook to preload multiple images
 * @param urls - Array of image URLs to preload
 * @returns Object with loading state and error
 */
export function usePreloadImages(urls: string[]) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (urls.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    preloadImages(urls)
      .then(() => {
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [urls]);

  return { isLoading, error };
}
