'use client';

/**
 * A simple, robust API client that doesn't rely on external libraries
 * This avoids the issues we were encountering with the ky library
 */

import debug from "./debug";
import { isLoggedInClient } from "./auth-utils";

// Determine the base URL based on the environment
const getBaseUrl = (): string => {
  // In the browser, use the current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // In development on the server, use the port from the environment or default to 3001
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  // In production on the server, use an empty string (relative URLs)
  return '';
};

// Parse dates in JSON responses
const parseJsonWithDates = (text: string): any => {
  return JSON.parse(text, (key, value) => {
    if (key.endsWith("At") && typeof value === 'string') {
      return new Date(value);
    }
    return value;
  });
};

// Default request options
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  credentials: 'same-origin',
};

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

// Function to generate cache key for request deduplication
const generateCacheKey = (url: string, options: RequestInit): string => {
  const method = options.method || 'GET';
  const body = options.body || '';
  return `${method}:${url}:${body}`;
};

// Interface for request options
interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Interface for API response
interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/**
 * Makes an API request with robust error handling
 */
async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  // Extract and remove custom options
  const {
    params,
    timeout = 60000, // Increase default timeout to 60 seconds
    retries = 2,    // Default to 2 retries
    retryDelay = 1000, // Default delay between retries (1 second)
    ...fetchOptions
  } = options;

  // Generate cache key for request deduplication (only for GET requests)
  const method = fetchOptions.method || 'GET';
  const shouldCache = method === 'GET';

  if (shouldCache) {
    const cacheKey = generateCacheKey(url, fetchOptions);

    // Check if we already have this request in flight
    if (requestCache.has(cacheKey)) {
      debug.log(`Returning cached request for: ${method} ${url}`);
      return requestCache.get(cacheKey);
    }
  }

  // Merge with default options
  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...fetchOptions,
    headers: {
      ...defaultOptions.headers,
      ...fetchOptions.headers,
    },
  };

  // Handle URL construction
  let fullUrl = url;
  if (!url.startsWith('http')) {
    // Remove leading slash if present
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    fullUrl = `${getBaseUrl()}/${cleanUrl}`;
  }

  // Add query parameters if provided
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Function to perform the fetch with retry logic
  const fetchWithRetry = async (attempt = 0): Promise<Response> => {
    try {
      debug.log(`API Request (attempt ${attempt + 1}/${retries + 1}): ${mergedOptions.method || 'GET'} ${fullUrl}`);

      // Make the request with timeout handling
      const response = await fetch(fullUrl, {
        ...mergedOptions,
        signal: controller.signal,
      });

      return response;
    } catch (error) {
      // If we've used all retries or it's not a network error, throw
      if (
        attempt >= retries ||
        !(error instanceof Error) ||
        (error.name !== 'TypeError' && error.name !== 'NetworkError' && error.name !== 'AbortError')
      ) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      debug.log(`Retrying request in ${delay}ms (attempt ${attempt + 1}/${retries})`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Try again
      return fetchWithRetry(attempt + 1);
    }
  };

  // Create the request promise
  const requestPromise = (async () => {
    try {
      // Execute fetch with retry logic
      const response = await fetchWithRetry();

      // Clear the timeout
      clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
      let errorDetails = null;

      // Create a clone of the response to read the body multiple times if needed
      const responseClone = response.clone();

      try {
        // Try to parse error details from response
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorDetails = errorData;

          // Special case for rate limiting errors
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after') || '60';
            errorMessage = errorData.error || `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
            debug.log(`Rate limit hit for ${fullUrl}, retry after ${retryAfter} seconds`);
          }

          // Special case for private profiles - return the data instead of throwing an error
          if (response.status === 403 && errorData.error === "This user's profile is private") {
            debug.log(`Private profile detected: ${fullUrl}`);
            return {
              data: errorData as T,
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            };
          }

          // Special case for 400 status with valid response data (like "Competition not completed yet")
          if (response.status === 400 && errorData && typeof errorData === 'object') {
            // For 400 errors with structured data, return the data instead of throwing
            // This allows the frontend to handle expected 400 responses gracefully
            debug.log('400 status with structured data, returning response instead of throwing');
            return {
              data: errorData as T,
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            };
          }

          // Special case for unauthorized errors on public endpoints
          // Return empty data for these endpoints instead of throwing an error
          if (response.status === 401) {
            // Check if this is a public request (using the header we set)
            const isPublicRequest = mergedOptions.headers &&
                                   'X-Public-Request' in mergedOptions.headers;

            if (isPublicRequest) {
              debug.log(`Guest access to ${fullUrl} - returning empty data`);
              return {
                data: {
                  posts: [],
                  users: [],
                  competitions: [],
                  hashtags: [],
                  nextCursor: null,
                  message: "Please log in to view more content"
                } as unknown as T,
                status: 200, // Override with 200 status
                statusText: 'OK',
                headers: response.headers,
              };
            }
          }

          if (errorData.error) {
            errorMessage = errorData.error;
            if (errorData.details) {
              errorMessage += `: ${errorData.details}`;
            }
          }
        } else {
          // For non-JSON responses, try to get the text
          const textResponse = await responseClone.text();
          if (textResponse) {
            errorDetails = { responseText: textResponse };
            debug.error('Non-JSON error response:', textResponse);
          }
        }
      } catch (e) {
        // If we can't parse the response, log the error and use the status text
        debug.error('Failed to parse error response:', e);
        try {
          // Try to get the response text as a fallback
          const textResponse = await responseClone.text();
          if (textResponse) {
            errorDetails = { responseText: textResponse };
            debug.error('Error response text:', textResponse);
          }
        } catch (textError) {
          debug.error('Failed to get error response text:', textError);
        }
      }

      // Create an enhanced error object with additional properties
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      (error as any).details = errorDetails;
      (error as any).url = fullUrl;
      (error as any).method = mergedOptions.method || 'GET';
      (error as any).isAuthError = response.status === 401;
      (error as any).isRateLimited = response.status === 429;
      (error as any).response = { headers: response.headers };
      debug.error(`API Error: ${mergedOptions.method || 'GET'} ${fullUrl}`, error);
      throw error;
    }

    // Parse the response
    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      data = parseJsonWithDates(text);
    } else {
      // Handle non-JSON responses
      data = await response.text() as unknown as T;
    }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error: unknown) {
      // Clear the timeout
      clearTimeout(timeoutId);

      // Handle different error types
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout: The server took too long to respond (>${timeout}ms). Please try again later.`);
        (timeoutError as any).isTimeout = true;
        (timeoutError as any).status = 408; // Request Timeout status
        (timeoutError as any).url = fullUrl;
        (timeoutError as any).method = mergedOptions.method || 'GET';
        debug.error(`API Timeout: ${mergedOptions.method || 'GET'} ${fullUrl}`, timeoutError);
        throw timeoutError;
      }

      // Handle network errors
      if (error && typeof error === 'object' && 'message' in error &&
        (error.message === 'Failed to fetch' ||
          (typeof error.message === 'string' && error.message.includes('NetworkError')))) {
        const networkError = new Error('Network error: Unable to connect to server');

        // Add helpful suggestions
        if (typeof window !== 'undefined' && !window.navigator.onLine) {
          networkError.message = 'You appear to be offline. Please check your internet connection.';
        } else {
          networkError.message += '. Please check your internet connection or try again later.';
        }

        throw networkError;
      }

      // Re-throw other errors
      throw error;
    }
  })();

  // Cache the request promise for GET requests
  if (shouldCache) {
    const cacheKey = generateCacheKey(url, fetchOptions);
    requestCache.set(cacheKey, requestPromise);

    // Clean up cache after request completes (success or failure)
    requestPromise.finally(() => {
      // Remove from cache after a short delay to allow for immediate duplicate requests
      setTimeout(() => {
        requestCache.delete(cacheKey);
      }, 1000);
    });
  }

  return requestPromise;
}

