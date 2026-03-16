// ─── Tag colours (must match popup.js / content.js) ──────────────────────────
const TAG_COLORS = {
  important: '#ff6b6b',
  review:    '#ffa94d',
  note:      '#74c0fc',
  question:  '#a9e34b',
  todo:      '#da77f2',
  key:       '#f783ac',
};

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

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function showToast(message, type = 'error') {
  const toast = document.getElementById(`${type}-toast`);
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
async function getAllBookmarks() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, result => {
      if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
      const bookmarks = [];
      for (const [key, val] of Object.entries(result)) {
        if (key.startsWith('bm_') && Array.isArray(val)) bookmarks.push(...val);
      }
      resolve(bookmarks);
    });
  });
}

async function getVideoTitles() {
  return new Promise(resolve =>
    chrome.storage.sync.get({ videoTitles: {} }, r => resolve(r.videoTitles || {}))
  );
}

async function deleteBookmark(videoId, bookmarkId) {
  return new Promise((resolve, reject) => {
    const key = bmKey(videoId);
    chrome.storage.sync.get({ [key]: [] }, result => {
      if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
      const updated = result[key].filter(b => b.id !== bookmarkId);
      chrome.storage.sync.set({ [key]: updated }, () => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve();
      });
    });
  });
}

// ─── State ────────────────────────────────────────────────────────────────────
let allBookmarks = [];
let filterQuery  = '';
let sortOrder    = 'newest';
let viewMode     = localStorage.getItem('bm_viewMode') || 'cards';
let selectedIds  = new Set();

// ─── Sort & filter ────────────────────────────────────────────────────────────
function applyFiltersAndSort(bookmarks) {
  let result = [...bookmarks];

  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    result = result.filter(b =>
      (b.description || '').toLowerCase().includes(q) ||
      (b.videoTitle  || '').toLowerCase().includes(q) ||
      (b.tags || []).some(t => t.includes(q))
    );
  }

  switch (sortOrder) {
    case 'newest':    result.sort((a, b) => b.id - a.id); break;
    case 'oldest':    result.sort((a, b) => a.id - b.id); break;
    case 'timestamp': result.sort((a, b) => a.timestamp - b.timestamp); break;
  }

  return result;
}

function groupByVideo(bookmarks) {
  const groups = {};
  bookmarks.forEach(b => {
    if (!groups[b.videoId]) groups[b.videoId] = [];
    groups[b.videoId].push(b);
  });
  return groups;
}

// ─── Build timeline dots HTML for a video group ───────────────────────────────
function buildTimeline(bookmarks) {
  const maxTs    = Math.max(...bookmarks.map(b => b.timestamp));
  // Always leave ≥60s of empty track after the last bookmark and use at least
  // 2 minutes total, so a lone early bookmark doesn't sit at the far right.
  const trackMax = Math.max(maxTs + 60, 120);
  return bookmarks.map(b => {
    const pct   = ((b.timestamp / trackMax) * 95).toFixed(2);
    const color = b.color || '#14B8A6';
    const label = `${formatTimestamp(b.timestamp)} — ${b.description || 'No note'}`;
    return `<div class="vc-dot" style="left:${pct}%;background:${color}" title="${label}"></div>`;
  }).join('');
}

