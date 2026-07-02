import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Momenti Im',
};

export default function TermsPage() {
  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Terms of Service</h1>
        <p style={styles.muted}>Last updated: July 2026</p>

        <section style={styles.section}>
          <h2 style={styles.h2}>Service</h2>
          <p style={styles.p}>
            Momenti Im provides disposable-camera style photo and video capture for weddings and
            private events. Hosts create rooms; guests join via QR code and upload content to a
            shared album controlled by the host.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Acceptable use</h2>
          <p style={styles.p}>
            You may not upload illegal, harassing, or non-consensual content. Hosts are responsible
            for their event rooms and guest access. We may suspend accounts that violate these
            terms or applicable law.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Content & privacy</h2>
          <p style={styles.p}>
            You retain ownership of media you upload. By uploading, you grant Momenti Im and the
            event host a license to store, display, and deliver that content within the event
            album. See our{' '}
            <Link href="/privacy" style={styles.link}>
              Privacy Policy
            </Link>{' '}
            for data handling details.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Third-party integrations</h2>
          <p style={styles.p}>
            Optional features (such as publishing marketing previews to Instagram or TikTok) use
            those platforms&apos; APIs under their respective terms. You authorize Momenti Im to
            post on your connected accounts only when you explicitly trigger publish actions in
            the admin dashboard.
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
