// API client utility for making authenticated requests with CSRF protection

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add CSRF token for state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    // Get CSRF token from cookie (needs to be set by the server)
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for authentication
  });

  return response;
}

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(/lumin_csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

// Convenience methods
export const api = {
  get: (url: string) => apiRequest(url, { method: 'GET' }),
  post: (url: string, data: unknown) => 
    apiRequest(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data: unknown) => 
    apiRequest(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url: string) => apiRequest(url, { method: 'DELETE' }),
  patch: (url: string, data: unknown) => 
    apiRequest(url, { method: 'PATCH', body: JSON.stringify(data) }),
};