// Helper function to check if a URL is a public endpoint that should work for guest users
const isPublicEndpoint = (url: string): boolean => {
  const publicEndpoints = [
    '/api/posts/for-you',
    '/api/posts/following',
    '/api/users',
    '/api/search',
    '/api/competitions',
    '/api/hashtags/trending',
    '/api/posts/trending',
    '/api/posts/recent',
    '/api/posts',
    '/api/notifications',
    '/api/bookmarks',
    '/api/likes',
    '/api/followers',
    '/api/following',
    '/api/posts/view',
    '/api/posts/competition-feed',
    '/api/advertisements',
    // Add chat-related endpoints
    '/api/chats',
    '/api/messages',
  ];

  // Check if the URL matches any of the public endpoints
  return publicEndpoints.some(endpoint =>
    url.includes(endpoint) || url.endsWith(endpoint) || url.includes(`${endpoint}?`)
  ) ||
  // Also check for dynamic routes like /api/posts/[postId]/likes
  url.match(/\/api\/posts\/[\w-]+\/likes/) ||
  url.match(/\/api\/posts\/[\w-]+\/view/) ||
  url.match(/\/api\/users\/[\w-]+\/followers/) ||
  url.match(/\/api\/users\/[\w-]+\/posts/) ||
  url.match(/\/api\/users\/[\w-]+\/follow-request/) ||
  // Add chat-related dynamic routes
  url.match(/\/api\/chats\/[\w-]+/) ||
  url.match(/\/api\/chats\/[\w-]+\/messages/);
};

