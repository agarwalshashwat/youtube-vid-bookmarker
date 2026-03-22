import React, { useState, useEffect } from 'react';
import {
  getCurrentTab,
  extractVideoId,
  waitForContentScript,
  sendMessageToTab,
  formatTimestamp,
  createClipmark,
} from '@clipmark/core';

interface Props {
  videoId: string | null;
  currentTime: number;
  videoTitle: string | null;
  onSaved: () => void;
  onError: (msg: string) => void;
}

const QUICK_TAGS = ['important', 'note', 'review', 'idea'] as const;

export default function SaveMoment({ videoId, currentTime, videoTitle, onSaved, onError }: Props) {
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [liveTime, setLiveTime] = useState(currentTime);

  useEffect(() => { setLiveTime(currentTime); }, [currentTime]);

  const handleQuickTag = (tag: string) => {
    const already = new RegExp(`#${tag}\\b`).test(description);
    if (!already) {
      setDescription(prev => prev.trim() ? `${prev.trim()} #${tag}` : `#${tag}`);
    }
  };

  const handleAutoFill = async () => {
    try {
      const tab = await getCurrentTab();
      if (!tab?.id) return;
      await waitForContentScript(tab.id);
      const resp = await sendMessageToTab(tab.id, { action: 'getTranscriptAtTimestamp', timestamp: liveTime }) as { text?: string } | null;
      if (resp?.text) setDescription(resp.text);
    } catch (e) {
      onError('Auto-fill failed: ' + (e as Error).message);
    }
  };

  const handleSave = async () => {
    if (!videoId) { onError('Please navigate to a YouTube video first!'); return; }
    setSaving(true);
    try {
      const tab = await getCurrentTab();
      if (!tab?.url?.includes('youtube.com/watch')) throw new Error('Please navigate to a YouTube video first!');

      await waitForContentScript(tab.id!);
      const resp = await sendMessageToTab(tab.id!, { action: 'getTimestamp' }) as { timestamp?: number; duration?: number } | null;
      if (resp?.timestamp == null) throw new Error('Could not get current video timestamp');

      const result = await createClipmark({
        videoId,
        timestamp: resp.timestamp,
        description,
        duration: resp.duration || 0,
      });

      if (!result.ok) { onError(result.error); return; }

      setDescription('');
      onSaved();

      try { await sendMessageToTab(tab.id!, { action: 'bookmarkUpdated' }); } catch {}
    } catch (e) {
      onError('Failed to save: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="sp-section sp-capture-section">
      <div className="sp-capture-card">
        <div className="video-context">
          <div className="video-context-title" id="video-title">
            🎬 <span>{videoTitle || <span className="title-shimmer" />}</span>
          </div>
          <div className="timestamp-pill">⏱ {formatTimestamp(liveTime)}</div>
        </div>

        <div className="description-row">
          <input
            type="text"
            className="sp-input"
            placeholder="Add a note…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          />
          <button className="auto-fill-btn-sp" title="Auto-fill from transcript" onClick={handleAutoFill}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '14px', verticalAlign: 'middle' }}>auto_awesome</span>
          </button>
        </div>

        <div className="quick-tags">
          {QUICK_TAGS.map(tag => (
            <button key={tag} className="quick-tag-btn" onClick={() => handleQuickTag(tag)}>
              #{tag}
            </button>
          ))}
        </div>

        <button className="sp-btn-primary" onClick={handleSave} disabled={saving} title="Save bookmark (Alt+S)">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '18px', verticalAlign: 'middle' }}>add_circle</span>
          {saving ? 'Saving…' : 'Save Moment'}
        </button>
      </div>
    </section>
  );
}
