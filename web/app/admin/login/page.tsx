import { redirect } from 'next/navigation';
import { Camera } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/auth';
import { LoginForm } from '@/components/admin/LoginForm';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signed_out?: string }>;
}) {
  const auth = await requireAdmin();
  if (!('error' in auth)) {
    redirect('/admin');
  }

  const params = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[color:var(--color-moment-bg)] px-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,233,211,0.08),transparent_60%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[16px] border border-[rgba(245,233,211,0.2)] bg-[color:var(--color-moment-accent-dim)]">
            <Camera className="h-7 w-7 text-[color:var(--color-moment-accent)]" strokeWidth={1.75} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Momenti Im</h1>
          <p className="mt-3 text-sm text-[color:var(--color-moment-text-secondary)]">
            Organizer access · manage rooms and guest vaults
          </p>
        </div>

        <LoginForm
          flashError={params.error}
          signedOut={params.signed_out === '1'}
        />
      </div>
    </div>
  );
}
