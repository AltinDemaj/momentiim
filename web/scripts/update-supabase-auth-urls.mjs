#!/usr/bin/env node
/**
 * Set Supabase Auth site URL + redirect URLs for production web deploy.
 * Usage: node scripts/update-supabase-auth-urls.mjs https://web-alpha-three-29.vercel.app
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

const appUrl = (process.argv[2] ?? process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!appUrl || !accessToken || !projectRef) {
  console.error('Usage: node scripts/update-supabase-auth-urls.mjs https://your-app.vercel.app');
  process.exit(1);
}

async function main() {
  const patchRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      site_url: appUrl,
      uri_allow_list: `${appUrl}/auth/callback,${appUrl}/admin/login,momentiim://**`,
    }),
  });

  const body = await patchRes.text();
  if (!patchRes.ok) {
    console.error('Failed:', patchRes.status, body);
    process.exit(1);
  }

  console.log(`Supabase Auth URLs updated for ${appUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
