// ─── API config ──────────────────────────────────────────────────────────────
// Change to 'https://bookmarker.app' after deploying the webapp
const API_BASE = 'https://clipmark-chi.vercel.app';

// ─── Tag colours ────────────────────────────────────────────────────────────
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

// ─── Utilities ───────────────────────────────────────────────────────────────
function extractVideoId(url) {
  return new URLSearchParams(new URL(url).search).get('v');
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function debugLog(category, message, data = null) {
  console.log(`[Popup][${category}][${new Date().toISOString()}] ${message}`, data ?? '');
}

// ─── Messaging ───────────────────────────────────────────────────────────────
function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Failed to communicate with the page'));
      } else if (response && response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
}

async function waitForContentScript(tabId, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const r = await sendMessageToTab(tabId, { action: 'ping' });
      if (r && r.status === 'ready') return true;
    } catch {
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Content script not available. Please refresh the YouTube page.');
}

// ─── Storage (per-video sync keys) ───────────────────────────────────────────
function bmKey(videoId) { return `bm_${videoId}`; }

function syncGet(defaults) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(defaults, r => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(r);
    });
  });
}

function syncSet(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

async function getVideoBookmarks(videoId) {
  const r = await syncGet({ [bmKey(videoId)]: [] });
  return r[bmKey(videoId)];
}

async function saveVideoBookmarks(videoId, bookmarks) {
  await syncSet({ [bmKey(videoId)]: bookmarks });
  // Cloud sync: push to Supabase if signed in
  syncToCloud(videoId, bookmarks);
}

async function syncToCloud(videoId, bookmarks) {
  try {
    const { bmUser } = await syncGet({ bmUser: null });
    if (!bmUser?.accessToken) return;
    await fetch(`${API_BASE}/api/bookmarks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bmUser.accessToken}`,
      },
      body: JSON.stringify({ videoId, bookmarks }),
    });
  } catch {
    // Cloud sync is best-effort — don't block the user
  }
}

async function getVideoTitles() {
  const r = await syncGet({ videoTitles: {} });
  return r.videoTitles;
}

// ─── One-time migration from chrome.storage.local → sync ─────────────────────
async function migrateToSync(tabId) {
  const check = await syncGet({ syncMigrated: false });
  if (check.syncMigrated) return;

  const local = await new Promise(resolve =>
    chrome.storage.local.get({ bookmarks: [], videoTitles: {} }, resolve)
  );

  const syncData = { syncMigrated: true };

  if (local.bookmarks.length > 0) {
    const byVideo = {};
    local.bookmarks.forEach(b => {
      if (!byVideo[b.videoId]) byVideo[b.videoId] = [];
      const tags = b.tags || parseTags(b.description);
      byVideo[b.videoId].push({ ...b, tags, color: b.color || getTagColor(tags) });
    });
    for (const [vId, bms] of Object.entries(byVideo)) {
      syncData[bmKey(vId)] = bms;
    }
  }

  if (Object.keys(local.videoTitles).length > 0) {
    syncData.videoTitles = local.videoTitles;
  }

  await syncSet(syncData);
  debugLog('Migration', 'Migrated bookmarks from local to sync');

  // Refresh markers after migration
  if (tabId) {
    try { await sendMessageToTab(tabId, { action: 'bookmarkUpdated' }); } catch {}
  }
}

// ─── Bookmark CRUD ────────────────────────────────────────────────────────────
async function saveBookmark(bookmark) {
  try {
    const tab = await getCurrentTab();
    await waitForContentScript(tab.id);

    // Duplicate check (unique by videoId + timestamp)
    const existing = await getVideoBookmarks(bookmark.videoId);
    if (existing.some(b => Math.floor(b.timestamp) === Math.floor(bookmark.timestamp))) {
      showError('Bookmark already exists.');
      return;
    }

    const videoTitles = await getVideoTitles();
    const tags  = parseTags(bookmark.description);
    const color = getTagColor(tags);
    const description = bookmark.description.trim() || `Bookmark at ${formatTimestamp(bookmark.timestamp)}`;

    const bookmarks = await getVideoBookmarks(bookmark.videoId);
    bookmarks.push({
      ...bookmark,
      description,
      tags,
      color,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      videoTitle: videoTitles[bookmark.videoId] || null,
    });

    await saveVideoBookmarks(bookmark.videoId, bookmarks);
    debugLog('Bookmarks', 'Saved bookmark', { description, tags });

    document.getElementById('description').value = '';
    document.getElementById('tag-suggestions').style.display = 'none';
    showStatus('Bookmark saved ✓');

    await loadBookmarks();
    await sendMessageToTab(tab.id, { action: 'bookmarkUpdated' });
  } catch (error) {
    debugLog('Error', 'Failed to save bookmark', { error: error.message });
    showError('Failed to save bookmark: ' + error.message);
  }
}

