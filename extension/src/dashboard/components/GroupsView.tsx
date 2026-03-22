import React, { useState } from 'react';
import type { Clipmark } from '@clipmark/types';
import { formatTimestamp, getTagColor } from '@clipmark/core';

interface Props {
  bookmarks: Clipmark[];
  onReload: () => void;
}

export default function GroupsView({ bookmarks }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (bookmarks.length === 0) {
    return <div className="bm-empty-state"><p>No clipmarks found.</p></div>;
  }

  // Group by tag (or "Untagged")
  const groups: Record<string, Clipmark[]> = { Untagged: [] };
  bookmarks.forEach(b => {
    if (!b.tags?.length) {
      groups['Untagged'].push(b);
    } else {
      b.tags.forEach(tag => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(b);
      });
    }
  });

  if (groups['Untagged'].length === 0) delete groups['Untagged'];

  return (
    <div className="bm-groups">
      {Object.entries(groups).map(([tag, bms]) => {
        const color = tag === 'Untagged' ? '#888' : getTagColor([tag]);
        const isExpanded = expanded[tag] !== false;
        return (
          <div key={tag} className="bm-group">
            <button
              className="bm-group-header"
              onClick={() => setExpanded(prev => ({ ...prev, [tag]: !isExpanded }))}
            >
              <span className="bm-group-dot" style={{ background: color }} />
              <span className="bm-group-name">#{tag}</span>
              <span className="bm-group-count">{bms.length}</span>
              <span className="material-symbols-outlined bm-group-chevron">{isExpanded ? 'expand_less' : 'expand_more'}</span>
            </button>
            {isExpanded && (
              <div className="bm-group-items">
                {bms.map(b => (
                  <a
                    key={b.id}
                    className="bm-group-item"
                    href={`https://youtube.com/watch?v=${b.videoId}&t=${Math.floor(b.timestamp)}`}
                    target="_blank"
                    rel="noopener"
                  >
                    <span className="bm-group-item-time" style={{ color }}>{formatTimestamp(b.timestamp)}</span>
                    <span className="bm-group-item-desc">{b.description}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
