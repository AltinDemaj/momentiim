#!/usr/bin/env node
/**
 * Apply hosted Supabase Auth security settings via Management API.
 *
 * Requires:
 *   SUPABASE_ACCESS_TOKEN — https://supabase.com/dashboard/account/tokens
 *   NEXT_PUBLIC_SUPABASE_URL (in web/.env.local) or SUPABASE_PROJECT_REF
 *
 * Usage (from web/):
 *   npm run configure-supabase-auth
 */

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

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!accessToken) {
  console.error('Missing SUPABASE_ACCESS_TOKEN.');
  console.error('Create one at https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

if (!projectRef) {
  console.error('Could not resolve project ref from NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const authConfig = {
  disable_signup: true,
  external_anonymous_users_enabled: true,
  rate_limit_anonymous_users: 30,
  rate_limit_otp: 60,
  rate_limit_verify: 360,
  rate_limit_token_refresh: 1800,
  rate_limit_web3: 30,
};

async function main() {
  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(authConfig),
  });

  const patchBody = await patchRes.text();
  if (!patchRes.ok) {
    console.error('Auth config update failed:', patchRes.status, patchBody);
    process.exit(1);
  }

  console.log(`Auth security applied to project ${projectRef}:`);
  console.log('  - Public email signup: disabled');
  console.log('  - Anonymous sign-ins: enabled (guest app flow)');
  console.log('  - Auth rate limits: tightened (see dashboard → Auth → Rate Limits)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
