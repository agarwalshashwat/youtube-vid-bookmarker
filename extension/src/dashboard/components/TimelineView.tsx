import React from 'react';
import type { Clipmark } from '@clipmark/types';
import { formatTimestamp, getTagColor, relativeTime, deleteClipmark } from '@clipmark/core';

interface Props {
  bookmarks: Clipmark[];
  onReload: () => void;
}

export default function TimelineView({ bookmarks, onReload }: Props) {
  if (bookmarks.length === 0) {
    return <div className="bm-empty-state"><p>No clipmarks found.</p></div>;
  }

  const sorted = [...bookmarks].sort((a, b) => b.id - a.id);

  return (
    <div className="bm-timeline">
      {sorted.map(b => (
        <div key={b.id} className="bm-timeline-item">
          <div className="bm-timeline-dot" style={{ background: b.color || '#4da1ee' }} />
          <div className="bm-timeline-content">
            <div className="bm-timeline-meta">
              <span className="bm-timeline-video">
                <a href={`https://youtube.com/watch?v=${b.videoId}&t=${Math.floor(b.timestamp)}`} target="_blank" rel="noopener">
                  {b.videoTitle || b.videoId}
                </a>
              </span>
              <span className="bm-timeline-time">{formatTimestamp(b.timestamp)}</span>
              <span className="bm-timeline-age">{relativeTime(b.id)}</span>
            </div>
            <p className="bm-timeline-desc">{b.description}</p>
            {b.tags?.length > 0 && (
              <div className="bm-card-tags">
                {b.tags.map(tag => (
                  <span key={tag} className="tag-badge" style={{ background: getTagColor([tag]), opacity: 0.8, color: 'white' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
          <button className="icon-btn icon-btn--delete" title="Delete" onClick={async () => { await deleteClipmark(b.videoId, b.id); onReload(); }}>&times;</button>
        </div>
      ))}
    </div>
  );
}