async function deleteBookmark(videoId, bookmarkId) {
  try {
    const tab = await getCurrentTab();
    await waitForContentScript(tab.id);

    const bookmarks = await getVideoBookmarks(videoId);
    await saveVideoBookmarks(videoId, bookmarks.filter(b => b.id !== parseInt(bookmarkId)));

    await loadBookmarks();
    await sendMessageToTab(tab.id, { action: 'bookmarkUpdated' });
  } catch (error) {
    showError('Failed to delete bookmark: ' + error.message);
  }
}

async function updateBookmarkDescription(videoId, bookmarkId, newDescription) {
  try {
    const tab = await getCurrentTab();
    const bookmarks = await getVideoBookmarks(videoId);
    const updated = bookmarks.map(b => {
      if (b.id !== parseInt(bookmarkId)) return b;
      const tags  = parseTags(newDescription);
      const color = getTagColor(tags);
      return { ...b, description: newDescription, tags, color };
    });
    await saveVideoBookmarks(videoId, updated);
    await loadBookmarks();
    try { await sendMessageToTab(tab.id, { action: 'bookmarkUpdated' }); } catch {}
  } catch (error) {
    showError('Failed to update bookmark: ' + error.message);
  }
}

// ─── Smart Tag Suggestions ────────────────────────────────────────────────────
async function suggestTags(description, transcript) {
  const suggestionsEl = document.getElementById('tag-suggestions');
  if (!description.trim()) {
    suggestionsEl.style.display = 'none';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/suggest-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, transcript }),
    });
    if (!response.ok) return;

    const { tags } = await response.json();
    if (!tags?.length) return;

    const input = document.getElementById('description');
    const existingTags = parseTags(input.value);
    const newTags = tags.filter(t => !existingTags.includes(t));
    if (!newTags.length) return;

    suggestionsEl.innerHTML =
      '<span class="tag-suggest-label">Suggested:</span>' +
      newTags.map(t =>
        `<button class="tag-suggest-chip" data-tag="${t}" style="background:${getTagColor([t])}">#${t}</button>`
      ).join('');

    suggestionsEl.querySelectorAll('.tag-suggest-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        const val = input.value.trim();
        input.value = val ? `${val} #${tag}` : `#${tag}`;
        chip.remove();
        if (!suggestionsEl.querySelectorAll('.tag-suggest-chip').length) {
          suggestionsEl.style.display = 'none';
        }
      });
    });

    suggestionsEl.style.display = 'flex';
  } catch {
    // Silently ignore — tag suggestions are non-critical
  }
}

