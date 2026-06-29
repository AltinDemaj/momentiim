import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { adminLoginPath } from '@/lib/admin/access';
import { redirect } from 'next/navigation';
import { Camera } from 'lucide-react';
import { AdminUserMenu } from '@/components/admin/AdminUserMenu';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdmin();

  if ('error' in auth) {
    redirect(
      auth.status === 403 ? adminLoginPath('forbidden') : adminLoginPath()
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-moment-bg)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,233,211,0.06),transparent_55%)]" />

      <header className="relative border-b border-[color:var(--color-moment-border)] bg-[rgba(11,11,12,0.85)] backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-10">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[rgba(245,233,211,0.2)] bg-[color:var(--color-moment-accent-dim)]">
                <Camera className="h-4 w-4 text-[color:var(--color-moment-accent)]" strokeWidth={1.75} />
              </div>
              <span className="font-semibold tracking-tight text-[color:var(--color-moment-text)]">
                Momenti Im
              </span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/admin"
                className="rounded-[10px] px-3 py-1.5 text-sm text-[color:var(--color-moment-muted)] motion-safe hover:bg-[rgba(255,255,255,0.05)] hover:text-[color:var(--color-moment-text)]"
              >
                Rooms
              </Link>
              <Link
                href="/admin/events/new"
                className="rounded-[10px] px-3 py-1.5 text-sm text-[color:var(--color-moment-muted)] motion-safe hover:bg-[rgba(255,255,255,0.05)] hover:text-[color:var(--color-moment-text)]"
              >
                New room
              </Link>
            </nav>
          </div>
          <AdminUserMenu email={auth.profile.email} />
        </div>
      </header>

      <main className="relative mx-auto max-w-[1400px] px-6 py-10 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
