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

function ytThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Derive a stable tag color from the tag string or bookmark color
function tagStyle(color: string | null | undefined): { background: string; color: string } {
  const base = color || '#006b5f';
  return {
    background: `${base}18`,
    color: base,
  };
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

  const { video_id, video_title, bookmarks, created_at, view_count } = collection;
  const title = video_title || 'Untitled Video';
  const ytBase = `https://www.youtube.com/watch?v=${video_id}`;
  const thumbnailUrl = ytThumbnailUrl(video_id);

  return (
    <div className={styles.page}>

      {/* ── Fixed glass nav ── */}
      <header className={styles.nav}>
        <a href="/" className={styles.navLogo}>Clipmark</a>

        <a href="/login" className={styles.navSecondaryAction}>
          Save this Collection
        </a>

        <a href="https://chrome.google.com/webstore" className={styles.heroCta}>
          Get Extension
        </a>
      </header>

      {/* ── Main content ── */}
      <main className={styles.main}>
        <div className={styles.grid}>

          {/* ── Left column (8-col) ── */}
          <div className={styles.leftCol}>

            {/* Video area */}
            <div className={styles.videoArea}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt={`Thumbnail for ${title}`}
                className={styles.videoThumb}
              />
              <div className={styles.videoOverlay}>
                <a
                  href={ytBase}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.playButton}
                  aria-label="Watch on YouTube"
                >
                  <span className={styles.playIcon} />
                </a>
              </div>
            </div>

            {/* Editorial header */}
            <div className={styles.editorialHeader}>
              <h1 className={styles.videoTitle}>{title}</h1>
              <p className={styles.sharedBy}>
                Shared via{' '}
                <span className={styles.sharedByHighlight}>Clipmark</span>
              </p>
            </div>

            {/* Curation highlights / timeline */}
            <div className={styles.highlights}>
              <h3 className={styles.highlightsHeading}>
                Curation Highlights
                <span className={styles.clipsCount}>
                  {bookmarks.length} Clip{bookmarks.length !== 1 ? 's' : ''}
                </span>
              </h3>

              <ul className={styles.timelineList}>
                {bookmarks.map((b: Bookmark, i: number) => (
                  <li key={b.id ?? i} className={styles.timelineItem}>
                    <span className={styles.timelineDot} />
                    <div className={styles.timelineItemBody}>
                      <a
                        href={ytUrl(video_id, b.timestamp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.tsLink}
                      >
                        {formatTimestamp(b.timestamp)}
                      </a>
                      {b.description && (
                        <h4 className={styles.bookmarkTitle}>
                          {b.description}
                        </h4>
                      )}
                      {b.tags && b.tags.length > 0 && (
                        <div className={styles.tagList}>
                          {b.tags.map(tag => (
                            <span
                              key={tag}
                              className={styles.tagPill}
                              style={tagStyle(b.color)}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>{/* /leftCol */}

          {/* ── Right sidebar (4-col) ── */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarInner}>

              {/* Collection details card */}
              <div className={styles.sideCard}>
                <div>
                  <h5 className={styles.sideCardHeading}>Collection Details</h5>
                  <ul className={styles.metaList}>
                    <li className={styles.metaRow}>
                      <span className={styles.metaLabel}>Shared Date</span>
                      <span className={styles.metaValue}>
                        {formatDate(created_at)}
                      </span>
                    </li>
                    <li className={styles.metaRow}>
                      <span className={styles.metaLabel}>Total Clips</span>
                      <span className={styles.metaValue}>
                        {bookmarks.length.toString().padStart(2, '0')}
                      </span>
                    </li>
                    <li className={styles.metaRow}>
                      <span className={styles.metaLabel}>Total Views</span>
                      <span className={styles.metaValue}>
                        {(view_count ?? 0).toLocaleString()}
                      </span>
                    </li>
                  </ul>
                </div>

                <hr className={styles.sideCardDivider} />

                <div className={styles.sideCardActions}>
                  <a
                    href={ytBase}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sideBtn}
                  >
                    Watch on YouTube
                  </a>
                  <button className={styles.sideBtnSecondary}>
                    Share this collection
                  </button>
                </div>
              </div>

              {/* Promo card */}
              <div className={styles.promoCard}>
                <h6 className={styles.promoTitle}>Want to clip your own?</h6>
                <p className={styles.promoBody}>
                  Clipmark makes it easy to save, organize, and share highlights
                  from any video — instantly.
                </p>
                <a
                  href="https://chrome.google.com/webstore"
                  className={styles.promoLink}
                >
                  Get the Browser Extension →
                </a>
              </div>

            </div>
          </aside>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>Clipmark</span>
            <span className={styles.footerTagline}>© 2025 Clipmark. The Digital Curator.</span>
          </div>
          <ul className={styles.footerLinks}>
            <li><a href="#" className={styles.footerLink}>Privacy</a></li>
            <li><a href="#" className={styles.footerLink}>Terms</a></li>
            <li><a href="#" className={styles.footerLink}>Support</a></li>
            <li><a href="#" className={styles.footerLink}>Twitter</a></li>
          </ul>
        </div>
      </footer>

    </div>
  );
}
