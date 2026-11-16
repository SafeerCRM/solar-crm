export function getRoleDisplayName(
  role: string | null | undefined,
): string {
  const value = String(role || '').trim();

  if (value === 'FRANCHISE_MANAGER') {
    return 'Solar Mitra Manager';
  }

  if (value === 'FRANCHISE_HEAD') {
    return 'Solar Mitra Head';
  }

  return value.replace(/_/g, ' ');
}