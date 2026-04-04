export function getAuthHeaders() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return {
    Authorization: `Bearer ${token}`,
  };
}