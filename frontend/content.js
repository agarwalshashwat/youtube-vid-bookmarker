// ─── Debug ────────────────────────────────────────────────────────────────────
function debugLog(category, message, data = null) {
  console.log(`[ContentScript][${category}][${new Date().toISOString()}] ${message}`, data ?? '');
}

debugLog('Init', 'Content script loading');

// ─── State ────────────────────────────────────────────────────────────────────
let video = null;
let progressBar = null;
let isInitialized = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 1000;

let titleSaveTimer = null;
const savedTitlesCache = {}; // avoid redundant sync writes

// ─── Transcript state ─────────────────────────────────────────────────────────
let cachedTranscript       = null; // null = not fetched yet, [] = fetched but empty
let transcriptFetchPromise = null;
let cachedTranscriptVideoId = null;

// ─── Tag colours (must match popup.js) ───────────────────────────────────────
const TAG_COLORS = {
  important: '#ff6b6b',
  review:    '#ffa94d',
  note:      '#74c0fc',
  question:  '#a9e34b',
  todo:      '#da77f2',
  key:       '#f783ac',
};

function parseTags(description) {
  if (!description) return [];
  const matches = description.match(/#(\w+)/g);
  return matches ? matches.map(t => t.slice(1).toLowerCase()) : [];
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 60%, 60%)`;
}

function getTagColor(tags) {
  if (!tags || tags.length === 0) return '#4da1ee';
  return TAG_COLORS[tags[0]] || stringToColor(tags[0]);
}

function bmKey(videoId) { return `bm_${videoId}`; }

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Video observer ───────────────────────────────────────────────────────────
function initializeVideoObserver() {
  debugLog('Observer', 'Setting up video observer');
  const observer = new MutationObserver(() => {
    if (!video) {
      video = document.querySelector('video');
      if (video) {
        debugLog('Video', 'Video element found', { duration: video.duration });
        initializeProgressBar();
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function initializeProgressBar() {
  debugLog('ProgressBar', 'Setting up progress bar observer');
  const observer = new MutationObserver(() => {
    progressBar = document.querySelector('.ytp-progress-bar');
    if (progressBar && !document.querySelector('.yt-bookmark-markers')) {
      debugLog('ProgressBar', 'Progress bar found, setting up markers');
      setupBookmarkMarkers();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function setupBookmarkMarkers() {
  debugLog('Markers', 'Creating markers container');
  const container = document.createElement('div');
  container.className = 'yt-bookmark-markers';
  container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  progressBar.appendChild(container);
  updateBookmarkMarkers();

  // Pre-warm transcript cache now that the player is ready
  fetchTranscript().catch(() => {});

  video.addEventListener('durationchange', () => {
    debugLog('Video', 'Duration changed', { duration: video.duration });
    updateBookmarkMarkers();
  });
}

// ─── Render markers ───────────────────────────────────────────────────────────
function updateBookmarkMarkers() {
  video = document.querySelector('video') || video;
  if (!video || !progressBar) return;

  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) return;

  chrome.storage.sync.get({ [bmKey(videoId)]: [] }, result => {
    const container = document.querySelector('.yt-bookmark-markers');
    if (!container) return;

    container.innerHTML = '';
    const bookmarks = result[bmKey(videoId)];
    debugLog('Markers', 'Rendering markers', { count: bookmarks.length });

    const duration = video.duration;
    bookmarks.forEach(bookmark => {
      const color = bookmark.color || getTagColor(bookmark.tags || []);

      const marker = document.createElement('div');
      marker.className = 'yt-bookmark-marker';
      marker.setAttribute('data-timestamp', bookmark.timestamp);
      marker.setAttribute('data-description',
        `${formatTimestamp(bookmark.timestamp)} — ${bookmark.description || 'No description'}`);

      marker.style.left            = `${(bookmark.timestamp / duration) * 100}%`;
      marker.style.backgroundColor = color;
      marker.style.boxShadow       = `0 0 4px ${color}80`;
      marker.style.pointerEvents   = 'auto';

      marker.addEventListener('click', () => {
        debugLog('Marker', 'Clicked', { timestamp: bookmark.timestamp });
        marker.classList.add('clicked');
        video.currentTime = bookmark.timestamp;
        setTimeout(() => marker.classList.remove('clicked'), 600);
      });

      container.appendChild(marker);
    });
  });
}

// ─── Transcript ───────────────────────────────────────────────────────────────
async function fetchTranscript() {
  const videoId = new URLSearchParams(window.location.search).get('v');

  // Invalidate cache when video changes (YouTube is a SPA)
  if (videoId !== cachedTranscriptVideoId) {
    cachedTranscript       = null;
    transcriptFetchPromise = null;
    cachedTranscriptVideoId = videoId;
  }

  if (cachedTranscript !== null) return cachedTranscript;
  if (transcriptFetchPromise)    return transcriptFetchPromise;

  transcriptFetchPromise = (async () => {
    try {
      const ytData = window.ytInitialPlayerResponse;
      const tracks = ytData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!tracks || tracks.length === 0) {
        debugLog('Transcript', 'No caption tracks available');
        cachedTranscript = [];
        return [];
      }

      // Prefer English auto-generated → English manual → any auto → first track
      const track =
        tracks.find(t => t.languageCode === 'en' && t.kind === 'asr') ||
        tracks.find(t => t.languageCode === 'en') ||
        tracks.find(t => t.kind === 'asr') ||
        tracks[0];

      if (!track?.baseUrl) {
        cachedTranscript = [];
        return [];
      }

      debugLog('Transcript', 'Fetching', { lang: track.languageCode, kind: track.kind });

      const res = await fetch(`${track.baseUrl}&fmt=json3`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // YouTube json3 format: { events: [{ tStartMs, dDurationMs, segs: [{ utf8 }] }] }
      const segments = (data.events || [])
        .filter(e => e.segs && e.segs.length > 0)
        .map(e => ({
          start: e.tStartMs / 1000,
          end:   (e.tStartMs + (e.dDurationMs || 0)) / 1000,
          text:  e.segs.map(s => (s.utf8 || '').replace(/\n/g, ' ')).join('').trim(),
        }))
        .filter(s => s.text && s.text !== '\u200b');

      cachedTranscript = segments;
      debugLog('Transcript', `Loaded ${segments.length} segments`);
      return segments;
    } catch (error) {
      debugLog('Transcript', 'Failed to fetch', { error: error.message });
      cachedTranscript = [];
      return [];
    }
  })();

  return transcriptFetchPromise;
}

// Return cleaned transcript text for a ~5s window around the given timestamp
function getTextAtTimestamp(transcript, timestamp) {
  if (!transcript || transcript.length === 0) return null;

  // 1s before bookmark → 4s after (captures what's being said at that moment)
  const from = timestamp - 1;
  const to   = timestamp + 4;

  let hits = transcript.filter(s => s.start < to && s.end > from);

  if (hits.length === 0) {
    // Fallback: nearest segment by start time
    hits = [transcript.reduce((best, s) =>
      Math.abs(s.start - timestamp) < Math.abs(best.start - timestamp) ? s : best
    )];
  }

  const combined = hits.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim();
  return cleanTranscriptText(combined);
}

function cleanTranscriptText(text) {
  if (!text) return null;
  let t = text.trim();
  // Capitalize first letter
  t = t.charAt(0).toUpperCase() + t.slice(1);
  // Truncate at word boundary to ~120 chars
  if (t.length > 120) {
    t = t.substring(0, 120).replace(/\s+\S*$/, '') + '…';
  }
  return t || null;
}

// ─── Silent save (Alt+S) ──────────────────────────────────────────────────────
async function silentSaveBookmark() {
  video = document.querySelector('video') || video;
  if (!video) { debugLog('Silent', 'No video element'); return; }

  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) { debugLog('Silent', 'No video ID'); return; }

  const timestamp = video.currentTime;
  const tags      = [];
  const color     = '#4da1ee';

  // Try transcript first, fall back to "Bookmark at M:SS"
  const transcript     = await fetchTranscript().catch(() => null);
  const transcriptText = transcript ? getTextAtTimestamp(transcript, timestamp) : null;
  const description    = transcriptText || `Bookmark at ${formatTimestamp(timestamp)}`;

  try {
    const result = await new Promise(resolve =>
      chrome.storage.sync.get({ [bmKey(videoId)]: [], videoTitles: {} }, resolve)
    );
    const bookmarks   = result[bmKey(videoId)];
    const videoTitles = result.videoTitles;

    bookmarks.push({
      id: Date.now(),
      videoId,
      timestamp,
      description,
      tags,
      color,
      createdAt:  new Date().toISOString(),
      videoTitle: videoTitles[videoId] || null,
    });

    await new Promise((resolve, reject) =>
      chrome.storage.sync.set({ [bmKey(videoId)]: bookmarks }, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      })
    );

    updateBookmarkMarkers();
    showSilentSaveIndicator(description);
    debugLog('Silent', 'Saved silent bookmark', { timestamp, description });
  } catch (error) {
    debugLog('Silent', 'Failed', { error: error.message });
  }
}

function showSilentSaveIndicator(message, type = 'success') {
  const el = document.createElement('div');
  el.className = 'yt-bookmark-toast';
  el.textContent = message;
  if (type === 'error') {
    el.style.borderLeftColor = '#ef4444';
  } else {
    el.style.borderLeftColor = '#14B8A6';
  }
  document.body.appendChild(el);
  // Trigger reflow for animation
  el.getClientRects();
  el.classList.add('yt-bookmark-toast--show');
  setTimeout(() => {
    el.classList.remove('yt-bookmark-toast--show');
    setTimeout(() => el.remove(), 400);
  }, 2000);
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────
function handleKeyboardShortcut(event) {
  if (!event.altKey) return;
  if (event.key.toLowerCase() === 'b') {
    chrome.runtime.sendMessage({ action: 'openPopup' });
  }
  if (event.key.toLowerCase() === 's') {
    silentSaveBookmark();
  }
}

// ─── Message listener ─────────────────────────────────────────────────────────
function initializeMessageListener() {
  debugLog('Messaging', 'Setting up message listener');
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debugLog('Messaging', 'Received', { action: request.action });

    const handle = async () => {
      if (request.action === 'ping') {
        sendResponse({ status: 'ready' });
        return;
      }
      if (request.action === 'getCurrentTime') {
        const activeVideo = document.querySelector('video') || video;
        sendResponse({ currentTime: activeVideo ? activeVideo.currentTime : 0 });
        return;
      }
      if (request.action === 'getBookmarkData') {
        const activeVideo = document.querySelector('video') || video;
        const titleEl = document.querySelector('h1.ytd-video-primary-info-renderer');
        sendResponse({ 
          currentTime: activeVideo ? activeVideo.currentTime : 0,
          title: titleEl ? titleEl.textContent.trim() : null
        });
        return;
      }
      if (request.action === 'getTranscriptSnippet') {
        const transcript = await fetchTranscript();
        const snippet = getTextAtTimestamp(transcript, request.timestamp);
        sendResponse({ snippet: snippet || null });
        return;
      }
      if (request.action === 'showToast') {
        showSilentSaveIndicator(request.message, request.type);
        sendResponse({});
        return;
      }
      if (request.action === 'getTimestamp') {
        // Always query fresh — YouTube SPA may replace the video element
        const activeVideo = document.querySelector('video') || video;
        if (!activeVideo) throw new Error('Video element not found');
        video = activeVideo; // keep cache fresh
        sendResponse({ timestamp: activeVideo.currentTime });
        return;
      }
      if (request.action === 'seekTo') {
        const activeVideo = document.querySelector('video') || video;
        if (activeVideo) {
          video = activeVideo;
          activeVideo.currentTime = request.time;
          activeVideo.play().catch(() => {});
        }
        sendResponse({});
        return;
      }
      if (request.action === 'setTimestamp') {
        const activeVideo = document.querySelector('video') || video;
        if (activeVideo) {
          video = activeVideo;
          activeVideo.currentTime = request.timestamp;
          activeVideo.play().catch(() => {});
        }
        sendResponse({});
        return;
      }
      if (request.action === 'bookmarkUpdated') {
        updateBookmarkMarkers();
        sendResponse({});
        return;
      }
      if (request.action === 'getTranscriptAtTimestamp') {
        const transcript = await fetchTranscript();
        const text       = getTextAtTimestamp(transcript, request.timestamp);
        sendResponse({ text: text || null });
        return;
      }
      if (request.action === 'prefetchTranscript') {
        fetchTranscript(); // fire-and-forget to warm the cache
        sendResponse({});
        return;
      }
    };

    handle().catch(error => {
      debugLog('Messaging', 'Error', { error });
      sendResponse({ error: error.message });
    });

    return true; // keep channel open for async
  });
}

// ─── Video title ──────────────────────────────────────────────────────────────
async function getVideoTitle() {
  const el = document.querySelector('h1.ytd-video-primary-info-renderer');
  return el ? el.textContent.trim() : null;
}

async function saveVideoTitle() {
  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) return;
  const title = await getVideoTitle();
  if (!title) return;

  // Skip write if we already saved this exact title
  if (savedTitlesCache[videoId] === title) return;

  debugLog('Title', 'Saving', { videoId, title });
  const result = await new Promise(resolve => chrome.storage.sync.get({ videoTitles: {} }, resolve));
  const videoTitles = result.videoTitles;
  if (videoTitles[videoId] === title) {
    savedTitlesCache[videoId] = title; // already in storage, just cache it
    return;
  }
  videoTitles[videoId] = title;
  chrome.storage.sync.set({ videoTitles });
  savedTitlesCache[videoId] = title;
}

// ─── Extension reconnect ──────────────────────────────────────────────────────
async function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return false;
  debugLog('Reconnect', `Attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
  reconnectAttempts++;
  try {
    await chrome.runtime.sendMessage({ action: 'ping' });
    reconnectAttempts = 0;
    return true;
  } catch {
    await new Promise(r => setTimeout(r, RECONNECT_DELAY));
    return false;
  }
}

