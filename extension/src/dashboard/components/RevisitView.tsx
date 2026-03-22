import React from 'react';
import type { Clipmark } from '@clipmark/types';
import { formatTimestamp, getTagColor, markClipmarkRevisited } from '@clipmark/core';

interface Props {
  allBookmarks: Clipmark[];
  onReload: () => void;
}

function isDue(b: Clipmark): boolean {
  if (!b.reviewSchedule?.length) return false;
  const lastMs = b.lastReviewed
    ? new Date(b.lastReviewed).getTime()
    : new Date(b.createdAt).getTime();
  const daysSince = (Date.now() - lastMs) / 86400000;
  return daysSince >= (b.reviewSchedule[0] || 1);
}

export default function RevisitView({ allBookmarks, onReload }: Props) {
  const due = allBookmarks.filter(isDue);

  if (due.length === 0) {
    return (
      <div className="bm-empty-state">
        <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>task_alt</span>
        <p>All caught up! No clipmarks due for review.</p>
      </div>
    );
  }

  return (
    <div className="bm-revisit-list">
      <p className="bm-revisit-header">{due.length} clipmark{due.length !== 1 ? 's' : ''} due for review</p>
      {due.map(b => (
        <div key={b.id} className="bm-revisit-item" style={{ borderLeftColor: b.color || '#4da1ee' }}>
          <div className="bm-revisit-body">
            <span className="bm-revisit-video">{b.videoTitle || b.videoId}</span>
            <span className="bm-revisit-time" style={{ color: b.color || '#4da1ee' }}>
              {formatTimestamp(b.timestamp)}
            </span>
            <span className="bm-revisit-desc">{b.description}</span>
            {b.tags?.length > 0 && (
              <div className="bm-card-tags">
                {b.tags.map(tag => (
                  <span key={tag} className="tag-badge" style={{ background: getTagColor([tag]), opacity: 0.8, color: 'white' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="bm-revisit-actions">
            <a
              className="sp-btn-mini"
              href={`https://youtube.com/watch?v=${b.videoId}&t=${Math.floor(b.timestamp)}`}
              target="_blank"
              rel="noopener"
            >
              Watch
            </a>
            <button
              className="sp-btn-mini"
              onClick={async () => {
                await markClipmarkRevisited(b.videoId, b.id, b.timestamp);
                onReload();
              }}
            >
              Mark reviewed
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
