/**
 * Utility function to refresh the access token
 * Can be called from client components when needed
 */
export async function refreshAccessToken() {
  try {
    const response = await fetch('/api/refresh', {
      method: 'GET',
      credentials: 'include', // Important to include cookies
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    return true; // Token refreshed successfully
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Redirect to login page on failure
    window.location.href = '/login';
    return false;
  }
}

/**
 * Wrapper for fetch that handles token refresh
 * Use this instead of regular fetch for authenticated requests
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // First attempt with current token
  let response = await fetch(url, {
    ...options,
    credentials: 'include',
  });
  
  // If unauthorized, try refreshing the token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    
    if (refreshed) {
      // Retry the original request with new token
      response = await fetch(url, {
        ...options,
        credentials: 'include',
      });
    }
  }
  
  return response;
}