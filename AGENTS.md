# Momentiim

Event-scoped disposable camera for weddings/events. Monorepo with three runnable pieces sharing one Supabase backend:

- `web/` — Next.js 15 admin dashboard + all API routes (`/admin/*`, `/api/*`). Port 3000.
- `mobile/` — Expo (React Native, SDK 54) guest camera app. Metro port 8081. Entry `expo-router/entry`.
- `supabase/` — Postgres schema (30+ migrations), RLS, RPCs, `event-photos` storage bucket.

Product/architecture details: see `docs/ARCHITECTURE.md` and `docs/SETUP.md`. Package managers: `npm` in both `web/` and `mobile/` (no root workspace).

## Cursor Cloud specific instructions

The update script only refreshes JS deps (`npm install` in `web/` and `mobile/`). Docker, the Supabase CLI, service startup, and DB bring-up are NOT in the update script — handle them as described below.

### Local backend (Supabase) — required for anything to work

Both apps point at a **local** Supabase stack. Docker + the Supabase CLI are pre-installed in the VM snapshot. On a fresh VM you must start them each session:

```bash
sudo dockerd > /tmp/dockerd.log 2>&1 &     # if `docker ps` fails; daemon isn't auto-started
sudo chmod 666 /var/run/docker.sock          # so the CLI can talk to docker without sudo
supabase start                               # run from repo root; brings up stack on 54321-54324
```

If the Docker volume from a previous session persisted, `supabase start` restores the already-migrated DB (with the admin user) and you can skip the migration steps below.

Note (Docker 29): `/etc/docker/daemon.json` sets `storage-driver: fuse-overlayfs` and disables the `containerd-snapshotter` feature — required for docker-in-docker here. Don't remove it.

### DB migration bring-up (only needed on a FRESH Supabase volume)

Non-obvious gotcha: the migrations are **not** compatible with the CLI's auto-apply.
- `003a_add_admin_role.sql` is skipped by the CLI (filename lacks a numeric-only version prefix) yet it must run **before** `003_admin_staging_workflow.sql` (it commits the `admin` enum value). So `supabase start`/`supabase db reset` fail on a fresh DB.
- Tables applied as the plain `postgres` role do **not** receive the `anon/authenticated/service_role` DML grants that hosted Supabase provides by default, so login (`profiles` read) and API writes fail with "permission denied".

Do NOT rename migrations or edit `config.toml` (would break the hosted project's migration tracking). Instead bring up a fresh DB manually:

```bash
# 1) Start the stack with an EMPTY migrations dir so the CLI doesn't fail:
mv supabase/migrations /tmp/mig && mkdir supabase/migrations && supabase start
rmdir supabase/migrations && mv /tmp/mig supabase/migrations

# 2) Apply all migrations as postgres, with 003a inserted before 003:
DB=supabase_db_momentiim
for f in $(ls supabase/migrations/*.sql | sort | grep -v 003a); do
  [[ "$f" == *003_admin_staging_workflow* ]] && docker exec -i $DB psql -v ON_ERROR_STOP=1 -U postgres -d postgres < supabase/migrations/003a_add_admin_role.sql
  docker exec -i $DB psql -v ON_ERROR_STOP=1 -U postgres -d postgres < "$f"
done

# 3) Grant standard Supabase DML privileges (RLS still enforces row access), then restore two intended REVOKEs:
docker exec -i $DB psql -U postgres -d postgres <<'SQL'
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.release_global_media_blob(UUID) FROM authenticated;
REVOKE ALL ON FUNCTION public.check_api_rate_limit(TEXT, INT, INT) FROM PUBLIC;
SQL
```

### Env files (gitignored — recreate if missing)

Both use the local stack's default keys printed by `supabase start` (JWT-format keys, required by `@supabase/supabase-js`).

- `web/.env.local`: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS=admin@momentiim.local`, `NEXT_PUBLIC_APP_SCHEME=momentiim`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `GUEST_AUTH_SECRET=<any>`. Social/TikTok/Instagram/Gmail vars (`web/env.social.example`) are optional.
- `mobile/.env`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (same as web), `EXPO_PUBLIC_API_URL=http://localhost:3000`.

### Admin user

Seeded admin: `admin@momentiim.local` / `Momentiim123!`. Recreate with `cd web && npm run create-admin -- admin@momentiim.local "Momentiim123!"`. If the profile update fails with "permission denied", the DML grants above are missing.

### Running / checking

- Web: `cd web && npm run dev` (http://localhost:3000, admin at `/admin/login`). Type-check: `npx tsc --noEmit` (passes clean). There is **no ESLint config and no test suite** — `tsc` is the lint/typecheck.
- Mobile: `cd mobile && npx expo start` (Metro on 8081). Full guest capture flow needs a physical device / emulator (`momentiim://` deep links, camera). `npx expo tsc --noEmit` currently reports pre-existing type errors (Supabase `Database` generic isn't wired into the mobile client — types resolve to `never`); these do NOT block Metro/Babel bundling. Verify bundling with `npx expo export --platform ios`. `expo-device`/`expo-notifications` show SDK-version mismatch warnings (pre-existing).

### Dev gotchas

- Next.js dev: after restarting `next dev`, an open browser tab may throw `UnrecognizedActionError: Server Action ... was not found`. This is stale action IDs — hard-refresh (Ctrl+Shift+R) the tab. Not an app bug.
- `/admin` redirects to `/admin/rooms` (the "Event command hub"). Create events there; each event gets a join code + QR (`/join/<code>`).
