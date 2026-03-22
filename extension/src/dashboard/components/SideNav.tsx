import React from 'react';
import type { Clipmark, ViewMode } from '@clipmark/types';

interface Props {
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  allBookmarks: Clipmark[];
}

const revisitDue = (bookmarks: Clipmark[]) => {
  const now = Date.now();
  return bookmarks.filter(b => {
    if (!b.reviewSchedule?.length) return false;
    const lastMs = b.lastReviewed ? new Date(b.lastReviewed).getTime() : new Date(b.createdAt).getTime();
    const daysSince = (now - lastMs) / 86400000;
    const nextInterval = b.reviewSchedule[0] || 1;
    return daysSince >= nextInterval;
  }).length;
};

function NavLink({ label, icon, active, onClick, badge }: { label: string; icon: string; active: boolean; onClick: () => void; badge?: number }) {
  return (
    <button className={`subnav-link side-nav-link${active ? ' subnav-link--active' : ''}`} onClick={onClick}>
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
      {badge != null && badge > 0 && <span className="subnav-badge side-nav-badge">{badge}</span>}
    </button>
  );
}

export default function SideNav({ viewMode, onViewModeChange, allBookmarks }: Props) {
  const dueCount = revisitDue(allBookmarks);

  return (
    <>
      <div className="side-nav-header">
        <div className="side-nav-curator-icon">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <div>
          <h3 className="side-nav-title">The Curator</h3>
          <p className="side-nav-subtitle">Editorial Collection</p>
        </div>
      </div>
      <nav className="side-nav-items">
        <p className="side-nav-section-label">Library</p>
        <NavLink label="All Clipmarks" icon="bookmarks"      active={viewMode === 'cards'}   onClick={() => onViewModeChange('cards')} />
        <NavLink label="Videos"        icon="video_library"  active={viewMode === 'videos'}  onClick={() => onViewModeChange('videos')} />
        <NavLink label="Revisit Queue" icon="schedule"       active={viewMode === 'revisit'} onClick={() => onViewModeChange('revisit')} badge={dueCount} />
        <p className="side-nav-section-label">Curations</p>
        <NavLink label="Groups"        icon="folder_shared"  active={viewMode === 'groups'}  onClick={() => onViewModeChange('groups')} />
        <NavLink label="Timeline"      icon="view_timeline"  active={viewMode === 'timeline'} onClick={() => onViewModeChange('timeline')} />
        <NavLink label="Analytics"     icon="bar_chart"      active={viewMode === 'analytics'} onClick={() => onViewModeChange('analytics')} />
        <p className="side-nav-section-label">Account</p>
        <a className="subnav-link side-nav-link side-nav-upgrade" href="https://clipmark-chi.vercel.app/upgrade" target="_blank" rel="noopener">
          <span className="material-symbols-outlined">workspace_premium</span>
          <span>Upgrade to Pro</span>
        </a>
      </nav>
    </>
  );
}
