import { createServerSupabase, type Collection, type Bookmark } from '@/lib/supabase';
import styles from './page.module.css';

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const metadata = { title: 'Revisit Queue — Clipmark' };

export default async function QueuePage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: collectionsData } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const collections = (collectionsData ?? []) as Collection[];

  // Revisit queue: all bookmarks that have a description (annotated) sorted by oldest
  const queue: (Bookmark & { collection: Collection })[] = collections
    .flatMap(c => (c.bookmarks ?? []).map((b: Bookmark) => ({ ...b, collection: c })))
    .filter(b => b.description)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Revisit Queue</h1>
        <p className={styles.sub}>Annotated bookmarks worth revisiting — oldest first.</p>
      </div>

      {queue.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'rgba(0,107,95,0.3)' }}>schedule</span>
          </div>
          <h3 className={styles.emptyTitle}>Queue is empty</h3>
          <p className={styles.emptyText}>
            Add notes to your bookmarks and they&apos;ll appear here for scheduled revisits.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {queue.map((b, i) => (
            <a key={i} href={`/v/${b.collection.id}`} className={styles.card}>
              <div className={styles.cardThumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${b.collection.video_id}/hqdefault.jpg`}
                  alt={b.collection.video_title ?? 'Video'}
                  className={styles.cardThumbImg}
                />
                <span className={styles.cardTimestamp}>{formatTimestamp(b.timestamp)}</span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardVideoTitle}>{b.collection.video_title ?? 'Untitled Video'}</p>
                <p className={styles.cardNote}>{b.description}</p>
                {b.tags?.length > 0 && (
                  <div className={styles.cardTags}>
                    {b.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.cardAction}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#006b5f' }}>play_circle</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
