import React from 'react';
import type { ActiveTab } from '../App';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="sp-bottom-nav">
      <button
        className={`sp-nav-tab${activeTab === 'save' ? ' sp-nav-tab--active' : ''}`}
        onClick={() => onTabChange('save')}
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
        <span className="sp-nav-label">Save</span>
      </button>
      <button
        className={`sp-nav-tab${activeTab === 'summary' ? ' sp-nav-tab--active' : ''}`}
        onClick={() => onTabChange('summary')}
      >
        <span className="material-symbols-outlined">auto_awesome</span>
        <span className="sp-nav-label">Summary</span>
      </button>
      <button
        className="sp-nav-tab"
        onClick={() => onTabChange('library')}
      >
        <span className="material-symbols-outlined">video_library</span>
        <span className="sp-nav-label">Library</span>
      </button>
    </nav>
  );
}
