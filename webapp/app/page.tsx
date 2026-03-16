import { redirect } from 'next/navigation';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; extensionId?: string }>;
}) {
  const { code, extensionId } = await searchParams;

  // Fallback: if OAuth code lands here (misconfigured redirect URL),
  // forward it to the proper auth callback handler.
  if (code) {
    const params = new URLSearchParams({ code });
    if (extensionId) params.set('extensionId', extensionId);
    redirect(`/auth/callback?${params.toString()}`);
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
      WebkitFontSmoothing: 'antialiased',
    }}>

      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px', borderBottom: '1px solid #1f2937',
        position: 'sticky', top: 0, background: '#0a0a0fdd',
        backdropFilter: 'blur(12px)', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 32, height: 32, background: '#14B8A6', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: 'white', fontWeight: 700,
          }}>▶</span>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Clipmark</span>
        </div>
        <a
          href="https://chrome.google.com/webstore"
          style={{
            padding: '8px 18px', background: '#14B8A6', color: 'white',
            borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
        >
          Add to Chrome
        </a>
      </nav>

      {/* Hero */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', padding: '96px 24px 80px', gap: 24,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#14B8A620', border: '1px solid #14B8A640',
          borderRadius: 20, padding: '5px 14px', fontSize: 12,
          color: '#14B8A6', fontWeight: 600, letterSpacing: '0.3px',
          marginBottom: 8,
        }}>
          ✦ AI-powered YouTube bookmarking
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800,
          lineHeight: 1.1, letterSpacing: '-1.5px', maxWidth: 800,
          background: 'linear-gradient(135deg, #f9fafb 0%, #9ca3af 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Bookmark any YouTube moment.<br />Share it with the world.
        </h1>

        <p style={{
          fontSize: 18, color: '#6b7280', maxWidth: 520,
          lineHeight: 1.7, fontWeight: 400,
        }}>
          Clipmark lets you save, tag, and share timestamped moments from YouTube videos.
          AI fills in what you were watching. One click shares a curated guide.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          <a
            href="https://chrome.google.com/webstore"
            style={{
              padding: '12px 28px', background: '#14B8A6', color: 'white',
              borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: 'none',
            }}
          >
            Add to Chrome — it&apos;s free
          </a>
          <a
            href="#features"
            style={{
              padding: '12px 28px', background: '#1f2937', color: '#d1d5db',
              borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none',
            }}
          >
            See features →
          </a>
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" style={{ padding: '0 24px 100px', maxWidth: 1080, margin: '0 auto' }}>
        <h2 style={{
          textAlign: 'center', fontSize: 32, fontWeight: 700,
          letterSpacing: '-0.5px', marginBottom: 48, color: '#f3f4f6',
        }}>
          Everything you need to capture knowledge
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {[
            {
              icon: '⏱',
              title: 'One-click bookmarks',
              desc: 'Save any moment while watching. Press Alt+S for an instant silent save — no popup needed.',
              accent: '#14B8A6',
            },
            {
              icon: '✦',
              title: 'AI auto-descriptions',
              desc: 'Hit ✦ Auto and Clipmark reads the video transcript to fill in exactly what was being said.',
              accent: '#7c3aed',
            },
            {
              icon: '#',
              title: 'Tags & color coding',
              desc: 'Type #important, #review, #todo in any note. Markers on the progress bar light up in color.',
              accent: '#f59e0b',
            },
            {
              icon: '↗',
              title: 'Shareable public pages',
              desc: 'Share your curated timestamp guide as a public link. Anyone can click a bookmark to jump right in.',
              accent: '#22c55e',
            },
            {
              icon: '✦',
              title: 'AI summary',
              desc: 'One tap summarizes all your bookmarks into key topics, decisions, and action items.',
              accent: '#7c3aed',
            },
            {
              icon: '☁',
              title: 'Cloud sync',
              desc: 'Sign in with Google and your bookmarks follow you across every Chrome device automatically.',
              accent: '#3b82f6',
            },
            {
              icon: '⊞',
              title: 'Dashboard',
              desc: 'Browse all your bookmarks across every video. Filter, sort, bulk delete, export to JSON, CSV, or Markdown.',
              accent: '#14B8A6',
            },
            {
              icon: '▦',
              title: 'Embed anywhere',
              desc: 'Drop a bookmark collection into any webpage or Notion doc with a single iframe embed code.',
              accent: '#f472b6',
            },
            {
              icon: '👤',
              title: 'Public profiles',
              desc: 'Your shared collections live at clipmark.app/u/you — a curated video knowledge base, public to anyone.',
              accent: '#fb923c',
            },
          ].map(({ icon, title, desc, accent }) => (
            <div
              key={title}
              style={{
                background: '#111827', border: '1px solid #1f2937',
                borderRadius: 12, padding: '24px',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${accent}20`, border: `1px solid ${accent}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, marginBottom: 14, color: accent,
              }}>
                {icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb', marginBottom: 8 }}>
                {title}
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Keyboard shortcuts strip */}
      <section style={{
        background: '#111827', borderTop: '1px solid #1f2937',
        borderBottom: '1px solid #1f2937', padding: '40px 24px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#4b5563', fontWeight: 600, letterSpacing: '0.5px', marginBottom: 20, textTransform: 'uppercase' }}>
            Keyboard shortcuts
          </p>
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { key: 'Alt+B', label: 'Open popup' },
              { key: 'Alt+S', label: 'Silent save at current time' },
              { key: 'Ctrl+Shift+S', label: 'Quick save' },
            ].map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <kbd style={{
                  background: '#1f2937', border: '1px solid #374151',
                  borderRadius: 6, padding: '4px 10px', fontSize: 12,
                  fontFamily: 'monospace', color: '#14B8A6', fontWeight: 700,
                }}>
                  {key}
                </kbd>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <h2 style={{
          fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800,
          letterSpacing: '-1px', marginBottom: 16, color: '#f9fafb',
        }}>
          Start bookmarking smarter
        </h2>
        <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32 }}>
          Free forever. No account needed to start.
        </p>
        <a
          href="https://chrome.google.com/webstore"
          style={{
            padding: '14px 36px', background: '#14B8A6', color: 'white',
            borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: 'none',
          }}
        >
          Add to Chrome — it&apos;s free
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1f2937', padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 24, height: 24, background: '#14B8A6', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: 'white',
          }}>▶</span>
          <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 600 }}>Clipmark</span>
        </div>
        <p style={{ fontSize: 12, color: '#374151' }}>
          Built for people who take YouTube seriously.
        </p>
      </footer>
    </main>
  );
}
