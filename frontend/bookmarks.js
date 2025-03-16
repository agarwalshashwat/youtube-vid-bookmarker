// Helper functions for toast notifications
function showToast(message, type = 'error') {
    const toast = document.getElementById(`${type}-toast`);
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Helper function to format timestamp
function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Load all bookmarks from storage
async function loadAllBookmarks() {
    try {
        const result = await chrome.storage.local.get({ bookmarks: [] });
        const bookmarks = result.bookmarks;
        
        if (bookmarks.length === 0) {
            document.getElementById('bookmarks-container').innerHTML = 
                '<div class="no-bookmarks">No bookmarks saved yet</div>';
            return;
        }

        // Group bookmarks by video ID
        const bookmarksByVideo = groupBookmarksByVideo(bookmarks);
        await displayBookmarks(bookmarksByVideo);
        attachEventListeners();
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        showToast('Failed to load bookmarks');
    }
}

// Group bookmarks by video ID and fetch video titles
function groupBookmarksByVideo(bookmarks) {
    const groups = {};
    bookmarks.forEach(bookmark => {
        if (!groups[bookmark.videoId]) {
            groups[bookmark.videoId] = [];
        }
        groups[bookmark.videoId].push(bookmark);
    });
    return groups;
}

// Display bookmarks grouped by video
async function displayBookmarks(bookmarksByVideo) {
    const container = document.getElementById('bookmarks-container');
    container.innerHTML = '';

    for (const [videoId, bookmarks] of Object.entries(bookmarksByVideo)) {
        const videoSection = document.createElement('div');
        videoSection.className = 'video-section';
        
        // Sort bookmarks by timestamp
        bookmarks.sort((a, b) => a.timestamp - b.timestamp);

        // Use the saved video title if available
        const videoTitle = bookmarks[0]?.videoTitle || (await fetchVideoTitle(videoId));
        
        videoSection.innerHTML = `
            <h2 class="video-title">
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">
                    ${videoTitle || `Video: ${videoId}`}
                </a>
            </h2>
            <div class="video-bookmarks">
                ${bookmarks.map(bookmark => `
                    <div class="bookmark-card" data-id="${bookmark.id}">
                        <div class="bookmark-info">
                            <span class="bookmark-timestamp">${formatTimestamp(bookmark.timestamp)}</span>
                            <span class="bookmark-description">${bookmark.description || 'No description'}</span>
                        </div>
                        <div class="bookmark-actions">
                            <button class="jump-to-video" data-video-id="${videoId}" data-timestamp="${bookmark.timestamp}">
                                Jump to Video
                            </button>
                            <button class="delete-bookmark" data-bookmark-id="${bookmark.id}">
                                Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(videoSection);
    }

    // Attach event listeners after adding elements to DOM
    attachEventListeners();
}

// Fetch video title
async function fetchVideoTitle(videoId) {
    try {
        // Try to get from storage first
        const result = await chrome.storage.local.get({ videoTitles: {} });
        if (result.videoTitles[videoId]) {
            return result.videoTitles[videoId];
        }
        return `Video: ${videoId}`;
    } catch (error) {
        console.error('Error fetching video title:', error);
        return `Video: ${videoId}`;
    }
}

// Attach event listeners to buttons
function attachEventListeners() {
    // Jump to video buttons
    document.querySelectorAll('.jump-to-video').forEach(button => {
        button.addEventListener('click', (e) => {
            const videoId = e.target.dataset.videoId;
            const timestamp = parseFloat(e.target.dataset.timestamp);
            jumpToVideo(videoId, timestamp);
        });
    });

    // Delete bookmark buttons
    document.querySelectorAll('.delete-bookmark').forEach(button => {
        button.addEventListener('click', async (e) => {
            const bookmarkId = parseInt(e.target.dataset.bookmarkId);
            const card = e.target.closest('.bookmark-card');
            
            try {
                // Add deleting animation
                card.classList.add('deleting');
                
                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, 300));
                
                await deleteBookmark(bookmarkId);
                showToast('Bookmark deleted successfully', 'success');
            } catch (error) {
                card.classList.remove('deleting');
                showToast('Failed to delete bookmark');
            }
        });
    });
}

// Jump to specific timestamp in video
function jumpToVideo(videoId, timestamp) {
    const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(timestamp)}`;
    window.open(url, '_blank');
}

// Delete a bookmark
async function deleteBookmark(bookmarkId) {
    try {
        const result = await chrome.storage.local.get({ bookmarks: [] });
        const bookmarks = result.bookmarks.filter(b => b.id !== bookmarkId);
        
        await chrome.storage.local.set({ bookmarks });
        
        // Refresh the display
        await loadAllBookmarks();
    } catch (error) {
        console.error('Error deleting bookmark:', error);
        throw error; // Re-throw to be handled by the caller
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', loadAllBookmarks);