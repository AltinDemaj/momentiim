#!/usr/bin/env node
/**
 * Push web/.env.local vars to Vercel (production).
 * Usage: node scripts/sync-vercel-env.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_EMAILS',
  'GUEST_AUTH_SECRET',
  'NEXT_PUBLIC_APP_SCHEME',
  'NEXT_PUBLIC_APP_URL',
];

const envPath = resolve(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('Missing web/.env.local');
  process.exit(1);
}

const values = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  values[key] = value;
}

for (const key of KEYS) {
  const value = values[key];
  if (!value) {
    console.warn(`Skip ${key} (not set in .env.local)`);
    continue;
  }

  console.log(`Setting ${key}...`);
  const result = spawnSync(
    'npx',
    ['vercel', 'env', 'add', key, 'production', '--force'],
    {
      cwd: process.cwd(),
      input: `${value}\n`,
      encoding: 'utf8',
      shell: true,
    }
  );

  if (result.status !== 0) {
    console.error(result.stdout || result.stderr);
    process.exit(1);
  }
}

console.log('Vercel production env synced.');
