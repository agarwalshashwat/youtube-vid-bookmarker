import React, { useEffect, useState } from 'react';
import { useDashboard } from './useDashboard';
import FilterBar from './components/FilterBar';
import StatsBar from './components/StatsBar';
import CardsView from './components/CardsView';
import TimelineView from './components/TimelineView';
import GroupsView from './components/GroupsView';
import AnalyticsView from './components/AnalyticsView';
import RevisitView from './components/RevisitView';
import SideNav from './components/SideNav';
import DashboardHeader from './components/DashboardHeader';
import type { ViewMode } from '@clipmark/types';
import { deleteClipmark } from '@clipmark/core';

export default function App() {
  const dashboard = useDashboard();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    chrome.storage.local.get(['theme'], result => {
      const t = (result.theme || 'light') as 'light' | 'dark';
      setTheme(t);
      document.documentElement.setAttribute('data-theme', t);
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    chrome.storage.local.set({ theme: next });
  };

  const { filteredBookmarks, allBookmarks, viewMode, density, selectedIds, loading } = dashboard;

  const renderView = () => {
    if (loading) return <div className="loading-state">Loading clipmarks…</div>;

    switch (viewMode as ViewMode) {
      case 'cards':     return <CardsView bookmarks={filteredBookmarks} density={density} selectedIds={selectedIds} onToggleSelect={dashboard.toggleSelect} onReload={dashboard.reload} onFilterVideo={dashboard.setFilterVideoId} />;
      case 'timeline':  return <TimelineView bookmarks={filteredBookmarks} onReload={dashboard.reload} />;
      case 'groups':    return <GroupsView bookmarks={filteredBookmarks} onReload={dashboard.reload} />;
      case 'analytics': return <AnalyticsView allBookmarks={allBookmarks} />;
      case 'revisit':   return <RevisitView allBookmarks={allBookmarks} onReload={dashboard.reload} />;
      case 'videos':    return <CardsView bookmarks={filteredBookmarks} density={density} selectedIds={selectedIds} onToggleSelect={dashboard.toggleSelect} onReload={dashboard.reload} onFilterVideo={dashboard.setFilterVideoId} groupByVideo />;
      default:          return <CardsView bookmarks={filteredBookmarks} density={density} selectedIds={selectedIds} onToggleSelect={dashboard.toggleSelect} onReload={dashboard.reload} onFilterVideo={dashboard.setFilterVideoId} />;
    }
  };

  return (
    <>
      <DashboardHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        filterQuery={dashboard.filterQuery}
        onFilterChange={dashboard.setFilterQuery}
        viewMode={viewMode}
        onViewModeChange={dashboard.setViewMode}
        allBookmarks={allBookmarks}
        onReload={dashboard.reload}
      />

      <aside className="bm-side-nav">
        <SideNav
          viewMode={viewMode}
          onViewModeChange={dashboard.setViewMode}
          allBookmarks={allBookmarks}
        />
      </aside>

      <div className="bm-main">
        <FilterBar dashboard={dashboard} />
        <StatsBar bookmarks={allBookmarks} />

        {selectedIds.size > 0 && (
          <div className="bulk-actions-bar">
            <span>{selectedIds.size} selected</span>
            <button
              className="bulk-delete-btn"
              onClick={async () => {
                for (const id of selectedIds) {
                  const bm = allBookmarks.find(b => b.id === id);
                  if (bm) await deleteClipmark(bm.videoId, bm.id);
                }
                dashboard.clearSelection();
                dashboard.reload();
              }}
            >
              Delete selected
            </button>
            <button className="sp-btn-mini" onClick={dashboard.clearSelection}>Cancel</button>
          </div>
        )}

        {renderView()}
      </div>
    </>
  );
}