// ─── AI Summary ───────────────────────────────────────────────────────────────
async function summarizeBookmarks() {
  const btn = document.getElementById('summarize-btn');
  const panel = document.getElementById('summary-panel');
  const content = document.getElementById('summary-content');

  // Toggle off if already open
  if (panel.style.display !== 'none') {
    panel.style.display = 'none';
    return;
  }

  try {
    const tab = await getCurrentTab();
    if (!tab.url.includes('youtube.com/watch')) {
      throw new Error('Please navigate to a YouTube video first!');
    }

    const videoId = extractVideoId(tab.url);
    if (!videoId) throw new Error('Could not find video ID');

    const bookmarks = await getVideoBookmarks(videoId);
    if (bookmarks.length === 0) {
      throw new Error('Add some bookmarks first');
    }

    const videoTitles = await getVideoTitles();

    btn.textContent = '…';
    btn.disabled = true;

    const response = await fetch(`${API_BASE}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookmarks,
        videoTitle: videoTitles[videoId] || '',
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Server error');
    }

    const { summary, topics, actionItems } = await response.json();

    let html = `<p class="summary-text">${summary}</p>`;

    if (topics?.length) {
      html += `<div class="summary-section"><strong>Topics</strong><ul>${
        topics.map(t => `<li>${t}</li>`).join('')
      }</ul></div>`;
    }

    if (actionItems?.length) {
      html += `<div class="summary-section"><strong>Action items</strong><ul>${
        actionItems.map(a => `<li>${a}</li>`).join('')
      }</ul></div>`;
    }

    content.innerHTML = html;
    panel.style.display = 'block';
  } catch (error) {
    showError(error.message);
  } finally {
    btn.textContent = '✦ Summary';
    btn.disabled = false;
  }
}

// ─── Share ────────────────────────────────────────────────────────────────────
async function shareBookmarks() {
  const btn = document.getElementById('share-btn');
  try {
    const tab = await getCurrentTab();
    if (!tab.url.includes('youtube.com/watch')) {
      throw new Error('Please navigate to a YouTube video first!');
    }

    const videoId = extractVideoId(tab.url);
    if (!videoId) throw new Error('Could not find video ID');

    const bookmarks = await getVideoBookmarks(videoId);
    if (bookmarks.length === 0) {
      throw new Error('Add some bookmarks before sharing');
    }

    const videoTitles = await getVideoTitles();

    btn.textContent = 'Sharing…';
    btn.disabled = true;

    const { bmUser } = await syncGet({ bmUser: null });
    const response = await fetch(`${API_BASE}/api/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        videoTitle: videoTitles[videoId] || '',
        bookmarks,
        userId: bmUser?.userId || null,
      }),
    });

    if (!response.ok) throw new Error('Server error — is the webapp running?');

    const { shareId } = await response.json();
    const shareUrl = `${API_BASE}/v/${shareId}`;

    await navigator.clipboard.writeText(shareUrl);

    btn.textContent = '✓ Copied!';
    btn.classList.add('share-btn--copied');
    setTimeout(() => {
      btn.textContent = '↗ Share';
      btn.classList.remove('share-btn--copied');
      btn.disabled = false;
    }, 2500);
  } catch (error) {
    debugLog('Error', 'Share failed', { error: error.message });
    showError(error.message);
    btn.textContent = '↗ Share';
    btn.disabled = false;
  }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function showError(message, duration = 3000) {
  const el = document.getElementById('error-message');
  el.textContent = message;
  el.style.display = 'block';
  el.classList.add('show');
  el.classList.remove('hide');
  setTimeout(() => {
    el.classList.add('hide');
    el.classList.remove('show');
    setTimeout(() => { el.style.display = 'none'; }, 300);
  }, duration);
}

