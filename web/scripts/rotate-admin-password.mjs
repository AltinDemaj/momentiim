#!/usr/bin/env node
/**
 * Rotate admin password and optionally refresh GUEST_AUTH_SECRET in .env.local
 *
 * Usage (from web/):
 *   npm run rotate-admin-password -- supremetinho@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return null;

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }

  return envPath;
}

function generatePassword() {
  const partA = randomBytes(5).toString('base64url');
  const partB = randomBytes(4).toString('hex');
  return `Mi-${partA}!${partB}`;
}

function generateGuestSecret() {
  return randomBytes(32).toString('hex');
}

function upsertEnvValue(envPath, key, value) {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  let found = false;

  const updated = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`${key}=${value}`);
  }

  writeFileSync(envPath, updated.join('\n').replace(/\n?$/, '\n'), 'utf8');
}

loadEnvLocal();

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run rotate-admin-password -- email@example.com');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const password = generatePassword();
const guestSecret = generateGuestSecret();

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Could not list users:', listError.message);
    process.exit(1);
  }

  const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password,
  });

  if (updateError) {
    console.error('Password update failed:', updateError.message);
    process.exit(1);
  }

  const envPath = resolve(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    upsertEnvValue(envPath, 'GUEST_AUTH_SECRET', guestSecret);
  }

  console.log('Admin password rotated successfully.');
  console.log(`Email: ${email}`);
  console.log(`New password: ${password}`);
  console.log('GUEST_AUTH_SECRET updated in web/.env.local (guest sessions will re-sync on next open).');
  console.log('Save this password in your password manager. It will not be shown again.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
