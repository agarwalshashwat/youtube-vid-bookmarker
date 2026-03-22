import React, { useState } from 'react';
import type { Clipmark } from '@clipmark/types';
import { getVideoTitles, API_BASE } from '@clipmark/core';

interface Props {
  videoId: string | null;
  bookmarks: Clipmark[];
  onClose: () => void;
  onError: (msg: string) => void;
}

interface SummaryData {
  summary: string;
  topics?: string[];
  actionItems?: string[];
}

export default function AISummaryPanel({ videoId, bookmarks, onClose, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SummaryData | null>(null);

  const load = async () => {
    if (!videoId) { onError('Navigate to a YouTube video first'); return; }
    if (bookmarks.length === 0) { onError('Add some clipmarks first'); return; }
    setLoading(true);
    try {
      const titles = await getVideoTitles();
      const resp = await fetch(`${API_BASE}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarks, videoTitle: titles[videoId] || '' }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error || 'Server error');
      }
      setData(await resp.json());
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on first open
  React.useEffect(() => { load(); }, []);

  return (
    <div id="summary-panel" className="summary-panel-overlay">
      <div className="summary-panel-content">
        <div className="summary-header">
          <span className="summary-title">✦ Summary</span>
          <button className="overlay-close" title="Close" onClick={onClose}>&times;</button>
        </div>
        <div id="summary-content" className="summary-body">
          {loading && <p>Generating summary…</p>}
          {!loading && data && (
            <>
              <p className="summary-text">{data.summary}</p>
              {data.topics && data.topics.length > 0 && (
                <div className="summary-section">
                  <strong>Topics</strong>
                  <ul>{data.topics.map((t, i) => <li key={i}>{t}</li>)}</ul>
                </div>
              )}
              {data.actionItems && data.actionItems.length > 0 && (
                <div className="summary-section">
                  <strong>Action items</strong>
                  <ul>{data.actionItems.map((a, i) => <li key={i}>{a}</li>)}</ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
