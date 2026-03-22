import React from 'react';

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Header({ theme, onToggleTheme }: Props) {
  return (
    <header className="side-panel-header">
      <div className="side-panel-logo">
        <img src="../../assets/icons/icon-48.png" className="sp-logo-sym" alt="Clipmark" />
        <span className="sp-logo-text">Clipmark</span>
      </div>
      <div className="side-panel-header-actions">
        <button className="sp-icon-btn" title="Help">
          <span className="material-symbols-outlined">help</span>
        </button>
        <button className="theme-toggle" title="Toggle light/dark theme" onClick={onToggleTheme}>
          <span className="theme-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
        </button>
      </div>
    </header>
  );
}
