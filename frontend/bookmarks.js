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

// ─── Render ───────────────────────────────────────────────────────────────────
async function renderBookmarks() {
  const container = document.getElementById('bookmarks-container');
  const filtered  = applyFiltersAndSort(allBookmarks);

  if (filtered.length === 0) {
    if (allBookmarks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔖</div>
          <h3>No bookmarks yet</h3>
          <p>Save important moments from YouTube videos so you can revisit them later.</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>No matches found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      `;
    }
    return;
  }

  const videoTitles = await getVideoTitles();
  container.innerHTML = '';
  container.className = viewMode === 'list' ? 'list-view' : '';
  selectedIds.clear();
  updateBulkDeleteBtn();

  filtered.forEach(b => {
    const videoId = b.videoId;
    const title   = b.videoTitle || videoTitles[videoId] || `Video: ${videoId}`;
    const color   = b.color || '#14B8A6';
    const el      = document.createElement('div');

    if (viewMode === 'list') {
      el.className = 'bookmark-row';
      el.innerHTML = `
        <input type="checkbox" class="bookmark-checkbox" data-bookmark-id="${b.id}" data-video-id="${videoId}">
        <span class="row-timestamp" style="color:${color}">${formatTimestamp(b.timestamp)}</span>
        <div class="row-info">
          <span class="row-video-title" title="${title}">${title}</span>
          <span class="row-description">${b.description || 'No note added.'}</span>
        </div>
        ${b.tags && b.tags.length
          ? `<div class="row-tags">${b.tags.map(t =>
              `<span class="tag-badge" style="background:${getTagColor([t])}">${t}</span>`
            ).join('')}</div>`
          : '<div class="row-tags"></div>'}
        <div class="row-actions">
          <button class="btn-icon copy-link" data-video-id="${videoId}" data-timestamp="${b.timestamp}" title="Copy timestamped link">⎘</button>
          <button class="btn-primary jump-to-video" data-video-id="${videoId}" data-timestamp="${b.timestamp}">Jump</button>
          <button class="btn-secondary delete-bookmark" data-bookmark-id="${b.id}" data-video-id="${videoId}">Delete</button>
        </div>
      `;
    } else {
      const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      el.className = 'bookmark-card-new';
      el.innerHTML = `
        <div class="card-thumbnail-wrapper">
          <input type="checkbox" class="card-checkbox bookmark-checkbox" data-bookmark-id="${b.id}" data-video-id="${videoId}">
          <img src="${thumbnail}" alt="${title}" class="card-thumbnail">
          <div class="card-timestamp-pill" style="background:${color}">${formatTimestamp(b.timestamp)}</div>
        </div>
        <div class="card-content">
          <h3 class="card-video-title" title="${title}">${title}</h3>
          <p class="card-note">${b.description || 'No note added.'}</p>
          ${b.tags && b.tags.length
            ? `<div class="card-tags">${b.tags.map(t =>
                `<span class="tag-badge" style="background:${getTagColor([t])}">${t}</span>`
              ).join('')}</div>`
            : ''}
          <div class="card-actions">
            <button class="btn-icon copy-link" data-video-id="${videoId}" data-timestamp="${b.timestamp}" title="Copy timestamped link">⎘</button>
            <button class="btn-primary jump-to-video" data-video-id="${videoId}" data-timestamp="${b.timestamp}">Jump to Video</button>
            <button class="btn-secondary delete-bookmark" data-bookmark-id="${b.id}" data-video-id="${videoId}">Delete</button>
          </div>
        </div>
      `;
    }
    container.appendChild(el);
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
      const card = e.target.closest('.bookmark-card-new, .bookmark-row');
      if (card) card.classList.toggle('selected', e.target.checked);
    });
  });

  document.querySelectorAll('.delete-bookmark').forEach(btn => {
    btn.addEventListener('click', async e => {
      const bookmarkId = parseInt(e.target.dataset.bookmarkId);
      const videoId    = e.target.dataset.videoId;
      const card       = e.target.closest('.bookmark-card-new, .bookmark-row');

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
