import React, { useState } from 'react';
import type { Clipmark } from '@clipmark/types';
import { getVideoTitles, API_BASE } from '@clipmark/core';

interface Props {
  videoId: string | null;
  bookmarks: Clipmark[];
  onClose: () => void;
  onError: (msg: string) => void;
}

type Platform = 'twitter' | 'linkedin' | 'threads';

const COMPOSE_URLS: Record<Platform, (text: string) => string> = {
  twitter:  text => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
  linkedin: text => `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`,
  threads:  text => `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`,
};

export default function SocialPostPanel({ videoId, bookmarks, onClose, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [post, setPost] = useState('');
  const [shareUrl] = useState('');

  const generate = async (p: Platform) => {
    if (!videoId) { onError('Navigate to a YouTube video first'); return; }
    if (bookmarks.length === 0) { onError('No clipmarks to share'); return; }
    setPlatform(p);
    setLoading(true);
    setPost('');
    try {
      const titles = await getVideoTitles();
      const resp = await fetch(`${API_BASE}/api/generate-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarks, videoTitle: titles[videoId] || '', shareUrl, platform: p }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error || 'Server error');
      }
      const data = await resp.json() as { post: string };
      setPost(data.post);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="social-panel" className="social-panel-overlay">
      <div className="social-panel-content">
        <div className="social-header">
          <span className="social-title">✍ Post Insights</span>
          <button className="overlay-close" title="Close" onClick={onClose}>&times;</button>
        </div>
        <div className="social-platform-row">
          {(['twitter', 'linkedin', 'threads'] as Platform[]).map(p => (
            <button
              key={p}
              className={`social-platform-btn${platform === p ? ' active' : ''}`}
              onClick={() => generate(p)}
              disabled={loading}
            >
              {p === 'twitter' ? '𝕏 Twitter' : p === 'linkedin' ? 'in LinkedIn' : '@ Threads'}
            </button>
          ))}
        </div>
        {post && (
          <div className="social-output">
            <textarea className="social-post-textarea" readOnly value={post} />
            <div className="social-action-row">
              <button className="sp-btn-mini" onClick={() => navigator.clipboard.writeText(post)}>Copy</button>
              {platform && (
                <a
                  className="sp-btn-mini sp-link"
                  href={COMPOSE_URLS[platform](post)}
                  target="_blank"
                  rel="noopener"
                >
                  Open {platform.charAt(0).toUpperCase() + platform.slice(1)} ↗
                </a>
              )}
            </div>
          </div>
        )}
        {loading && <p style={{ textAlign: 'center', padding: '16px' }}>Generating…</p>}
      </div>
    </div>
  );
}
