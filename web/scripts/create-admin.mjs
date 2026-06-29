#!/usr/bin/env node
/**
 * Create or promote a Supabase admin user.
 *
 * Usage (from web/):
 *   node, run create-admin -- email@example.com "SecurePassword123"
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npm run create-admin -- email@example.com "password"');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  });

  let userId = created.user?.id;

  if (createError) {
    const exists =
      createError.message.toLowerCase().includes('already') ||
      createError.message.toLowerCase().includes('registered');

    if (!exists) {
      console.error('Create user failed:', createError.message);
      process.exit(1);
    }

    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Could not list users:', listError.message);
      process.exit(1);
    }

    const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existing) {
      console.error('User exists but could not be found by email.');
      process.exit(1);
    }

    userId = existing.id;

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { role: 'admin' },
    });

    if (updateAuthError) {
      console.error('Update user failed:', updateAuthError.message);
      process.exit(1);
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin', email })
    .eq('id', userId);

  if (profileError) {
    console.error('Update profile failed:', profileError.message);
    process.exit(1);
  }

  console.log(`Admin ready: ${email}`);
  console.log('Sign in at /admin/login');
  console.log(`Add to ADMIN_EMAILS in .env.local if using an allowlist.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
