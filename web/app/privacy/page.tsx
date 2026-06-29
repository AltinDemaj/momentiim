import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Momenti Im',
};

export default function PrivacyPage() {
  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Privacy Policy</h1>
        <p style={styles.muted}>Last updated: June 2026</p>

        <section style={styles.section}>
          <h2 style={styles.h2}>What we collect</h2>
          <p style={styles.p}>
            Momenti Im collects photos, videos, and optional voice messages you submit as a wedding
            or event guest. We also store a display name, device identifier for your guest session,
            and optional push notification token if you enable notifications.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>How we use it</h2>
          <p style={styles.p}>
            Content is shared with the event hosts for curation and delivery to the guest album.
            You can delete your own photos and voice messages from the app at any time. Push
            notifications are used only for album updates (for example when memories are ready).
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Retention & deletion</h2>
          <p style={styles.p}>
            Event media is retained for the duration configured by the host. When you delete an
            item, it is removed from storage and the database. Contact us to request removal of
            other data associated with your guest account.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Contact</h2>
          <p style={styles.p}>
            Momenti Im ·{' '}
            <a href="tel:+38349405430" style={styles.link}>
              +383 49 405 430
            </a>
          </p>
        </section>

        <Link href="/" style={styles.back}>
          ← momentiim.com
        </Link>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    background: '#09090b',
    color: '#f5e9d3',
    padding: '48px 24px',
    fontFamily: 'system-ui, sans-serif',
  },
  card: { maxWidth: 640, margin: '0 auto', lineHeight: 1.6 },
  h1: { fontSize: 28, marginBottom: 8 },
  h2: { fontSize: 18, marginBottom: 8, color: '#c9a96e' },
  muted: { color: '#8a8178', marginBottom: 32 },
  section: { marginBottom: 28 },
  p: { color: '#d4cdc4', margin: 0 },
  link: { color: '#c9a96e' },
  back: { display: 'inline-block', marginTop: 32, color: '#8a8178' },
};
