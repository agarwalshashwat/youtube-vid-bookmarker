// Content script initialization
console.log("YouTube Bookmarker: Content script loaded");

let video = null;
const KEYBOARD_SHORTCUT = 'Alt+B'; // Keyboard shortcut to add bookmark

// Initialize video element observer
function initializeVideoObserver() {
  const observer = new MutationObserver(() => {
    if (!video) {
      video = document.querySelector('video');
      if (video) {
        console.log("Video element found and initialized");
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Handle keyboard shortcuts
function handleKeyboardShortcut(event) {
  // Alt+B to add bookmark
  if (event.altKey && event.key.toLowerCase() === 'b') {
    chrome.runtime.sendMessage({ action: "openPopup" });
  }
}

// Initialize message listener for timestamp operations
function initializeMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received:", request);

    if (request.action === "getTimestamp") {
      if (!video) {
        video = document.querySelector('video');
      }
      
      if (!video) {
        console.log("Video element not found");
        sendResponse({ timestamp: null });
        return true;
      }

      console.log("Current time:", video.currentTime);
      sendResponse({ timestamp: video.currentTime });
      return true;
    }

    if (request.action === "setTimestamp") {
      if (!video) {
        video = document.querySelector('video');
      }
      
      if (video) {
        video.currentTime = request.timestamp;
        // Ensure video plays after seeking
        video.play().catch(err => console.log("Autoplay prevented:", err));
      }
      sendResponse({});
      return true;
    }
  });
}

// Initialize when the page loads
function initialize() {
  initializeVideoObserver();
  initializeMessageListener();
  document.addEventListener('keydown', handleKeyboardShortcut);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

// Cleanup on unload
window.addEventListener('unload', () => {
  document.removeEventListener('keydown', handleKeyboardShortcut);
});
