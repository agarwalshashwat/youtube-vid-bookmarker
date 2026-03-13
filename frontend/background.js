// ─── Constants ──────────────────────────────────────────────────────────────
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
    if (!tags || tags.length === 0) return '#14B8A6';
    return TAG_COLORS[tags[0]] || stringToColor(tags[0]);
  }
  
  function formatTimestamp(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  
  function bmKey(videoId) { return `bm_${videoId}`; }
  
  // ─── Command Listeners ───────────────────────────────────────────────────────
  chrome.commands.onCommand.addListener(async (command) => {
    console.log(`Command received: ${command}`);
    
    if (command === 'quick_save' || command === 'silent_save') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url.includes('youtube.com/watch')) return;
        
        const videoId = new URLSearchParams(new URL(tab.url).search).get('v');
        if (!videoId) return;

        try {
            // Get current time and title from content script
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getBookmarkData' });
            if (!response || response.currentTime === undefined) return;

            const timestamp = response.currentTime;
            const videoTitle = response.title || 'Unknown Video';

            // Check for duplicates
            const key = bmKey(videoId);
            const data = await chrome.storage.sync.get({ [key]: [], videoTitles: {} });
            const bookmarks = data[key];
            const videoTitles = data.videoTitles;

            if (bookmarks.some(b => Math.floor(b.timestamp) === Math.floor(timestamp))) {
                chrome.tabs.sendMessage(tab.id, { action: 'showToast', message: 'Bookmark already exists', type: 'error' });
                return;
            }

            // Save title if not already present
            if (!videoTitles[videoId]) {
                videoTitles[videoId] = videoTitle;
                await chrome.storage.sync.set({ videoTitles });
            }

            let description = '';
            let tags = [];
            
            if (command === 'silent_save') {
                // Try to get transcript if available
                try {
                    const transcriptRes = await chrome.tabs.sendMessage(tab.id, { action: 'getTranscriptSnippet', timestamp });
                    description = transcriptRes.snippet || `Bookmark at ${formatTimestamp(timestamp)}`;
                } catch (e) {
                    description = `Bookmark at ${formatTimestamp(timestamp)}`;
                }
            }
            
            tags = parseTags(description);
            const color = getTagColor(tags);

            const newBookmark = {
                videoId,
                timestamp,
                description,
                tags,
                color,
                id: Date.now(),
                createdAt: new Date().toISOString(),
                videoTitle: videoTitle
            };

            bookmarks.push(newBookmark);
            await chrome.storage.sync.set({ [key]: bookmarks });

            // Notify content script to update markers or show toast
            chrome.tabs.sendMessage(tab.id, { action: 'bookmarkUpdated' });
            chrome.tabs.sendMessage(tab.id, { action: 'showToast', message: 'Bookmark saved ✓', type: 'success' });

            if (command === 'quick_save') {
                // For quick_save, we want to open the popup (though Chrome doesn't allow programmatically opening the popup)
                // Instead, we just rely on the toast confirmation.
            }
        } catch (error) {
            console.error('Failed to save via command:', error);
        }
    }
  });

// ─── External message from webapp (auth token after OAuth) ────────────────────
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message.type === 'AUTH_SUCCESS') {
    chrome.storage.sync.set({
      bmUser: {
        userId:       message.userId,
        userEmail:    message.userEmail,
        accessToken:  message.accessToken,
        refreshToken: message.refreshToken,
      }
    }, () => {
      sendResponse({ ok: true });
    });
    return true; // async
  }
});
