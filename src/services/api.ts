// API Configuration and Base Client

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        
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

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network errors or other issues
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error occurred'
    );
  }
}
