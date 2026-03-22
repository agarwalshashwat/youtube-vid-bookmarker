import React, { useRef } from 'react';
import type { Clipmark, ViewMode } from '@clipmark/types';
import { analytics, getAllClipmarks, saveVideoClipmarks } from '@clipmark/core';

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  filterQuery: string;
  onFilterChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  allBookmarks: Clipmark[];
  onReload: () => void;
}

export default function DashboardHeader({ theme, onToggleTheme, filterQuery, onFilterChange, allBookmarks, onReload }: Props) {
  const importRef = useRef<HTMLInputElement>(null);

  const exportJSON = () => {
    const json = JSON.stringify(allBookmarks, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'clipmark-bookmarks.json'; a.click();
    URL.revokeObjectURL(url);
    analytics.exported();
  };

  const exportCSV = () => {
    const rows = [
      ['id', 'videoId', 'videoTitle', 'timestamp', 'description', 'tags', 'createdAt'],
      ...allBookmarks.map(b => [
        b.id, b.videoId, b.videoTitle || '', b.timestamp,
        b.description, (b.tags || []).join(';'), b.createdAt,
      ]),
    ];
    const csv = rows.map(r => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'clipmark-bookmarks.csv'; a.click();
    URL.revokeObjectURL(url);
    analytics.exported();
  };

  const exportMD = () => {
    const lines = allBookmarks.map(b =>
      `- **[${b.videoTitle || b.videoId}](https://youtube.com/watch?v=${b.videoId}&t=${Math.floor(b.timestamp)})** @ \`${Math.floor(b.timestamp / 60)}:${String(Math.floor(b.timestamp % 60)).padStart(2, '0')}\` — ${b.description}${b.tags?.length ? ` _(${b.tags.map(t => `#${t}`).join(' ')})_` : ''}`
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'clipmark-bookmarks.md'; a.click();
    URL.revokeObjectURL(url);
    analytics.exported();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const imported: Clipmark[] = JSON.parse(ev.target?.result as string);
          const existing = await getAllClipmarks();
        const existingIds = new Set(existing.map(b => b.id));
        const newBms = imported.filter(b => !existingIds.has(b.id));

        const byVideo: Record<string, Clipmark[]> = {};
        newBms.forEach(b => {
          if (!byVideo[b.videoId]) byVideo[b.videoId] = [];
          byVideo[b.videoId].push(b);
        });

        for (const [videoId, bms] of Object.entries(byVideo)) {
          const cur = existing.filter(b => b.videoId === videoId);
          await saveVideoClipmarks(videoId, [...cur, ...bms]);
        }

        onReload();
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="page-header">
      <div className="page-header-left">
        <div className="page-logo">
          <img src="../../assets/icons/icon-48.png" className="page-logo-icon" alt="Clipmark" />
          <span className="page-title">Clipmark</span>
        </div>
        <nav className="page-header-nav">
          <button className="subnav-link subnav-link--active" id="subnav-all">All Bookmarks</button>
          <a className="subnav-link" href="https://clipmark-chi.vercel.app" target="_blank" rel="noopener">Shared ↗</a>
        </nav>
      </div>
      <div className="page-header-right">
        <div className="header-search-wrap">
          <span className="material-symbols-outlined header-search-icon">search</span>
          <input
            type="text"
            className="toolbar-search header-search-input"
            placeholder="Search your stream..."
            value={filterQuery}
            onChange={e => onFilterChange(e.target.value)}
          />
        </div>
        <button className="theme-toggle" title="Toggle light/dark theme" onClick={onToggleTheme}>
          <span className="theme-icon material-symbols-outlined">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
        </button>
        <div className="export-menu-wrap">
          <button className="sp-icon-btn" title="Export" onClick={exportJSON} style={{ fontSize: '12px', padding: '6px 10px' }}>
            Export ▾
          </button>
          <div className="export-dropdown">
            <button onClick={exportJSON}>JSON</button>
            <button onClick={exportCSV}>CSV</button>
            <button onClick={exportMD}>Markdown</button>
            <button onClick={() => importRef.current?.click()}>Import JSON</button>
          </div>
        </div>
        <a href="https://clipmark-chi.vercel.app/upgrade" target="_blank" className="dashboard-upgrade-btn">✦ Upgrade</a>
        <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      </div>
    </header>
  );
}