// ─── Render ───────────────────────────────────────────────────────────────────
async function renderBookmarks() {
  const container = document.getElementById('bookmarks-container');
  const filtered  = applyFiltersAndSort(allBookmarks);

  if (filtered.length === 0) {
    container.className = '';
    container.innerHTML = allBookmarks.length === 0
      ? `<div class="empty-state">
           <div class="empty-state-icon">🔖</div>
           <h3>No bookmarks yet</h3>
           <p>Save important moments from YouTube videos so you can revisit them later.</p>
         </div>`
      : `<div class="empty-state">
           <div class="empty-state-icon">🔍</div>
           <h3>No matches found</h3>
           <p>Try adjusting your search or filters.</p>
         </div>`;
    return;
  }

  const videoTitles = await getVideoTitles();
  container.innerHTML = '';
  container.className = viewMode === 'list' ? 'list-view' : '';
  selectedIds.clear();
  updateBulkDeleteBtn();

  const grouped  = groupByVideo(filtered);
  const videoIds = Object.keys(grouped);

  if (sortOrder === 'oldest') {
    videoIds.sort((a, b) =>
      Math.min(...grouped[a].map(x => x.id)) - Math.min(...grouped[b].map(x => x.id)));
  } else if (sortOrder === 'timestamp') {
    videoIds.sort((a, b) => {
      const ta = (grouped[a][0].videoTitle || videoTitles[a] || a).toLowerCase();
      const tb = (grouped[b][0].videoTitle || videoTitles[b] || b).toLowerCase();
      return ta.localeCompare(tb);
    });
  } else {
    videoIds.sort((a, b) =>
      Math.max(...grouped[b].map(x => x.id)) - Math.max(...grouped[a].map(x => x.id)));
  }

  videoIds.forEach(videoId => {
    const bookmarks = grouped[videoId];
    const title  = bookmarks[0].videoTitle || videoTitles[videoId] || `Video: ${videoId}`;
    const ytUrl  = `https://www.youtube.com/watch?v=${videoId}`;
    const thumb  = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    const count  = bookmarks.length;

    const card = document.createElement('div');
    card.className = 'vc-card';

    if (viewMode === 'list') {
      // ── Compact list view ──────────────────────────────────────────────────
      card.innerHTML = `
        <div class="vc-list-head">
          <span class="vc-list-icon">▶</span>
          <a class="vc-list-title" href="${ytUrl}" target="_blank" rel="noopener">${title}</a>
          <span class="vc-list-count">${count} clip${count !== 1 ? 's' : ''}</span>
        </div>
        <div class="vc-chapters">
          ${bookmarks.map(b => {
            const c = b.color || '#14B8A6';
            return `
              <div class="vc-chapter" data-bookmark-id="${b.id}" data-video-id="${videoId}">
                <input type="checkbox" class="bookmark-checkbox vc-cb" data-bookmark-id="${b.id}" data-video-id="${videoId}">
                <span class="vc-dot-sm" style="background:${c}"></span>
                <span class="vc-time" style="color:${c}">${formatTimestamp(b.timestamp)}</span>
                <span class="vc-desc">${b.description || 'No note added.'}</span>
                ${b.tags && b.tags.length
                  ? `<div class="vc-tags">${b.tags.map(t =>
                      `<span class="tag-badge" style="background:${getTagColor([t])}">${t}</span>`
                    ).join('')}</div>`
                  : '<div class="vc-tags"></div>'}
                <div class="vc-actions">
                  <button class="btn-icon copy-link" data-video-id="${videoId}" data-timestamp="${b.timestamp}" title="Copy link">⎘</button>
                  <button class="vc-jump jump-to-video" data-video-id="${videoId}" data-timestamp="${b.timestamp}">Jump</button>
                  <button class="vc-del delete-bookmark" data-bookmark-id="${b.id}" data-video-id="${videoId}">×</button>
                </div>
              </div>`;
          }).join('')}
        </div>`;
    } else {
      // ── Chapter card view ──────────────────────────────────────────────────
      card.innerHTML = `
        <div class="vc-head">
          <a href="${ytUrl}" target="_blank" rel="noopener" class="vc-thumb-wrap">
            <img src="${thumb}" alt="${title}" class="vc-thumb" loading="lazy">
          </a>
          <div class="vc-meta">
            <a class="vc-title" href="${ytUrl}" target="_blank" rel="noopener">${title}</a>
            <div class="vc-count-row">
              <span class="vc-count-icon">⏱</span>
              <span class="vc-count-text">${count} bookmark${count !== 1 ? 's' : ''}</span>
              <button class="vc-revision-btn" data-video-id="${videoId}">▶ Revision</button>
            </div>
          </div>
        </div>
        <div class="vc-timeline-row">
          <div class="vc-track">
            ${buildTimeline(bookmarks)}
          </div>
        </div>
        <div class="vc-chapters-label">Bookmarks</div>
        <div class="vc-chapters">
          ${bookmarks.map(b => {
            const c = b.color || '#14B8A6';
            return `
              <div class="vc-chapter" data-bookmark-id="${b.id}" data-video-id="${videoId}">
                <input type="checkbox" class="bookmark-checkbox vc-cb" data-bookmark-id="${b.id}" data-video-id="${videoId}">
                <span class="vc-dot-sm" style="background:${c}"></span>
                <span class="vc-time" style="color:${c}">${formatTimestamp(b.timestamp)}</span>
                <span class="vc-desc">${b.description || 'No note added.'}</span>
                ${b.tags && b.tags.length
                  ? `<div class="vc-tags">${b.tags.map(t =>
                      `<span class="tag-badge" style="background:${getTagColor([t])}">${t}</span>`
                    ).join('')}</div>`
                  : '<div class="vc-tags"></div>'}
                <div class="vc-actions">
                  <button class="btn-icon copy-link" data-video-id="${videoId}" data-timestamp="${b.timestamp}" title="Copy link">⎘</button>
                  <button class="vc-jump jump-to-video" data-video-id="${videoId}" data-timestamp="${b.timestamp}">Jump</button>
                  <button class="vc-del delete-bookmark" data-bookmark-id="${b.id}" data-video-id="${videoId}">×</button>
                </div>
              </div>`;
          }).join('')}
        </div>`;
    }

    container.appendChild(card);
  });

  attachEventListeners();
}

