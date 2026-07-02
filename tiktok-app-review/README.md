# TikTok App Review — Demo Video

## Upload this file

```
tiktok-app-review/demo/momentiim-tiktok-integration-demo.mp4
```

Drag and drop into **TikTok Developer Portal → App Review → Demo video**.

See `demo/UPLOAD-THIS.txt` for a quick checklist.

## What the video shows

1. Admin login at `https://web-alpha-three-29.vercel.app/admin/login`
2. Social Content Queue dashboard (`/admin/social`)
3. Marketing mockup draft cards (9:16 anonymized wedding assets)
4. Click **Publish to IG & TikTok (Test)** — Content Posting API integration
5. Publish result on the card

## Re-record locally (optional)

```powershell
cd web
$env:DEMO_ADMIN_EMAIL="your@gmail.com"
$env:DEMO_ADMIN_PASSWORD="your-admin-password"
$env:DEMO_BASE_URL="https://web-alpha-three-29.vercel.app"
npm run record-tiktok-demo
```

Requires [ffmpeg](https://ffmpeg.org/) for MP4 output (TikTok accepts mp4/mov).

## TikTok form checklist

| Field | Value |
|-------|-------|
| Website URL | `https://web-alpha-three-29.vercel.app` |
| Privacy Policy | `https://web-alpha-three-29.vercel.app/privacy` |
| Terms of Service | `https://web-alpha-three-29.vercel.app/terms` |
| Platforms | Web |
| Product | Content Posting API |
| Scope | `video.publish` (photo direct post) |

See `PORTAL-FORM.md` for the full portal checklist (redirect URIs, scopes, copy-paste review text).
