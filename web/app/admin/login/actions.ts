'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/auth';
import { adminLoginPath } from '@/lib/admin/access';

export type LoginState = {
  error: string | null;
};

export async function adminLogin(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: 'Invalid email or password.' };
  }

  const auth = await requireAdmin();
  if ('error' in auth) {
    await supabase.auth.signOut();

    if (auth.status === 403) {
      return { error: 'This account does not have admin access.' };
    }

    return { error: 'Could not sign in. Try again or contact support.' };
  }

  redirect('/admin');
}

export async function adminLogout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(adminLoginPath('signed_out'));
}
