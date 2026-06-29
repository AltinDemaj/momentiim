'use client';

import { LogOut } from 'lucide-react';
import { adminLogout } from '@/app/admin/login/actions';
import { Button } from '@/components/ui/admin-ui';

export function AdminUserMenu({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[220px] truncate text-xs text-[color:var(--color-moment-text-secondary)] sm:inline">
        {email}
      </span>
      <form action={adminLogout}>
        <Button type="submit" variant="ghost" className="px-3 py-1.5 text-xs">
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
          Sign out
        </Button>
      </form>
    </div>
  );
}