function updateBulkDeleteBtn() {
  const btn = document.getElementById('bulk-delete-btn');
  const cnt = document.getElementById('bulk-count');
  if (!btn) return;
  if (selectedIds.size > 0) {
    btn.style.display = '';
    cnt.textContent = selectedIds.size;
  } else {
    btn.style.display = 'none';
  }
}

function attachEventListeners() {
  document.querySelectorAll('.vc-revision-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const videoId   = btn.dataset.videoId;
      const bookmarks = allBookmarks
        .filter(b => b.videoId === videoId)
        .sort((a, b) => a.timestamp - b.timestamp);
      if (!bookmarks.length) return;
      await chrome.storage.local.set({ pendingRevision: { videoId, bookmarks } });
      chrome.tabs.create({ url: `https://www.youtube.com/watch?v=${videoId}` });
    });
  });

  document.querySelectorAll('.jump-to-video').forEach(btn => {
    btn.addEventListener('click', e => {
      jumpToVideo(e.target.dataset.videoId, parseFloat(e.target.dataset.timestamp));
    });
  });

  document.querySelectorAll('.copy-link').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const { videoId, timestamp } = e.currentTarget.dataset;
      const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(parseFloat(timestamp))}`;
      await navigator.clipboard.writeText(url);
      showToast('Link copied!', 'success');
    });
  });

  document.querySelectorAll('.bookmark-checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      e.stopPropagation();
      const key = `${e.target.dataset.videoId}:${e.target.dataset.bookmarkId}`;
      if (e.target.checked) selectedIds.add(key);
      else selectedIds.delete(key);
      updateBulkDeleteBtn();
      const card = e.target.closest('.bookmark-card-new, .bookmark-row, .vg-row, .vc-chapter');
      if (card) card.classList.toggle('selected', e.target.checked);
    });
  });

  document.querySelectorAll('.delete-bookmark').forEach(btn => {
    btn.addEventListener('click', async e => {
      const bookmarkId = parseInt(e.target.dataset.bookmarkId);
      const videoId    = e.target.dataset.videoId;
      const card       = e.target.closest('.bookmark-card-new, .bookmark-row, .vg-row, .vc-chapter');

      card.classList.add('deleting');
      await new Promise(r => setTimeout(r, 300));

      try {
        await deleteBookmark(videoId, bookmarkId);
        allBookmarks = allBookmarks.filter(b => b.id !== bookmarkId);
        await renderBookmarks();
        showToast('Bookmark deleted', 'success');
      } catch {
        card.classList.remove('deleting');
        showToast('Failed to delete bookmark');
      }
    });
  });
}

function jumpToVideo(videoId, timestamp) {
  window.open(`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(timestamp)}`, '_blank');
}

// ─── Export ───────────────────────────────────────────────────────────────────
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON() {
  const data = JSON.stringify(allBookmarks, null, 2);
  downloadFile(data, 'bookmarks.json', 'application/json');
}

function exportCSV() {
  const header = 'Video ID,Video Title,Timestamp,Description,Tags,Created At\n';
  const rows   = allBookmarks.map(b =>
    [b.videoId, b.videoTitle || '', formatTimestamp(b.timestamp),
     (b.description || '').replace(/"/g, '""'),
     (b.tags || []).join(' '), b.createdAt]
    .map(v => `"${v}"`).join(',')
  ).join('\n');
  downloadFile(header + rows, 'bookmarks.csv', 'text/csv');
}

function exportMarkdown() {
  const videoTitles = {};
  allBookmarks.forEach(b => { videoTitles[b.videoId] = b.videoTitle || b.videoId; });

  const groups = groupByVideo(allBookmarks);
  const lines  = ['# YouTube Bookmarks\n'];

  for (const [videoId, bookmarks] of Object.entries(groups)) {
    const title = videoTitles[videoId] || videoId;
    lines.push(`## [${title}](https://www.youtube.com/watch?v=${videoId})\n`);
    bookmarks.sort((a, b) => a.timestamp - b.timestamp).forEach(b => {
      const tagStr = b.tags && b.tags.length ? ` ${b.tags.map(t => `#${t}`).join(' ')}` : '';
      const url    = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(b.timestamp)}`;
      lines.push(`- [${formatTimestamp(b.timestamp)}](${url}) — ${b.description || 'No description'}${tagStr}`);
    });
    lines.push('');
  }

  downloadFile(lines.join('\n'), 'bookmarks.md', 'text/markdown');
}

// ─── Import ───────────────────────────────────────────────────────────────────
async function importBookmarks(file) {
  try {
    const text     = await file.text();
    const imported = JSON.parse(text);

    if (!Array.isArray(imported)) throw new Error('Invalid format: expected an array');

    // Deduplicate by id, then save per-video
    const existingIds = new Set(allBookmarks.map(b => b.id));
    const newOnes     = imported.filter(b => b.videoId && b.timestamp != null && !existingIds.has(b.id));

    if (newOnes.length === 0) {
      showToast('No new bookmarks to import', 'success');
      return;
    }

    // Group by video and merge into sync storage
    const byVideo = {};
    newOnes.forEach(b => {
      if (!byVideo[b.videoId]) byVideo[b.videoId] = [];
      byVideo[b.videoId].push(b);
    });

    for (const [videoId, bookmarks] of Object.entries(byVideo)) {
      const key     = bmKey(videoId);
      const current = await new Promise(r => chrome.storage.sync.get({ [key]: [] }, r));
      const merged  = [...current[key], ...bookmarks];
      await new Promise((resolve, reject) =>
        chrome.storage.sync.set({ [key]: merged }, () => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve();
        })
      );
    }

    await loadAllBookmarks();
    showToast(`Imported ${newOnes.length} bookmark${newOnes.length !== 1 ? 's' : ''}`, 'success');
  } catch (error) {
    showToast('Import failed: ' + error.message);
  }
}

// ─── Main load ────────────────────────────────────────────────────────────────
async function loadAllBookmarks() {
  try {
    allBookmarks = await getAllBookmarks();
    await renderBookmarks();
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    showToast('Failed to load bookmarks');
  }
}

// ─── View toggle ──────────────────────────────────────────────────────────────
function updateViewToggle() {
  document.getElementById('view-cards').classList.toggle('view-btn--active', viewMode === 'cards');
  document.getElementById('view-list').classList.toggle('view-btn--active',  viewMode === 'list');
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateViewToggle();
  loadAllBookmarks();

  // Search
  document.getElementById('search-input').addEventListener('input', e => {
    filterQuery = e.target.value.trim();
    renderBookmarks();
  });

  // Sort
  document.getElementById('sort-select').addEventListener('change', e => {
    sortOrder = e.target.value;
    renderBookmarks();
  });

  // Bulk delete
  document.getElementById('bulk-delete-btn').addEventListener('click', async () => {
    if (selectedIds.size === 0) return;
    const btn   = document.getElementById('bulk-delete-btn');
    const count = selectedIds.size;
    btn.disabled = true;
    try {
      for (const key of [...selectedIds]) {
        const [videoId, bookmarkIdStr] = key.split(':');
        const bookmarkId = parseInt(bookmarkIdStr);
        await deleteBookmark(videoId, bookmarkId);
        allBookmarks = allBookmarks.filter(b => !(b.videoId === videoId && b.id === bookmarkId));
      }
      selectedIds.clear();
      await renderBookmarks();
      showToast(`Deleted ${count} bookmark${count !== 1 ? 's' : ''}`, 'success');
    } catch {
      showToast('Failed to delete some bookmarks');
      btn.disabled = false;
    }
  });

  // View toggle
  document.getElementById('view-cards').addEventListener('click', () => {
    viewMode = 'cards';
    localStorage.setItem('bm_viewMode', viewMode);
    updateViewToggle();
    renderBookmarks();
  });
  document.getElementById('view-list').addEventListener('click', () => {
    viewMode = 'list';
    localStorage.setItem('bm_viewMode', viewMode);
    updateViewToggle();
    renderBookmarks();
  });

  // Export buttons
  document.getElementById('export-json').addEventListener('click', exportJSON);
  document.getElementById('export-csv').addEventListener('click', exportCSV);
  document.getElementById('export-md').addEventListener('click', exportMarkdown);

  // Import
  const importInput = document.getElementById('import-input');
  document.getElementById('import-btn').addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', e => {
    if (e.target.files[0]) {
      importBookmarks(e.target.files[0]);
      importInput.value = ''; // reset so same file can be re-imported if needed
    }
  });
});
