# TikTok Developer Portal — Complete This Checklist

App: **Momenti Im** · App ID `7657702904043767815`

---

## 1. Login Kit → Redirect URIs (add both)

```
https://web-alpha-three-29.vercel.app/api/admin/tiktok/callback
http://localhost:3001/api/admin/tiktok/callback
```

Save, then click **Save** at top of portal.

---

## 2. Products (Production tab)

Add product:

| Product | Scopes to request |
|---------|-------------------|
| **Login Kit** | (required for OAuth) |
| **Content Posting API** | `video.publish`, `video.upload` |

---

## 3. Basic information

| Field | Value |
|-------|-------|
| App name | Momenti Im |
| Category | Photo & Video / Social |
| Description | Wedding & event disposable-camera app. Admin dashboard generates anonymized 9:16 marketing previews and publishes them to TikTok via Content Posting API (photo direct post). |
| Website URL | `https://web-alpha-three-29.vercel.app` |
| Privacy Policy URL | `https://web-alpha-three-29.vercel.app/privacy` |
| Terms of Service URL | `https://web-alpha-three-29.vercel.app/terms` |
| Platforms | **Web** |

---

## 4. App review — copy/paste description

**How does your app use TikTok APIs?**

> Momenti Im is a web admin dashboard for wedding photographers and event hosts. From `/admin/social`, authorized admins review auto-generated anonymized 9:16 marketing mockups (no real guest names or photos). When they click **Publish to IG & TikTok (Test)**, our server calls the TikTok Content Posting API to direct-post a single photo (JPEG) to the connected TikTok account. Posts default to `SELF_ONLY` privacy for testing. We use OAuth 2.0 PKCE so the business owner authorizes once; tokens are stored server-side in Vercel env vars.

**Why do you need `video.publish`?**

> We publish static photo carousels (single-image posts) using the photo direct post endpoint (`media_type: PHOTO`, `post_mode: DIRECT_POST`). TikTok documents photo posting under the Content Posting API with the `video.publish` scope.

---

## 5. Demo video

Upload:

```
tiktok-app-review/demo/momentiim-tiktok-integration-demo.mp4
```

Shows real login → Social queue → Generate → Publish button.

---

## 6. After deploy — connect TikTok (one-time)

1. Open `https://web-alpha-three-29.vercel.app/admin/login`
2. Go to **Social** → click **Connect TikTok** in the setup banner
3. Approve scopes in TikTok
4. Copy `TIKTOK_ACCESS_TOKEN` + `TIKTOK_REFRESH_TOKEN` to **Vercel → web → Settings → Environment Variables → Production**
5. Redeploy

Also set in Vercel Production:

```
NEXT_PUBLIC_APP_URL=https://web-alpha-three-29.vercel.app
TIKTOK_CLIENT_KEY=aww2oufahlnczknl
TIKTOK_CLIENT_SECRET=(from portal)
TIKTOK_PRIVACY_LEVEL=SELF_ONLY
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841415616219053
INSTAGRAM_ACCESS_TOKEN=(from Meta Graph API Explorer — see below)
CRON_SECRET=(same as local)
GMAIL_USER / GMAIL_APP_PASSWORD / GMAIL_FROM
ADMIN_EMAILS=supremetinho@gmail.com
```

---

## 7. Instagram token (Meta)

1. [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app → User Token → permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
3. Generate token → extend to long-lived (60 days)
4. Get IG User ID: `17841415616219053` (@momentiim.official) — already in Meta Business Suite
5. Add `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID=17841415616219053` to Vercel

---

## 8. Submit

When demo video is uploaded and products/scopes are added → **Submit for review**.

TikTok review typically takes a few business days. Until approved, OAuth may work in sandbox but `video.publish` may be limited.
