import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase, type Collection, type Bookmark } from '@/lib/supabase';
import styles from './page.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function ytUrl(videoId: string, timestamp: number): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(timestamp)}`;
}

// ─── Fetch data (server-side) ─────────────────────────────────────────────────
async function getCollection(shareId: string): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', shareId)
    .single();

  if (error || !data) return null;

  // Increment view count (fire-and-forget)
  supabase
    .from('collections')
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq('id', shareId)
    .then(() => {});

  return data as Collection;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ shareId: string }> }
): Promise<Metadata> {
  const { shareId } = await params;
  const collection = await getCollection(shareId);
  if (!collection) return { title: 'Not found — Clipmark' };

  const title = collection.video_title || 'YouTube Video';
  return {
    title: `${title} — Clipmark`,
    description: `${collection.bookmarks.length} timestamped bookmarks for "${title}"`,
    openGraph: {
      title: `${title} — Clipmark`,
      description: `${collection.bookmarks.length} curated moments from this video.`,
      type: 'website',
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function SharePage(
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  const collection = await getCollection(shareId);
  if (!collection) notFound();

  const { video_id, video_title, bookmarks } = collection;
  const title = video_title || 'Untitled Video';
  const ytBase = `https://www.youtube.com/watch?v=${video_id}`;

  return (
    <div className={styles.page}>

      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <a href="/" className={styles.navLogo}>
          <span className={styles.logoIcon}>▶</span>
          <span className={styles.logoText}>Clipmark</span>
        </a>
        <a href={ytBase} target="_blank" rel="noopener noreferrer" className={styles.navLink}>
          Watch on YouTube →
        </a>
      </nav>

      {/* ── Video hero ── */}
      <div className={styles.hero}>
        <h1 className={styles.videoTitle}>{title}</h1>
        <p className={styles.videoMeta}>
          <span>{bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}</span>
          <span className={styles.dot}>·</span>
          <a href={ytBase} target="_blank" rel="noopener noreferrer" className={styles.ytLink}>
            youtube.com/watch?v={video_id}
          </a>
        </p>
      </div>

      {/* ── Bookmark list ── */}
      <div className={styles.listWrapper}>
        {bookmarks.map((b: Bookmark, i: number) => (
          <a
            key={b.id ?? i}
            href={ytUrl(video_id, b.timestamp)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.row}
          >
            <span
              className={styles.timestamp}
              style={{ color: b.color || '#5865f2' }}
            >
              {formatTimestamp(b.timestamp)}
            </span>

            <div className={styles.rowBody}>
              <span className={styles.description}>
                {b.description || 'No description'}
              </span>
              {b.tags && b.tags.length > 0 && (
                <div className={styles.tags}>
                  {b.tags.map(tag => (
                    <span
                      key={tag}
                      className={styles.tag}
                      style={{ background: b.color || '#5865f2' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <span className={styles.arrow}>→</span>
          </a>
        ))}
      </div>

      {/* ── Footer CTA ── */}
      <footer className={styles.footer}>
        <a href="/" className={styles.footerBrand}>
          <span className={styles.logoIcon}>▶</span>
          <span>Made with <strong>Clipmark</strong></span>
        </a>
        <a href="https://chrome.google.com/webstore" className={styles.footerLink}>
          Bookmark your own videos — it&apos;s free →
        </a>
      </footer>

    </div>
  );
}
