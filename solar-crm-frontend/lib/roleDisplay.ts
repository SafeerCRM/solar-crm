export function getRoleDisplayName(
  role: string | null | undefined,
): string {
  const value = String(role || '').trim();

  if (value === 'FRANCHISE_MANAGER') {
    return 'SOLAR MITRA MANAGER';
  }

  if (value === 'FRANCHISE_HEAD') {
    return 'SOLAR MITRA HEAD';
  }

  return value.replace(/_/g, ' ');
}