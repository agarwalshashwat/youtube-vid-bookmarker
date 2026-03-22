import React, { useState } from 'react';
import type { Clipmark } from '@clipmark/types';
import {
  formatTimestamp,
  getTagColor,
  getVideoClipmarks,
  saveVideoClipmarks,
  parseTags,
  getCurrentTab,
  waitForContentScript,
  sendMessageToTab,
  deleteClipmark as coreDeleteClipmark,
} from '@clipmark/core';

interface Props {
  bookmarks: Clipmark[];
  videoId: string | null;
  onReload: () => void;
  onError: (msg: string) => void;
  onStatus: (msg: string) => void;
}

function BookmarkItem({
  bookmark,
  videoId,
  onReload,
  onError,
  onStatus,
}: {
  bookmark: Clipmark;
  videoId: string;
  onReload: () => void;
  onError: (msg: string) => void;
  onStatus: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleClick = async () => {
    try {
      const tab = await getCurrentTab();
      await waitForContentScript(tab.id!);
      await sendMessageToTab(tab.id!, { action: 'setTimestamp', timestamp: bookmark.timestamp });
    } catch (e) {
      onError('Failed to seek: ' + (e as Error).message);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(bookmark.timestamp)}`;
    await navigator.clipboard.writeText(url);
    onStatus('Link copied!');
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await coreDeleteClipmark(videoId, bookmark.id);
      const tab = await getCurrentTab();
      try { await sendMessageToTab(tab.id!, { action: 'bookmarkUpdated' }); } catch {}
      onReload();
    } catch (e) {
      onError('Failed to delete: ' + (e as Error).message);
    }
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isAuto = !bookmark.description || bookmark.description.startsWith('Clipmark at');
    setEditValue(isAuto ? '' : bookmark.description);
    setEditing(true);
  };

  const saveEdit = async () => {
    const val = editValue.trim() || `Clipmark at ${formatTimestamp(bookmark.timestamp)}`;
    try {
      const bms = await getVideoClipmarks(videoId);
      const updated = bms.map(b => {
        if (b.id !== bookmark.id) return b;
        const tags = parseTags(val);
        return { ...b, description: val, tags, color: getTagColor(tags) };
      });
      await saveVideoClipmarks(videoId, updated);
      setEditing(false);
      onReload();
    } catch (e) {
      onError('Failed to update: ' + (e as Error).message);
    }
  };

  return (
    <div
      className="bookmark"
      style={{ borderLeftColor: bookmark.color || '#4da1ee' }}
      onClick={handleClick}
    >
      <div className="bookmark-content">
        <span className="bookmark-time" style={{ color: bookmark.color || '#4da1ee' }}>
          {formatTimestamp(bookmark.timestamp)}
        </span>
        {editing ? (
          <input
            className="sp-input"
            autoFocus
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
              if (e.key === 'Escape') setEditing(false);
            }}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="bookmark-desc" onClick={startEdit}>
            {bookmark.description || 'No description'}
          </span>
        )}
        {bookmark.tags?.length > 0 && (
          <div className="bookmark-tags">
            {bookmark.tags.map(tag => (
              <span
                key={tag}
                className="tag-badge"
                style={{ background: getTagColor([tag]), opacity: 0.8, color: 'white' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <button className="copy-link" aria-label="Copy link" title="Copy link" onClick={handleCopyLink}>⎘</button>
      <button className="delete-bookmark" aria-label="Delete bookmark" title="Delete" onClick={handleDelete}>&times;</button>
    </div>
  );
}

export default function BookmarkList({ bookmarks, videoId, onReload, onError, onStatus }: Props) {
  if (!videoId) {
    return (
      <div className="no-bookmarks">
        Navigate to a YouTube video to see bookmarks.
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="no-bookmarks">
        No bookmarks yet.<br />
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>
          Save important moments to see them here.
        </span>
      </div>
    );
  }

  return (
    <div id="bookmark-list" className="sp-bookmark-list">
      {bookmarks.map(b => (
        <BookmarkItem
          key={b.id}
          bookmark={b}
          videoId={videoId}
          onReload={onReload}
          onError={onError}
          onStatus={onStatus}
        />
      ))}
    </div>
  );
}
