-- Allow studio audio uploads (MP3, M4A, WAV, etc.) in event-photos bucket

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/vorbis',
  'application/octet-stream'
]
WHERE id = 'event-photos';
