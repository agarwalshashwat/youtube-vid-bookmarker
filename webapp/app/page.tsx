export default function Home() {
  return (
    <main style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '40px 20px',
      gap: '20px', textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          width: 40, height: 40, background: '#5865f2', borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: 'white',
        }}>▶</span>
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px' }}>
          Bookmarker
        </span>
      </div>

      <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 420, lineHeight: 1.6 }}>
        Bookmark any moment in a YouTube video, tag it, and share a curated guide with anyone.
      </p>

      <a
        href="https://chrome.google.com/webstore"
        style={{
          display: 'inline-block', padding: '10px 24px',
          background: '#5865f2', color: 'white', borderRadius: 8,
          fontSize: 14, fontWeight: 600,
        }}
      >
        Add to Chrome — it&apos;s free
      </a>
    </main>
  );
}
