const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';


console.log('[API] BASE_URL configured as:', BASE_URL);
console.log('[API] VITE_API_BASE_URL env:', import.meta.env.VITE_API_BASE_URL);

/**
 * Generate a session ID for the user
 */
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

/**
 * Generic API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base fetch wrapper with error handling
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  console.log(`[API] ${options.method || 'GET'} ${url}`);
  console.log(`[API] Request config:`, config);

  try {
    const response = await fetch(url, config);
    
    console.log(`[API] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error(`[API] Error response:`, errorData);
        
        // Handle validation errors (400)
        if (response.status === 400 && errorData.errors) {
          throw new ApiError(
            'Validation failed',
            response.status,
            errorData.errors
          );
        }
        
        // Handle other errors with messages
        throw new ApiError(
          errorData.message || 'An error occurred',
          response.status
        );
      }
      
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    const data = await response.json();
    console.log(`[API] Response data:`, data);
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`[API] ApiError thrown:`, error);
      throw error;
    }
    
    // Network errors or other issues
    const errorMsg = error instanceof Error ? error.message : 'Network error occurred';
    console.error(`[API] Network error:`, errorMsg, error);
    throw new ApiError(
      `Failed to connect to backend (${BASE_URL}): ${errorMsg}`
    );
  }
}
