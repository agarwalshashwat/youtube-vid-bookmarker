// Add this to ensure the script is initialized
console.log("YouTube Bookmarker: Content script loaded");

// Initialize message listener
function initializeMessageListener() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received:", request);

    if (request.action === "getTimestamp") {
      const video = document.querySelector('video');
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
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = request.timestamp;
      }
      return true;
    }
  });
}

// Initialize when the page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeMessageListener);
} else {
  initializeMessageListener();
}
  