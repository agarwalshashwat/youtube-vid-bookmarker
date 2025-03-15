// Debug logging function
function debugLog(category, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[ContentScript][${category}][${timestamp}] ${message}`;
  console.log(logMessage, data ? data : '');
}

// Content script initialization
debugLog('Init', 'Content script loading');

let video = null;
let progressBar = null;
const KEYBOARD_SHORTCUT = 'Alt+B';

// Notify that content script is ready
chrome.runtime.sendMessage({ action: "contentScriptReady" }, response => {
  debugLog('Init', 'Sent contentScriptReady message', response);
});

// Initialize video element and progress bar observer
function initializeVideoObserver() {
  debugLog('Observer', 'Setting up video observer');
  const observer = new MutationObserver(() => {
    if (!video) {
      video = document.querySelector('video');
      if (video) {
        debugLog('Video', 'Video element found and initialized', { duration: video.duration });
        initializeProgressBar();
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize progress bar and set up markers container
function initializeProgressBar() {
  debugLog('ProgressBar', 'Setting up progress bar observer');
  const progressBarObserver = new MutationObserver(() => {
    progressBar = document.querySelector('.ytp-progress-bar');
    if (progressBar && !document.querySelector('.yt-bookmark-markers')) {
      debugLog('ProgressBar', 'Progress bar found, setting up markers');
      setupBookmarkMarkers();
    }
  });

  progressBarObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Set up bookmark markers container
function setupBookmarkMarkers() {
  debugLog('Markers', 'Creating markers container');
  const markersContainer = document.createElement('div');
  markersContainer.className = 'yt-bookmark-markers';
  markersContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  `;
  progressBar.appendChild(markersContainer);
  updateBookmarkMarkers();

  video.addEventListener('durationchange', () => {
    debugLog('Video', 'Duration changed', { newDuration: video.duration });
    updateBookmarkMarkers();
  });
}

// Update bookmark markers on the progress bar
function updateBookmarkMarkers() {
  if (!video || !progressBar) {
    debugLog('Markers', 'Cannot update markers - missing video or progress bar');
    return;
  }

  const videoId = new URLSearchParams(window.location.search).get('v');
  if (!videoId) {
    debugLog('Markers', 'Cannot update markers - no video ID found');
    return;
  }

  debugLog('Storage', 'Fetching bookmarks from storage');
  chrome.storage.local.get({ bookmarks: [] }, (result) => {
    const markersContainer = document.querySelector('.yt-bookmark-markers');
    if (!markersContainer) {
      debugLog('Markers', 'Cannot update markers - container not found');
      return;
    }

    markersContainer.innerHTML = '';
    const bookmarks = result.bookmarks.filter(b => b.videoId === videoId);
    debugLog('Markers', 'Found bookmarks for video', { count: bookmarks.length, videoId });

    const videoDuration = video.duration;
    bookmarks.forEach(bookmark => {
      const marker = document.createElement('div');
      marker.className = 'yt-bookmark-marker';
      marker.setAttribute('data-timestamp', bookmark.timestamp);
      marker.setAttribute('data-description', 
        `${formatTimestamp(bookmark.timestamp)} - ${bookmark.description || 'No description'}`);
      
      const position = (bookmark.timestamp / videoDuration) * 100;
      marker.style.left = `${position}%`;
      
      marker.style.pointerEvents = 'auto';
      marker.addEventListener('click', () => {
        debugLog('Marker', 'Marker clicked', { timestamp: bookmark.timestamp });
        marker.classList.add('clicked');
        video.currentTime = bookmark.timestamp;
        // Remove the clicked class after animation
        setTimeout(() => marker.classList.remove('clicked'), 600);
      });

      markersContainer.appendChild(marker);
    });
  });
}

// Format timestamp for tooltips
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Handle keyboard shortcuts
function handleKeyboardShortcut(event) {
  if (event.altKey && event.key.toLowerCase() === 'b') {
    chrome.runtime.sendMessage({ action: "openPopup" });
  }
}

// Initialize message listener for timestamp operations
function initializeMessageListener() {
  debugLog('Messaging', 'Setting up message listener');
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    debugLog('Messaging', 'Received message', { action: request.action, sender });

    if (request.action === "ping") {
      debugLog('Messaging', 'Received ping request');
      sendResponse({ status: "ready" });
      return true;
    }

    if (request.action === "getTimestamp") {
      if (!video) {
        video = document.querySelector('video');
      }
      
      if (!video) {
        debugLog('Video', 'Video element not found for getTimestamp');
        sendResponse({ timestamp: null, error: "Video element not found" });
        return true;
      }

      debugLog('Video', 'Getting current timestamp', { time: video.currentTime });
      sendResponse({ timestamp: video.currentTime });
      return true;
    }

    if (request.action === "setTimestamp") {
      if (!video) {
        video = document.querySelector('video');
      }
      
      if (video) {
        debugLog('Video', 'Setting timestamp', { timestamp: request.timestamp });
        video.currentTime = request.timestamp;
        video.play().catch(err => {
          debugLog('Video', 'Autoplay prevented', { error: err });
        });
      } else {
        debugLog('Video', 'Video element not found for setTimestamp');
      }
      sendResponse({});
      return true;
    }

    if (request.action === "bookmarkUpdated") {
      debugLog('Markers', 'Received bookmark update notification');
      updateBookmarkMarkers();
      sendResponse({});
      return true;
    }
  });
}

// Add styles for markers and tooltips
function injectStyles() {
  debugLog('Styles', 'Injecting marker styles');
  const style = document.createElement('style');
  style.textContent = `
    .yt-bookmark-marker {
      position: absolute;
      width: 3px;
      height: 100%;
      background-color: #4da1ee;
      z-index: 2;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 4px rgba(77, 161, 238, 0.5);
    }

    .yt-bookmark-marker:hover {
      transform: scaleX(2) scaleY(1.2);
      background-color: #75b0e7;
      box-shadow: 0 0 8px rgba(77, 161, 238, 0.8);
    }

    .yt-bookmark-marker::before {
      content: '';
      position: absolute;
      top: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 7px;
      height: 7px;
      background-color: #4da1ee;
      border-radius: 50%;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .yt-bookmark-marker:hover::before {
      opacity: 1;
      transform: translateX(-50%) scale(1.2);
      box-shadow: 0 0 6px rgba(77, 161, 238, 0.8);
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .yt-bookmark-marker:hover::after {
      visibility: visible;
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* Add ripple effect when marker is clicked */
    .yt-bookmark-marker.clicked {
      animation: ripple 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes ripple {
      0% {
        box-shadow: 0 0 0 0 rgba(77, 161, 238, 0.4);
      }
      100% {
        box-shadow: 0 0 0 10px rgba(77, 161, 238, 0);
      }
    }
  `;
  document.head.appendChild(style);
}

// Initialize when the page loads
function initialize() {
  debugLog('Init', 'Initializing content script');
  injectStyles();  // Add this line to inject styles
  initializeVideoObserver();
  initializeMessageListener();
  document.addEventListener('keydown', handleKeyboardShortcut);
  debugLog('Init', 'Content script initialized');
}

if (document.readyState === "loading") {
  debugLog('Init', 'Document still loading, waiting for DOMContentLoaded');
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  debugLog('Init', 'Document already loaded, initializing immediately');
  initialize();
}

// Cleanup on unload
window.addEventListener('unload', () => {
  debugLog('Cleanup', 'Performing cleanup');
  document.removeEventListener('keydown', handleKeyboardShortcut);
  if (video) {
    video.removeEventListener('durationchange', updateBookmarkMarkers);
  }
});
