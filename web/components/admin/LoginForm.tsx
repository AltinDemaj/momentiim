'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { adminLogin, type LoginState } from '@/app/admin/login/actions';
import { Button, Card, Input, Label } from '@/components/ui/admin-ui';

const initialState: LoginState = { error: null };

const FLASH_MESSAGES: Record<string, string> = {
  forbidden: 'This account does not have admin access.',
  auth: 'Sign-in link expired or is invalid. Try again.',
};

export function LoginForm({
  flashError,
  signedOut,
}: {
  flashError?: string;
  signedOut?: boolean;
}) {
  const [state, formAction, pending] = useActionState(adminLogin, initialState);
  const flashMessage = flashError ? FLASH_MESSAGES[flashError] : null;

  return (
    <Card>
      <form action={formAction} className="space-y-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        {signedOut && (
          <p className="rounded-[14px] border border-[rgba(83,215,105,0.25)] bg-[rgba(83,215,105,0.08)] px-4 py-3 text-sm text-[color:var(--color-moment-success)]">
            You have been signed out.
          </p>
        )}

        {(flashMessage || state.error) && (
          <p className="rounded-[14px] border border-[rgba(255,92,92,0.25)] bg-[rgba(255,92,92,0.08)] px-4 py-3 text-sm text-[color:var(--color-moment-danger)]">
            {state.error ?? flashMessage}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </Card>
  );
}
