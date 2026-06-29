# Momentiim — Supabase setup

Your project is connected and migrations are applied.

| Item | Value |
|------|-------|
| Project URL | `https://klhjcsjkzohlohqejwpo.supabase.co` |
| Project ref | `klhjcsjkzohlohqejwpo` |
| Dashboard | [Open Supabase Dashboard](https://supabase.com/dashboard/project/klhjcsjkzohlohqejwpo) |

## What was done

- `.env.local` / `mobile/.env` configured (gitignored)
- Database schema applied (tables, RLS, RPCs, storage bucket)
- Package tiers seeded: Starter, Standard, Premium

## Your next steps

### 1. Create your admin account

1. Open [Authentication → Users](https://supabase.com/dashboard/project/klhjcsjkzohlohqejwpo/auth/users)
2. Click **Add user** → email + password
3. Copy your email into `web/.env.local`:

```
ADMIN_EMAILS=your@email.com
```

4. Promote to admin — [SQL Editor](https://supabase.com/dashboard/project/klhjcsjkzohlohqejwpo/sql/new):

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 2. Run the admin dashboard

```powershell
cd web
npm install
npm run dev
```

Open http://localhost:3000/admin/login

### 3. Link Supabase CLI (optional, for future migrations)

```powershell
npx supabase login
cd c:\Users\Altin\Documents\Github\momentiim
npx supabase link --project-ref klhjcsjkzohlohqejwpo
npx supabase db push
```

`supabase login` opens a browser — the CLI link failed earlier because you weren't logged in yet.

### 4. Test mobile app

See [TESTING.md](./TESTING.md).

---

## Security note

You shared API keys in chat. For a production launch, rotate the **service role** key in Supabase Dashboard → Settings → API. Never commit `.env.local` or post the service role key publicly.

Keys in this project use the JWT format (`eyJ...`) required by `@supabase/supabase-js`. The newer `sb_publishable_` / `sb_secret_` keys are an alternate format — the JWT keys in your `.env` files are correct.
