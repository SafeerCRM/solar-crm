export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('access_token');

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}