import React from 'react';
import type { Clipmark } from '@clipmark/types';
import { relativeTime } from '@clipmark/core';

interface Props {
  bookmarks: Clipmark[];
}

export default function StatsBar({ bookmarks }: Props) {
  if (bookmarks.length === 0) return null;

  const totalVids = new Set(bookmarks.map(b => b.videoId)).size;
  const totalTags = new Set(bookmarks.flatMap(b => b.tags || [])).size;
  const lastTs    = Math.max(...bookmarks.map(b => b.id));

  return (
    <div id="stats-bar" className="stats-bar">
      <div className="stat-item">
        <span className="stat-value">{bookmarks.length}</span>
        <span className="stat-label">Clipmarks</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{totalVids}</span>
        <span className="stat-label">Videos</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{totalTags}</span>
        <span className="stat-label">Tags</span>
      </div>
      <div className="stat-item">
        <span className="stat-value">{relativeTime(lastTs)}</span>
        <span className="stat-label">Last saved</span>
      </div>
    </div>
  );
}