// Helper function to create a mock response for unauthorized requests
const createMockResponse = <T>(url: string): ApiResponse<T> => {
  debug.log(`Creating mock response for unauthorized request to ${url}`);

  // Default empty response
  let defaultResponse: any = {
    posts: [],
    users: [],
    competitions: [],
    hashtags: [],
    nextCursor: null,
    message: "Please log in to view this content"
  };

  // Special case for notifications endpoint
  if (url.includes('/api/notifications')) {
    defaultResponse = {
      notifications: [],
      nextCursor: null,
      message: "Please log in to view your notifications"
    };
  }

  // Special case for chats endpoint
  if (url.includes('/api/chats') && !url.includes('/messages')) {
    defaultResponse = {
      chats: [],
      nextCursor: null,
      message: "Please log in to view your chats"
    };
  }

  // Special case for messages endpoint
  if (url.includes('/api/messages') || url.includes('/api/chats') && url.includes('/messages')) {
    defaultResponse = {
      messages: [],
      nextCursor: null,
      message: "Please log in to view your messages"
    };
  }

  // Return a mock response
  return {
    data: defaultResponse as T,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
  };
};

// API client with convenience methods
const apiClient = {
  get: <T>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
    // For public endpoints, add a special header to indicate this is a public request
    if (isPublicEndpoint(url)) {
      const headers = options.headers || {};
      options.headers = {
        ...headers,
        'X-Public-Request': 'true',
      };
      return apiRequest<T>(url, { ...options, method: 'GET' });
    }

    // For non-public endpoints, check if the user is logged in
    if (typeof window !== 'undefined' && !isLoggedInClient()) {
      debug.log(`User not logged in, returning mock response for ${url}`);
      return Promise.resolve(createMockResponse<T>(url));
    }

    return apiRequest<T>(url, { ...options, method: 'GET' });
  },

  post: <T>(url: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
    // For non-public endpoints, check if the user is logged in
    if (typeof window !== 'undefined' && !isLoggedInClient() && !isPublicEndpoint(url)) {
      debug.log(`User not logged in, returning mock response for POST ${url}`);
      return Promise.resolve(createMockResponse<T>(url));
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T>(url: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
    // For non-public endpoints, check if the user is logged in
    if (typeof window !== 'undefined' && !isLoggedInClient() && !isPublicEndpoint(url)) {
      debug.log(`User not logged in, returning mock response for PUT ${url}`);
      return Promise.resolve(createMockResponse<T>(url));
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch: <T>(url: string, data?: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
    // For non-public endpoints, check if the user is logged in
    if (typeof window !== 'undefined' && !isLoggedInClient() && !isPublicEndpoint(url)) {
      debug.log(`User not logged in, returning mock response for PATCH ${url}`);
      return Promise.resolve(createMockResponse<T>(url));
    }

    return apiRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> => {
    // For non-public endpoints, check if the user is logged in
    if (typeof window !== 'undefined' && !isLoggedInClient() && !isPublicEndpoint(url)) {
      debug.log(`User not logged in, returning mock response for DELETE ${url}`);
      return Promise.resolve(createMockResponse<T>(url));
    }

    return apiRequest<T>(url, { ...options, method: 'DELETE' });
  },
};

export default apiClient;
