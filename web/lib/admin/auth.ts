import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isEmailAllowedForAdmin } from '@/lib/admin/access';
import type { Profile } from '@/types/database';

export async function requireAdmin(): Promise<
  { profile: Profile; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> } | { error: string; status: number }
> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (!isEmailAllowedForAdmin(user.email)) {
    return { error: 'Forbidden', status: 403 };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: 'Profile not found', status: 404 };
  }

  if (profile.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return { profile, supabase };
}