function showStatus(message, duration = 1500) {
  const el = document.getElementById('status-message');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// ─── Render bookmarks in popup ────────────────────────────────────────────────
async function loadBookmarks() {
  try {
    const tab = await getCurrentTab();
    if (!tab.url.includes('youtube.com/watch')) return;

    const videoId = extractVideoId(tab.url);
    if (!videoId) return;

    // Update video title context
    const videoTitles = await getVideoTitles();
    const titleEl = document.querySelector('#video-title span');
    if (titleEl && videoTitles[videoId]) {
      titleEl.textContent = videoTitles[videoId];
    }

    // Update timestamp preview
    try {
      const response = await sendMessageToTab(tab.id, { action: 'getCurrentTime' });
      if (response && response.currentTime !== undefined) {
        const currentTimeEl = document.getElementById('current-time');
        if (currentTimeEl) {
          currentTimeEl.textContent = `⏱ ${formatTimestamp(response.currentTime)}`;
        }
      }
    } catch (e) {
      debugLog('Error', 'Could not get current time', e.message);
    }

    await waitForContentScript(tab.id);

    const bookmarks = (await getVideoBookmarks(videoId))
      .sort((a, b) => a.timestamp - b.timestamp);

    const list = document.getElementById('bookmark-list');
    
    if (bookmarks.length === 0) {
      list.innerHTML = `
        <div class="no-bookmarks">
          No bookmarks yet.<br>
          <span class="no-bookmarks-hint">Save important moments from YouTube videos<br>so you can revisit them later.</span>
        </div>
      `;
      return;
    }

    list.innerHTML = bookmarks.map(b => `
      <div class="bookmark" data-timestamp="${b.timestamp}" data-id="${b.id}" data-video-id="${videoId}" style="border-left-color: ${b.color || '#4da1ee'}">
        <div class="bookmark-content">
          <span class="bookmark-time" style="color:${b.color || '#4da1ee'}">${formatTimestamp(b.timestamp)}</span>
          <span class="bookmark-desc">${b.description || 'No description'}</span>
          ${b.tags && b.tags.length
            ? `<div class="bookmark-tags">${b.tags.map(t =>
                `<span class="tag-badge" style="background:${getTagColor([t])}">${t}</span>`
              ).join('')}</div>`
            : ''}
        </div>
        <button class="copy-link" data-video-id="${videoId}" data-timestamp="${b.timestamp}" aria-label="Copy link" title="Copy timestamped link">⎘</button>
        <button class="delete-bookmark" aria-label="Delete bookmark">&times;</button>
      </div>
    `).join('');

    list.querySelectorAll('.bookmark').forEach(el => {
      const id        = el.dataset.id;
      const vId       = el.dataset.videoId;
      const timestamp = el.dataset.timestamp;

      // Copy link
      el.querySelector('.copy-link').addEventListener('click', async e => {
        e.stopPropagation();
        const url = `https://www.youtube.com/watch?v=${vId}&t=${Math.floor(parseFloat(timestamp))}`;
        await navigator.clipboard.writeText(url);
        showStatus('Link copied!');
      });

      // Delete
      el.querySelector('.delete-bookmark').addEventListener('click', async e => {
        e.stopPropagation();
        await deleteBookmark(vId, id);
      });

      // Navigate on row click (not on desc or delete)
      el.addEventListener('click', async e => {
        if (e.target.classList.contains('delete-bookmark') ||
            e.target.classList.contains('bookmark-desc')) return;
        const currentTab = await getCurrentTab();
        await handleBookmarkClick(currentTab, timestamp);
      });

      // Inline edit on description click
      el.querySelector('.bookmark-desc').addEventListener('click', e => {
        e.stopPropagation();
        const descEl  = e.currentTarget;
        const current = descEl.textContent;

        const input = document.createElement('input');
        input.type      = 'text';
        input.className = 'bookmark-edit-input';
        input.value     = (current === 'No description' || current.startsWith('Bookmark at')) ? '' : current;
        descEl.replaceWith(input);
        input.focus();
        input.select();

        const save = () => {
          const val = input.value.trim() || `Bookmark at ${formatTimestamp(parseFloat(timestamp))}`;
          updateBookmarkDescription(vId, id, val);
        };

        const blurHandler = () => {
          save();
          input.removeEventListener('blur', blurHandler);
        };

        input.addEventListener('blur', blurHandler);
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter')  { e.preventDefault(); input.removeEventListener('blur', blurHandler); save(); }
          if (e.key === 'Escape') { input.removeEventListener('blur', blurHandler); loadBookmarks(); }
        });
      });
    });
  } catch (error) {
    debugLog('Error', 'Failed to load bookmarks', { error: error.message });
    showError('Failed to load bookmarks: ' + error.message);
  }
}

