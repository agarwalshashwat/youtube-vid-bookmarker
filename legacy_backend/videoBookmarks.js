const player = document.getElementById('player');
const bookmarksList = document.getElementById('bookmarks-list');
const videoId = new URLSearchParams(window.location.search).get('v') || '';

// Fetch bookmarks from API
async function fetchBookmarks() {
    try {
        const response = await fetch(`http://localhost:3000/bookmarks/${videoId}`);
        const bookmarks = await response.json();
        displayBookmarks(bookmarks);
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
    }
}

// Display bookmarks in the list
function displayBookmarks(bookmarks) {
    bookmarksList.innerHTML = '';
    bookmarks
        .sort((a, b) => a.timestamp - b.timestamp)
        .forEach(bookmark => {
            const li = document.createElement('li');
            li.className = 'bookmark-item';
            li.innerHTML = `
                <span class="timestamp">${formatTime(bookmark.timestamp)}</span>
                <span class="description">${bookmark.description || 'No description'}</span>
                <button onclick="seekTo(${bookmark.timestamp})">Jump to</button>
            `;
            bookmarksList.appendChild(li);
        });
}

// Format seconds to MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Seek to specific timestamp
function seekTo(timestamp) {
    if (player) {
        player.seekTo(timestamp);
        player.playVideo();
    }
}

// Add new bookmark
async function addBookmark() {
    const timestamp = Math.floor(player.getCurrentTime());
    const description = prompt('Enter bookmark description:');
    
    try {
        const response = await fetch('http://localhost:3000/bookmarks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                videoId,
                timestamp,
                description
            })
        });
        
        if (response.ok) {
            fetchBookmarks();
        }
    } catch (error) {
        console.error('Error adding bookmark:', error);
    }
}

// Initialize YouTube player
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: videoId,
        events: {
            'onReady': () => fetchBookmarks()
        }
    });
}

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(tag);