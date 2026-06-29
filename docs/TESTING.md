# Testing Momentiim on a Physical Phone

This guide covers running the **Expo guest app** on your iPhone or Android device during development.

---

## Prerequisites

- Node.js 20+
- [Expo Go](https://expo.dev/go) installed on your phone (quickest path), **or** a [development build](https://docs.expo.dev/develop/development-builds/introduction/) for full native features
- Supabase project with migrations applied
- Phone and computer on the **same Wi‑Fi network** (for LAN mode)

---

## 1. Set up Supabase

```bash
cd momentiim
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Promote yourself to admin:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 2. Run the admin dashboard (create a test event)

```bash
cd web
cp .env.example .env.local   # fill in Supabase keys
npm install
npm run dev
```

Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login), sign in, create an event, and **save the QR code** (screenshot or download).

---

## 3. Scaffold & run the mobile app

If you haven't initialized Expo yet:

```bash
cd mobile
npx create-expo-app@latest . --template blank-typescript
# then copy in hooks/, lib/, and install deps:
npm install @supabase/supabase-js expo-image-picker expo-file-system expo-secure-store expo-linking
npx expo install expo-image-picker expo-file-system
```

Create `mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Configure deep links in `app.json`

```json
{
  "expo": {
    "scheme": "momentiim",
    "slug": "momentiim",
    "name": "Momentiim",
    "ios": {
      "bundleIdentifier": "com.yourname.momentiim"
    },
    "android": {
      "package": "com.yourname.momentiim"
    }
  }
}
```

Deep link format: `momentiim://event/{eventId}`

---

## 4. Start Expo and connect your phone

```bash
cd mobile
npx expo start
```

### Option A — Expo Go (fastest)

1. Scan the **QR code in the terminal** with:
   - **iPhone:** Camera app → opens Expo Go
   - **Android:** Expo Go app → Scan QR
2. App loads on your device over LAN.

If connection fails, press `s` in the terminal to switch to **tunnel** mode (slower but works across networks/firewalls):

```bash
npx expo start --tunnel
```

### Option B — Development build (recommended before production)

Expo Go has limits (e.g. some native modules). For camera-heavy apps:

```bash
npx expo install expo-dev-client
eas build --profile development --platform ios   # or android
```

Install the built `.ipa` / `.apk` on your device, then:

```bash
npx expo start --dev-client
```

---

## 5. Test the full guest flow on phone

### A. Join event via deep link

Without a QR scanner built yet, open the link manually:

**iOS Simulator:** `xcrun simctl openurl booted "momentiim://event/YOUR_EVENT_UUID"`

**Physical device:** Send yourself the link (iMessage, Notes, etc.):
```
momentiim://event/YOUR_EVENT_UUID
```

Tap it — the app should open on the event screen and call `register_event_guest`.

### B. Test upload

1. Grant camera permission when prompted
2. Tap shoot → pick from camera or gallery
3. Confirm upload succeeds and `photos_remaining` decrements

### C. Verify staging inbox (admin)

1. Open `/admin/events/{id}` on your laptop
2. Photo should appear under **Staging inbox**
3. Guest app should **not** show the photo in the event room yet

### D. Publish & verify event room

1. Click **Publish to event room** in admin
2. Re-open guest gallery — photo should now appear

---

## 6. Test with a printed QR code

1. Create event in admin → screenshot the QR
2. AirDrop/print it or display on another screen
3. Scan with phone camera → should open `momentiim://event/...`

For Expo Go, universal links won't work until you configure `associatedDomains` (iOS) / App Links (Android) on a **production/dev build**. Custom scheme `momentiim://` works once the app is installed.

---

## 7. Common issues

| Problem | Fix |
|---------|-----|
| "Unable to connect" in Expo Go | Same Wi‑Fi; try `--tunnel` |
| Camera doesn't open | Use real device (simulator camera is limited); check permissions in Settings |
| Upload fails with 403 | Guest must be registered (`register_event_guest`); check RLS + storage policies |
| Deep link opens browser, not app | Custom scheme only works with dev/production build installed, not always in Expo Go — test with `npx uri-scheme open momentiim://event/UUID --ios` |
| HEIC photos fail on Android | Ensure bucket allows `image/heic`; test JPEG first |

---

## 8. Minimal smoke-test checklist

- [ ] Admin login works
- [ ] Create event + QR displays
- [ ] Deep link opens app on phone
- [ ] Guest registered with correct shot limit
- [ ] Camera upload lands in staging inbox
- [ ] Publish makes photo visible to guest
- [ ] Limit blocks upload when shots = 0

---

## Next: production testing

When ready for real events:

1. `eas build --platform all` for store/internal distribution
2. TestFlight (iOS) or internal APK (Android)
3. Print QR cards using admin-generated QR PNG
4. Decide final reveal timing (manual publish vs scheduled job on `reveal_scheduled_at`)
