import React, { useEffect, useState } from 'react';
import type { Clipmark } from '@clipmark/types';
import { computeStats, type AnalyticsStats } from '@clipmark/core';

interface Props {
  allBookmarks: Clipmark[];
}

export default function AnalyticsView({ allBookmarks }: Props) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);

  useEffect(() => {
    computeStats().then(setStats);
  }, [allBookmarks]);

  const tagFreq: Record<string, number> = {};
  allBookmarks.forEach(b => (b.tags || []).forEach(t => { tagFreq[t] = (tagFreq[t] || 0) + 1; }));
  const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const uniqueVideos = new Set(allBookmarks.map(b => b.videoId)).size;

  return (
    <div className="bm-analytics">
      <div className="analytics-stat-grid">
        <div className="analytics-stat-card">
          <span className="analytics-stat-value">{allBookmarks.length}</span>
          <span className="analytics-stat-label">Total Clipmarks</span>
        </div>
        <div className="analytics-stat-card">
          <span className="analytics-stat-value">{uniqueVideos}</span>
          <span className="analytics-stat-label">Videos</span>
        </div>
        {stats && (
          <>
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">{stats.totalRevisited}</span>
              <span className="analytics-stat-label">Revisited</span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">{stats.totalDeleted}</span>
              <span className="analytics-stat-label">Deleted</span>
            </div>
          </>
        )}
      </div>

      {topTags.length > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-section-title">Top Tags</h3>
          <div className="analytics-tag-list">
            {topTags.map(([tag, count]) => (
              <div key={tag} className="analytics-tag-row">
                <span className="analytics-tag-name">#{tag}</span>
                <div className="analytics-tag-bar-wrap">
                  <div
                    className="analytics-tag-bar"
                    style={{ width: `${(count / topTags[0][1]) * 100}%` }}
                  />
                </div>
                <span className="analytics-tag-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && Object.keys(stats.createdByDay).length > 0 && (
        <div className="analytics-section">
          <h3 className="analytics-section-title">Activity (last 30 days)</h3>
          <div className="analytics-activity">
            {Object.entries(stats.createdByDay)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .slice(-30)
              .map(([day, count]) => (
                <div key={day} className="analytics-day-col" title={`${day}: ${count}`}>
                  <div className="analytics-day-bar" style={{ height: `${Math.min(count * 20, 100)}px` }} />
                  <span className="analytics-day-label">{day.slice(5)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