async function handleBookmarkClick(tab, timestamp) {
  try {
    await waitForContentScript(tab.id);
    await sendMessageToTab(tab.id, { action: 'setTimestamp', timestamp: parseFloat(timestamp) });
  } catch (error) {
    showError('Failed to navigate to timestamp: ' + error.message);
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function loadAuthState() {
  const { bmUser } = await syncGet({ bmUser: null });
  const signinBtn  = document.getElementById('signin-btn');
  const userChip   = document.getElementById('user-chip');
  if (!signinBtn || !userChip) return;

  if (bmUser) {
    signinBtn.style.display  = 'none';
    userChip.style.display   = '';
    userChip.textContent     = bmUser.userEmail?.split('@')[0] || 'Signed in';
    userChip.title           = bmUser.userEmail || '';
  } else {
    signinBtn.style.display  = '';
    userChip.style.display   = 'none';
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  debugLog('Init', 'Popup opened');

  const tab = await getCurrentTab().catch(() => null);
  if (tab) await migrateToSync(tab.id).catch(() => {});

  loadBookmarks();

  // Pre-warm transcript cache while the popup is loading
  getCurrentTab().then(t => {
    if (t?.url?.includes('youtube.com/watch')) {
      sendMessageToTab(t.id, { action: 'prefetchTranscript' }).catch(() => {});
    }
  }).catch(() => {});

  loadAuthState();

  document.getElementById('summarize-btn').addEventListener('click', summarizeBookmarks);
  document.getElementById('summary-close').addEventListener('click', () => {
    document.getElementById('summary-panel').style.display = 'none';
  });

  document.getElementById('share-btn').addEventListener('click', shareBookmarks);

  document.getElementById('signin-btn').addEventListener('click', async () => {
    const tab = await getCurrentTab().catch(() => null);
    if (!tab) return;
    const url = `${API_BASE}/signin?extensionId=${chrome.runtime.id}`;
    chrome.tabs.create({ url });
  });

  // ── Auto-fill from transcript ──────────────────────────────────────────────
  document.getElementById('auto-fill-btn').addEventListener('click', async () => {
    const btn   = document.getElementById('auto-fill-btn');
    const input = document.getElementById('description');
    try {
      const tab = await getCurrentTab();
      if (!tab.url.includes('youtube.com/watch')) return;

      btn.textContent = '…';
      btn.disabled    = true;

      await waitForContentScript(tab.id);
      const tsRes = await sendMessageToTab(tab.id, { action: 'getTimestamp' });
      if (!tsRes?.timestamp) throw new Error('no timestamp');

      const txRes = await sendMessageToTab(tab.id, {
        action:    'getTranscriptAtTimestamp',
        timestamp: tsRes.timestamp,
      });

      if (txRes?.text) {
        input.value = txRes.text;
        input.focus();
        input.select();
        btn.textContent = '✓';
        btn.classList.add('auto-fill-btn--done');
        suggestTags(txRes.text, txRes.text);
      } else {
        const chRes = await sendMessageToTab(tab.id, { action: 'getCurrentChapter' }).catch(() => null);
        if (chRes?.chapter) {
          input.value = chRes.chapter;
          input.focus();
          input.select();
          btn.textContent = '✓';
          btn.classList.add('auto-fill-btn--done');
          suggestTags(chRes.chapter);
        } else {
          btn.textContent = 'No transcript';
        }
      }
    } catch {
      btn.textContent = '✦ Auto';
    } finally {
      setTimeout(() => {
        btn.textContent = '✦ Auto';
        btn.classList.remove('auto-fill-btn--done');
        btn.disabled = false;
      }, 1800);
    }
  });

  document.getElementById('add-bookmark').addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      if (!tab.url.includes('youtube.com/watch')) {
        throw new Error('Please navigate to a YouTube video first!');
      }

      const videoId = extractVideoId(tab.url);
      if (!videoId) throw new Error('Could not find a valid YouTube video ID');

      await waitForContentScript(tab.id);
      const response = await sendMessageToTab(tab.id, { action: 'getTimestamp' });

      if (response && response.timestamp != null) {
        const description = document.getElementById('description').value;
        await saveBookmark({ videoId, timestamp: response.timestamp, description });
        document.getElementById('description').value = '';
      } else {
        throw new Error('Could not get current video timestamp');
      }
    } catch (error) {
      debugLog('Error', 'Failed to add bookmark', { error: error.message });
      showError(error.message);
    }
  });

  document.getElementById('view-all-bookmarks').addEventListener('click', e => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('bookmarks.html') });
  });
});
