# Publishing Momenti Im (mobile)

Home laptop media server is **planned later** — not part of v1.0. This release uses **Supabase Storage** + global dedup.

## What is already done in the app

- [x] i18n: Albanian (default), English, German
- [x] Profile: notifications, privacy, help (+383 49 405 430, WhatsApp, Viber, Instagram)
- [x] Photo/reel preview before send; guest delete own photos & voice
- [x] Push notification registration + deliver when album opens
- [x] Privacy policy page (`/privacy` on web)
- [x] App icons & splash (`mobile/assets/`)
- [x] `app.json`: permissions, bundle IDs, expo-notifications plugin
- [x] `eas.json` production/preview profiles
- [x] Global media dedup (same file stored once, full quality)
- [x] Production API default: `https://momentiim.com` (`mobile/lib/config.ts`)

## What you must do before store submit

### 1. Accounts

- [ ] [Expo account](https://expo.dev) + `npm i -g eas-cli` + `eas login`
- [ ] Apple Developer Program ($99/yr)
- [ ] Google Play Console ($25 one-time)

### 2. Deploy web admin to production

- [ ] Deploy `web/` to `https://momentiim.com` (or your domain)
- [ ] Supabase production project with all migrations applied
- [ ] Env on server: Supabase URL, service role, admin secrets

### 3. Mobile environment

Copy `mobile/.env.example` → `mobile/.env` for **local dev** only.  
For EAS builds, set secrets in Expo dashboard or `eas.json` env:

```bash
cd mobile
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://xxx.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value eyJ...
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://momentiim.com
```

Local dev override (LAN admin):

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

### 4. EAS project (required for push on real builds)

```bash
cd mobile
eas init
```

When prompted, add `projectId` to `app.json`:

```json
"extra": {
  "eas": { "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
  "privacyPolicyUrl": "https://momentiim.com/privacy"
}
```

### 5. Build

```bash
# Internal test APK
eas build --platform android --profile preview

# Store builds
eas build --platform ios --profile production
eas build --platform android --profile production
```

### 6. Submit

```bash
eas submit --platform ios
eas submit --platform android
```

### 7. Store listing checklist

- [ ] Privacy policy URL: `https://momentiim.com/privacy`
- [ ] Screenshots: 6.7" iPhone + Android phone (camera, album, profile)
- [ ] App description SQ + EN
- [ ] Category: Photo & Video or Events
- [ ] Age rating questionnaire
- [ ] iOS: APNs key uploaded in EAS (`eas credentials`) for push in production
- [ ] Android: Play data safety form (photos, microphone, device ID)

## Push notifications

Guests: **Profili → Njoftimet**.  
Tokens: `guest_push_tokens` table.  
Trigger: admin delivers / opens guest album → push to guests.

Test on a **physical device** (not simulator). Requires EAS `projectId`.

## Pre-submit smoke test

1. Join event with code on production API
2. Shoot photo + reel, voice message
3. Switch language in profile
4. Enable notifications
5. Open published album, download, share
6. Delete own photo / voice
7. Help links open phone / WhatsApp

## After v1.0 (backlog)

- Home laptop as always-on media server (Supabase = metadata only)
- Auto-delete old staging media from Supabase
- Store screenshots automation
