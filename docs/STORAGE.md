# Global media pool (full quality, zero duplicates)

Like **Marketi Juaj** shared product catalog: one physical file in the system, many events/guests can reference it.

## How it works

1. Guest shoots or picks a photo at **full quality** (no compression).
2. App computes **SHA-256** of the file bytes.
3. Supabase checks `global_media_blobs` — does this hash already exist?
   - **Yes** → skip upload, link the new photo row to the existing blob (`ref_count++`).
   - **No** → upload once to `global/{aa}/{bb}/{hash}.jpg`, then link.
4. On delete → `ref_count--`; storage file removed only when count hits **0**.

Same file forwarded on WhatsApp to 50 guests? **Stored once.**

## Tables

- `global_media_blobs` — `content_hash`, `storage_path`, `ref_count`, `byte_size`
- `photos.media_blob_id` — FK to shared blob

## RPCs

| Function | Purpose |
|----------|---------|
| `acquire_global_media_blob` | Register or find blob; returns `upload_required` |
| `commit_photo_upload(..., p_media_blob_id)` | Attach photo to blob |
| `release_global_media_blob` | Decrement refs; delete file when unused |
| `purge_orphan_media_blobs` | Clean failed uploads (ref_count=0, >24h) |

## Storage savings (realistic)

| Scenario | Without pool | With pool |
|----------|--------------|-----------|
| 50 guests upload same group photo | 50 × 3 MB = 150 MB | **3 MB** |
| Guest retries failed upload | 2× same file | **1×** |
| Same reel shared across guests | N × video size | **1×** |

Unique wedding shots are still unique — dedup helps most with **shared/forwards/retries**, not 500 totally different photos.

## Beyond dedup

For 500 guests each shooting **unique** full-res photos you still need either:

- **Supabase Pro** (100 GB), or
- **Cheaper blob storage** (Cloudflare R2) with Supabase holding metadata only

Dedup is the “trick” that costs nothing and keeps full quality.

## Admin maintenance

```http
POST /api/admin/storage/purge
{ "older_than_days": 7 }
```

Also runs `purge_orphan_media_blobs` for half-finished uploads.
