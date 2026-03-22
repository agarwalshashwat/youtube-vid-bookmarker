import React, { useState } from 'react';
import type { Clipmark, Density } from '@clipmark/types';
import {
  formatTimestamp,
  getTagColor,
  getVideoClipmarks,
  saveVideoClipmarks,
  parseTags,
  deleteClipmark,
} from '@clipmark/core';

interface Props {
  bookmarks: Clipmark[];
  density: Density;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onReload: () => void;
  onFilterVideo?: (videoId: string | null) => void;
  groupByVideo?: boolean;
}

function ClimarkCard({
  clipmark,
  selected,
  onToggleSelect,
  onReload,
}: {
  clipmark: Clipmark;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onReload: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteClipmark(clipmark.videoId, clipmark.id);
    onReload();
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(clipmark.description?.startsWith('Clipmark at') ? '' : clipmark.description || '');
    setEditing(true);
  };

  const saveEdit = async () => {
    const val = editValue.trim() || `Clipmark at ${formatTimestamp(clipmark.timestamp)}`;
    const bms = await getVideoClipmarks(clipmark.videoId);
    const updated = bms.map(b => {
      if (b.id !== clipmark.id) return b;
      const tags = parseTags(val);
      return { ...b, description: val, tags, color: getTagColor(tags) };
    });
    await saveVideoClipmarks(clipmark.videoId, updated);
    setEditing(false);
    onReload();
  };

  const jumpTo = () => {
    chrome.tabs.create({
      url: `https://www.youtube.com/watch?v=${clipmark.videoId}&t=${Math.floor(clipmark.timestamp)}`,
    });
  };

  const copyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(
      `https://www.youtube.com/watch?v=${clipmark.videoId}&t=${Math.floor(clipmark.timestamp)}`
    );
  };

  return (
    <div
      className={`bm-card${selected ? ' bm-card--selected' : ''}`}
      style={{ borderLeftColor: clipmark.color || '#4da1ee' }}
      onClick={jumpTo}
    >
      <div className="bm-card-select" onClick={e => { e.stopPropagation(); onToggleSelect(clipmark.id); }}>
        <input type="checkbox" checked={selected} onChange={() => {}} />
      </div>
      <div className="bm-card-body">
        <span className="bm-card-time" style={{ color: clipmark.color || '#4da1ee' }}>
          {formatTimestamp(clipmark.timestamp)}
        </span>
        {editing ? (
          <input
            className="sp-input bm-card-edit"
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false); }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="bm-card-desc" onClick={startEdit}>
            {clipmark.description || 'No description'}
          </span>
        )}
        {clipmark.tags?.length > 0 && (
          <div className="bm-card-tags">
            {clipmark.tags.map(tag => (
              <span key={tag} className="tag-badge" style={{ background: getTagColor([tag]), opacity: 0.8, color: 'white' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="bm-card-actions">
        <button className="icon-btn" title="Copy link" onClick={copyLink}>⎘</button>
        <button className="icon-btn icon-btn--delete" title="Delete" onClick={handleDelete}>&times;</button>
      </div>
    </div>
  );
}

function VideoGroup({ videoId, clipmarks, selectedIds, onToggleSelect, onReload }: {
  videoId: string;
  clipmarks: Clipmark[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onReload: () => void;
  onFilterVideo?: (id: string | null) => void;
}) {
  const title = clipmarks[0]?.videoTitle || videoId;
  return (
    <div className="bm-video-group">
      <div className="bm-video-group-header">
        <a
          href={`https://youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener"
          className="bm-video-title-link"
          onClick={e => e.stopPropagation()}
        >
          {title}
        </a>
        <span className="bm-video-count">{clipmarks.length} clipmark{clipmarks.length !== 1 ? 's' : ''}</span>
      </div>
      {clipmarks.map(b => (
        <ClimarkCard key={b.id} clipmark={b} selected={selectedIds.has(b.id)} onToggleSelect={onToggleSelect} onReload={onReload} />
      ))}
    </div>
  );
}

export default function CardsView({ bookmarks, density, selectedIds, onToggleSelect, onReload, onFilterVideo, groupByVideo }: Props) {
  if (bookmarks.length === 0) {
    return (
      <div className="bm-empty-state">
        <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>bookmark_border</span>
        <p>No clipmarks found.</p>
      </div>
    );
  }

  if (groupByVideo) {
    const grouped: Record<string, Clipmark[]> = {};
    bookmarks.forEach(b => {
      if (!grouped[b.videoId]) grouped[b.videoId] = [];
      grouped[b.videoId].push(b);
    });
    return (
      <div className={`bm-list bm-list--${density}`}>
        {Object.entries(grouped).map(([videoId, bms]) => (
          <VideoGroup
            key={videoId}
            videoId={videoId}
            clipmarks={bms}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            onReload={onReload}
            onFilterVideo={onFilterVideo}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`bm-list bm-list--${density}`}>
      {bookmarks.map(b => (
        <ClimarkCard key={b.id} clipmark={b} selected={selectedIds.has(b.id)} onToggleSelect={onToggleSelect} onReload={onReload} />
      ))}
    </div>
  );
}