// ─── Injected styles ──────────────────────────────────────────────────────────
function injectStyles() {
  debugLog('Styles', 'Injecting marker styles');
  const style = document.createElement('style');
  style.textContent = `
    .yt-bookmark-marker {
      position: absolute;
      width: 3px;
      height: 100%;
      z-index: 2;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .yt-bookmark-marker:hover {
      transform: scaleX(2) scaleY(1.2);
      filter: brightness(1.3);
    }
    .yt-bookmark-marker::before {
      content: '';
      position: absolute;
      top: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 7px;
      height: 7px;
      background-color: inherit;
      border-radius: 50%;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .yt-bookmark-marker:hover::before {
      opacity: 1;
      transform: translateX(-50%) scale(1.2);
    }
    .yt-bookmark-marker::after {
      content: attr(data-description);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(10px);
      background-color: #2d2d2d;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      visibility: hidden;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      margin-bottom: 5px;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .yt-bookmark-marker:hover::after {
      visibility: visible;
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .yt-bookmark-marker.clicked {
      animation: bm-ripple 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes bm-ripple {
      0%   { box-shadow: 0 0 0 0 rgba(77,161,238,0.4); }
      100% { box-shadow: 0 0 0 10px rgba(77,161,238,0); }
    }

    /* Silent-save toast */
    .yt-bookmark-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      background: rgba(45, 45, 45, 0.92);
      color: white;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-family: 'Segoe UI', sans-serif;
      border-left: 3px solid #4da1ee;
      opacity: 0;
      transform: translateY(-8px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
    }
    .yt-bookmark-toast--show {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

// ─── Initialize ───────────────────────────────────────────────────────────────
function initialize() {
  if (isInitialized) { debugLog('Init', 'Already initialized'); return; }
  debugLog('Init', 'Initializing content script');

  try {
    injectStyles();
    initializeVideoObserver();
    initializeProgressBar();
    initializeMessageListener();
    document.addEventListener('keydown', handleKeyboardShortcut);

    // Debounce title saves — YouTube fires hundreds of DOM mutations per second
    const titleObserver = new MutationObserver(() => {
      clearTimeout(titleSaveTimer);
      titleSaveTimer = setTimeout(() => saveVideoTitle().catch(() => {}), 3000);
    });
    titleObserver.observe(document.body, { subtree: true, childList: true });
    saveVideoTitle().catch(() => {});

    isInitialized = true;
    debugLog('Init', 'Content script initialized successfully');
  } catch (error) {
    debugLog('Init', 'Error during initialization', { error });
    throw error;
  }
}

// Notify background that content script is ready
chrome.runtime.sendMessage({ action: 'contentScriptReady' }, response => {
  debugLog('Init', 'Sent contentScriptReady', response);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

window.addEventListener('pagehide', () => {
  debugLog('Cleanup', 'Performing cleanup');
  document.removeEventListener('keydown', handleKeyboardShortcut);
  if (video) video.removeEventListener('durationchange', updateBookmarkMarkers);
  isInitialized       = false;
  reconnectAttempts   = 0;
  cachedTranscript    = null;
  transcriptFetchPromise = null;
  cachedTranscriptVideoId = null;
});
