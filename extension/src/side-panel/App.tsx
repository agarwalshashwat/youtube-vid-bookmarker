import React, { useState, useEffect, useCallback } from 'react';
import type { Clipmark } from '@clipmark/types';
import {
  getCurrentTab,
  extractVideoId,
  getVideoClipmarks,
  getVideoTitles,
  sendMessageToTab,
  waitForContentScript,
  formatTimestamp,
} from '@clipmark/core';
import Header from './components/Header';
import SaveMoment from './components/SaveMoment';
import BookmarkList from './components/BookmarkList';
import AISummaryPanel from './components/AISummaryPanel';
import SocialPostPanel from './components/SocialPostPanel';
import BottomNav from './components/BottomNav';

export type ActiveTab = 'save' | 'summary' | 'library';

export default function App() {
  const [bookmarks, setBookmarks] = useState<Clipmark[]>([]);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('save');
  const [showSummary, setShowSummary] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 1500);
  };

  const loadBookmarks = useCallback(async () => {
    try {
      const tab = await getCurrentTab();
      if (!tab?.url?.includes('youtube.com/watch')) return;

      const vid = extractVideoId(tab.url!);
      if (!vid) return;

      setVideoId(vid);

      const titles = await getVideoTitles();
      setVideoTitle(titles[vid] || null);

      try {
        const resp = await sendMessageToTab(tab.id!, { action: 'getCurrentTime' }) as { currentTime?: number } | null;
        if (resp?.currentTime !== undefined) setCurrentTime(resp.currentTime);
      } catch {}

      await waitForContentScript(tab.id!);
      const bms = (await getVideoClipmarks(vid)).sort((a, b) => a.timestamp - b.timestamp);
      setBookmarks(bms);
    } catch (e) {
      showError('Failed to load clipmarks: ' + (e as Error).message);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // React to chrome.storage changes
  useEffect(() => {
    const listener = () => loadBookmarks();
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [loadBookmarks]);

  // Theme
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

  const openLibrary = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/bookmarks.html') });
  };

  return (
    <div className="side-panel-container">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      {status && <div id="status-message" className="status-message show">{status}</div>}

      <main className="sp-main">
        {activeTab === 'save' && (
          <>
            {/* AI Insights Card */}
            <section className="sp-section">
              <button className="ai-insights-card" onClick={() => setShowSummary(true)}>
                <div className="ai-insights-left">
                  <div className="ai-insights-icon">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <div className="ai-insights-text">
                    <span className="ai-insights-label">AI Insights</span>
                    <span className="ai-insights-title">Summary</span>
                  </div>
                </div>
                <span className="material-symbols-outlined ai-insights-chevron">chevron_right</span>
                <div className="ai-insights-bg" aria-hidden="true"></div>
              </button>
            </section>

            <SaveMoment
              videoId={videoId}
              currentTime={currentTime}
              videoTitle={videoTitle}
              onSaved={() => { showStatus('Clipmark saved ✓'); loadBookmarks(); }}
              onError={showError}
            />

            <section className="sp-section sp-bookmarks-section">
              <div className="sp-bookmarks-header">
                <h2 className="sp-bookmarks-title">Bookmarks</h2>
                <a href="#" className="sp-view-all-link" title="Open full dashboard" onClick={e => { e.preventDefault(); openLibrary(); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle' }}>open_in_new</span>
                  All
                </a>
              </div>
              <BookmarkList
                bookmarks={bookmarks}
                videoId={videoId}
                onReload={loadBookmarks}
                onError={showError}
                onStatus={showStatus}
              />
            </section>

            <section className="sp-section sp-social-section">
              <div className="sp-social-inner">
                <div className="sp-social-info">
                  <p className="sp-social-sup">Share the insight</p>
                  <h3 className="sp-social-title">Post to Social</h3>
                </div>
                <button className="sp-social-cta" onClick={() => setShowSocial(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>ios_share</span>
                  Generate Post
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={tab => {
          if (tab === 'summary') { setShowSummary(true); return; }
          if (tab === 'library') { openLibrary(); return; }
          setActiveTab(tab);
        }}
      />

      {error && <div id="error-message" className="error-message show">{error}</div>}

      {showSummary && (
        <AISummaryPanel
          videoId={videoId}
          bookmarks={bookmarks}
          onClose={() => setShowSummary(false)}
          onError={showError}
        />
      )}

      {showSocial && (
        <SocialPostPanel
          videoId={videoId}
          bookmarks={bookmarks}
          onClose={() => setShowSocial(false)}
          onError={showError}
        />
      )}
    </div>
  );
}
