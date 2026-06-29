# PC + Phone Testing Guide

**PC = Admin** · **Phone = Guest**

---

## Part 1 — Admin on PC

### Start the dashboard

```powershell
cd c:\Users\Altin\Documents\Github\momentiim\web
npm run dev
```

Open **http://localhost:3000/admin/login**

| Field | Value |
|-------|--------|
| Email | `supremetinho@gmail.com` |
| Password | *(your password)* |

### Create a room

1. Click **New room** or **Create room**
2. Fill in room name, date, package tier
3. Click **Create room & generate QR**
4. On the room page: **copy the guest link** or screenshot the QR code

Example link:
```
momentiim://event/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Part 2 — Guest on phone

### One-time Supabase setting

[Auth → Providers](https://supabase.com/dashboard/project/klhjcsjkzohlohqejwpo/auth/providers)

Turn **Anonymous sign-ins** ON *(recommended)*

### Start the mobile app

```powershell
cd c:\Users\Altin\Documents\Github\momentiim\mobile
npx expo start
```

- Install **Expo Go** on your phone
- Scan the terminal QR code (same Wi‑Fi)
- If it fails: `npx expo start --tunnel`

### Join the room

**Option A — Deep link (easiest for testing)**

1. From admin room page, click **Copy link**
2. Send `momentiim://event/...` to your phone (WhatsApp, email, Notes)
3. Tap the link → app opens → room screen

**Option B — QR code**

Display the QR from admin on another screen and scan with your phone camera.

### Take a photo

1. Tap **Take photo** (allow camera permission)
2. Confirm upload succeeds and shots remaining decreases

---

## Part 3 — Back on PC (admin)

1. Open the room in admin → **Staging inbox** should show the photo
2. Click **Publish** → photo moves to **Guest room**
3. On phone, refresh/reopen room to see published photos *(gallery view coming soon)*

---

## Quick checklist

| Step | Device | Action |
|------|--------|--------|
| 1 | PC | Login at `/admin/login` |
| 2 | PC | Create room + copy link |
| 3 | Phone | Open Expo Go + load app |
| 4 | Phone | Tap `momentiim://event/...` link |
| 5 | Phone | Take a photo |
| 6 | PC | See photo in Staging inbox |
| 7 | PC | Publish to guest room |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Admin UI looks broken | Restart `npm run dev` after Tailwind install |
| Expo SDK mismatch | Project uses SDK 54 — update Expo Go from App Store |
| `expo-asset` error | Run `npm install` in `mobile/` folder |
| Can't join room on phone | Enable Anonymous auth in Supabase |
| Upload fails | Check phone has internet; guest must join room first |
