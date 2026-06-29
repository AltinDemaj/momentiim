export function getAdminAllowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowedForAdmin(email: string | undefined | null): boolean {
  const allowlist = getAdminAllowlist();
  if (allowlist.length === 0) {
    return process.env.NODE_ENV !== 'production';
  }
  return allowlist.includes(email?.toLowerCase() ?? '');
}

export function adminLoginPath(reason?: 'forbidden' | 'auth' | 'signed_out'): string {
  if (!reason) return '/admin/login';
  if (reason === 'signed_out') return '/admin/login?signed_out=1';
  return `/admin/login?error=${reason}`;
}
