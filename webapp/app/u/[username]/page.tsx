import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabase, type Profile, type Collection } from '@/lib/supabase';
import styles from './page.module.css';

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function getProfile(username: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();
  return data as Profile | null;
}

async function getUserCollections(userId: string): Promise<Collection[]> {
  const { data } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Collection[];
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: 'User not found — Clipmark' };
  return {
    title: `@${username} — Clipmark`,
    description: `Bookmark collections by @${username}`,
  };
}

export default async function UserProfilePage(
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const collections = await getUserCollections(profile.id);

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a href="/" className={styles.navLogo}>
          <span className={styles.logoIcon}>▶</span>
          <span className={styles.logoText}>Clipmark</span>
        </a>
      </nav>

      <div className={styles.profile}>
        <div className={styles.avatar}>{username[0].toUpperCase()}</div>
        <div>
          <h1 className={styles.username}>@{username}</h1>
          <p className={styles.meta}>{collections.length} collection{collections.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className={styles.empty}>
          <p>No public collections yet.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {collections.map(c => (
            <a key={c.id} href={`/v/${c.id}`} className={styles.card}>
              <div className={styles.cardThumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${c.video_id}/hqdefault.jpg`}
                  alt={c.video_title ?? 'YouTube video'}
                />
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardTitle}>{c.video_title ?? 'Untitled Video'}</p>
                <p className={styles.cardMeta}>
                  {c.bookmarks.length} bookmark{c.bookmarks.length !== 1 ? 's' : ''}
                  {' · '}
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
                {c.bookmarks.slice(0, 2).map((b, i) => (
                  <p key={i} className={styles.cardSnippet}>
                    <span style={{ color: b.color || '#14B8A6', fontWeight: 700, fontSize: 11 }}>
                      {formatTimestamp(b.timestamp)}
                    </span>
                    {' '}
                    {b.description || 'No description'}
                  </p>
                ))}
              </div>
            </a>
          ))}
        </div>
      )}

      <footer className={styles.footer}>
        <a href="/">Clipmark</a>
      </footer>
    </div>
  );
}
