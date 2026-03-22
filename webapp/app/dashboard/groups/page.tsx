import { createServerSupabase, type Collection } from '@/lib/supabase';
import styles from './page.module.css';

export const metadata = { title: 'Groups — Clipmark' };

export default async function GroupsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: collectionsData } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const collections = (collectionsData ?? []) as Collection[];

  // Group collections by unique tags across bookmarks
  const tagMap = new Map<string, Collection[]>();
  for (const c of collections) {
    const tags = Array.from(new Set((c.bookmarks ?? []).flatMap(b => b.tags ?? [])));
    if (tags.length === 0) {
      if (!tagMap.has('Untagged')) tagMap.set('Untagged', []);
      tagMap.get('Untagged')!.push(c);
    } else {
      for (const tag of tags) {
        if (!tagMap.has(tag)) tagMap.set(tag, []);
        tagMap.get(tag)!.push(c);
      }
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Groups</h1>
        <p className={styles.sub}>Your collections organised by tag.</p>
      </div>

      {collections.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'rgba(0,107,95,0.3)' }}>folder_shared</span>
          </div>
          <h3 className={styles.emptyTitle}>No groups yet</h3>
          <p className={styles.emptyText}>
            Tag your bookmarks in the extension and they&apos;ll be grouped automatically here.
          </p>
        </div>
      ) : (
        <div className={styles.groups}>
          {Array.from(tagMap.entries()).map(([tag, cols]) => (
            <div key={tag} className={styles.group}>
              <div className={styles.groupHeader}>
                <span className={styles.groupTag}>#{tag}</span>
                <span className={styles.groupCount}>{cols.length} video{cols.length !== 1 ? 's' : ''}</span>
              </div>
              <div className={styles.groupGrid}>
                {cols.slice(0, 4).map(c => (
                  <a key={c.id} href={`/v/${c.id}`} className={styles.groupCard}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://img.youtube.com/vi/${c.video_id}/hqdefault.jpg`}
                      alt={c.video_title ?? 'Video'}
                      className={styles.groupCardImg}
                    />
                    <div className={styles.groupCardOverlay}>
                      <p className={styles.groupCardTitle}>{c.video_title ?? 'Untitled Video'}</p>
                      <span className={styles.groupCardClips}>{c.bookmarks?.length ?? 0} clips</span>
                    </div>
                  </a>
                ))}
                {cols.length > 4 && (
                  <div className={styles.groupMore}>+{cols.length - 4} more</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
