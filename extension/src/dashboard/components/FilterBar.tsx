import React from 'react';
import type { DashboardState } from '../useDashboard';
import type { SortOrder, ViewMode, Density } from '@clipmark/types';

interface Props {
  dashboard: DashboardState;
}

const VIEW_MODES: { value: ViewMode; icon: string; label: string }[] = [
  { value: 'cards',     icon: 'grid_view',      label: 'Cards' },
  { value: 'timeline',  icon: 'view_timeline',  label: 'Timeline' },
  { value: 'groups',    icon: 'folder_shared',  label: 'Groups' },
  { value: 'analytics', icon: 'bar_chart',      label: 'Analytics' },
];

const DENSITY_OPTIONS: { value: Density; icon: string }[] = [
  { value: 'compact',     icon: 'density_small' },
  { value: 'default',     icon: 'density_medium' },
  { value: 'comfortable', icon: 'density_large' },
];

export default function FilterBar({ dashboard }: Props) {
  const { filterQuery, setFilterQuery, sortOrder, setSortOrder, viewMode, setViewMode, density, setDensity } = dashboard;

  return (
    <div className="toolbar">
      <div className="toolbar-row toolbar-row-1">
        <div className="toolbar-search-wrap">
          <span className="material-symbols-outlined toolbar-search-icon">search</span>
          <input
            type="text"
            className="toolbar-search"
            placeholder="Filter…"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
          />
        </div>

        <select
          className="sort-select"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as SortOrder)}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="timestamp">By timestamp</option>
        </select>

        <div className="view-toggles">
          {VIEW_MODES.map(m => (
            <button
              key={m.value}
              className={`view-toggle-btn${viewMode === m.value ? ' active' : ''}`}
              title={m.label}
              onClick={() => setViewMode(m.value)}
            >
              <span className="material-symbols-outlined">{m.icon}</span>
            </button>
          ))}
        </div>

        <div className="density-toggles">
          {DENSITY_OPTIONS.map(d => (
            <button
              key={d.value}
              className={`density-btn${density === d.value ? ' active' : ''}`}
              title={d.value}
              onClick={() => setDensity(d.value)}
            >
              <span className="material-symbols-outlined">{d.icon}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
