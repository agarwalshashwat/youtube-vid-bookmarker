'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import styles from '../shell.module.css';

interface Props {
  username: string;
  avatarInitial: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}

export default function DashboardChrome({ username, avatarInitial, avatarUrl, children }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') ?? 'library';

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/dashboard?view=library' || href === '/dashboard?view=timeline') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const isTimeline = pathname === '/dashboard' && view === 'timeline';

  return (
    <div className={styles.page}>

      {/* ── Top App Bar ── */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <a href="/" className={styles.logo}>Clipmark</a>
          <nav className={styles.topNav}>
            <a
              href="/dashboard?view=library"
              className={`${styles.topNavLink} ${pathname === '/dashboard' && !isTimeline ? styles.topNavLinkActive : ''}`}
            >
              Library
            </a>
            <a
              href="/dashboard?view=timeline"
              className={`${styles.topNavLink} ${isTimeline ? styles.topNavLinkActive : ''}`}
            >
              Timeline
            </a>
            <a
              href="/dashboard/shared"
              className={`${styles.topNavLink} ${pathname === '/dashboard/shared' ? styles.topNavLinkActive : ''}`}
            >
              Shared
            </a>
          </nav>
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#6c7a77' }}>search</span>
            <input type="text" placeholder="Search your bookmarks..." className={styles.searchInput} />
          </div>
          <button className={styles.iconBtn} aria-label="Settings">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>
          </button>
          <button className={styles.iconBtn} aria-label="Help">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>help</span>
          </button>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={username} className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>{avatarInitial}</div>
          )}
        </div>
      </header>

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarBrandIcon}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
          </div>
          <div>
            <p className={styles.sidebarBrandName}>The Curator</p>
            <p className={styles.sidebarBrandSub}>Editorial Collection</p>
          </div>
        </div>

        <nav className={styles.sideNav}>
          <a
            href="/dashboard?view=library"
            className={`${styles.sideNavItem} ${pathname === '/dashboard' ? styles.sideNavItemActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>bookmarks</span>
            <span>All Bookmarks</span>
          </a>
          <a
            href="/dashboard/queue"
            className={`${styles.sideNavItem} ${isActive('/dashboard/queue') ? styles.sideNavItemActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>schedule</span>
            <span>Revisit Queue</span>
          </a>
          <a
            href="/dashboard/groups"
            className={`${styles.sideNavItem} ${isActive('/dashboard/groups') ? styles.sideNavItemActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>folder_shared</span>
            <span>Groups</span>
          </a>
          <a
            href="/dashboard/shared"
            className={`${styles.sideNavItem} ${isActive('/dashboard/shared') ? styles.sideNavItemActive : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>ios_share</span>
            <span>Shared</span>
          </a>
          <a href="/upgrade" className={`${styles.sideNavItem} ${styles.sideNavUpgrade}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_awesome</span>
            <span>Upgrade</span>
          </a>
        </nav>

        <div className={styles.sidebarCta}>
          <button className={styles.newBookmarkBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            New Bookmark
          </button>
        </div>
      </aside>

      {/* ── Page content ── */}
      <main className={styles.main}>
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className={styles.mobileNav}>
        <a
          href="/dashboard?view=library"
          className={`${styles.mobileNavItem} ${pathname === '/dashboard' && !isTimeline ? styles.mobileNavItemActive : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: (pathname === '/dashboard' && !isTimeline) ? "'FILL' 1" : "'FILL' 0" }}>bookmarks</span>
          <span className={styles.mobileNavLabel}>Bookmarks</span>
        </a>
        <a
          href="/dashboard?view=timeline"
          className={`${styles.mobileNavItem} ${isTimeline ? styles.mobileNavItemActive : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>history</span>
          <span className={styles.mobileNavLabel}>Timeline</span>
        </a>
        <a
          href="/dashboard/groups"
          className={`${styles.mobileNavItem} ${isActive('/dashboard/groups') ? styles.mobileNavItemActive : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>folder</span>
          <span className={styles.mobileNavLabel}>Groups</span>
        </a>
        <a href="/upgrade" className={styles.mobileNavItem}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>grade</span>
          <span className={styles.mobileNavLabel}>Pro</span>
        </a>
      </nav>

    </div>
  );
}
