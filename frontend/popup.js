function extractVideoId(url) {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('v');
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Helper function to format timestamp
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Debug logging function
function debugLog(category, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[Popup][${category}][${timestamp}] ${message}`;
  console.log(logMessage, data ? data : '');
}

// Helper function to wrap Chrome messaging with proper error handling
function sendMessageToTab(tabId, message) {
  debugLog('Messaging', 'Sending message to tab', { tabId, message });
  return new Promise(async (resolve, reject) => {
    try {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message || "Failed to communicate with the page";
          debugLog('Messaging', 'Message send failed', { error });
          reject(new Error(error));
        } else if (response && response.error) {
          debugLog('Messaging', 'Received error response', response);
          reject(new Error(response.error));
        } else {
          debugLog('Messaging', 'Message sent successfully', { response });
          resolve(response);
        }
      });
    } catch (error) {
      debugLog('Messaging', 'Exception during message send', { error: error.message });
      reject(error);
    }
  });
}

// Helper function to wrap Chrome storage operations
function storageGet(key) {
  debugLog('Storage', 'Reading from storage', { key });
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          debugLog('Storage', 'Storage read failed', { error: chrome.runtime.lastError });
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          debugLog('Storage', 'Storage read successful', { result });
          resolve(result);
        }
      });
    } catch (error) {
      debugLog('Storage', 'Exception during storage read', { error: error.message });
      reject(error);
    }
  });
}

function storageSet(data) {
  debugLog('Storage', 'Writing to storage', { data });
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          debugLog('Storage', 'Storage write failed', { error: chrome.runtime.lastError });
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          debugLog('Storage', 'Storage write successful');
          resolve();
        }
      });
    } catch (error) {
      debugLog('Storage', 'Exception during storage write', { error: error.message });
      reject(error);
    }
  });
}

// Helper function to check if content script is ready with retries
async function waitForContentScript(tabId, maxRetries = 3, delay = 1000) {
  debugLog('Connection', 'Checking content script status', { tabId, maxRetries, delay });
  for (let i = 0; i < maxRetries; i++) {
    try {
      debugLog('Connection', `Attempt ${i + 1} to connect to content script`);
      const response = await sendMessageToTab(tabId, { action: "ping" });
      if (response && response.status === "ready") {
        debugLog('Connection', 'Content script is ready');
        return true;
      }
      debugLog('Connection', 'Invalid response from content script', response);
    } catch (error) {
      debugLog('Connection', `Attempt ${i + 1} failed`, { error: error.message });
      if (i < maxRetries - 1) {
        debugLog('Connection', `Waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error("Content script not available. Please refresh the YouTube page.");
}

// Function to save a bookmark
async function saveBookmark(bookmark) {
  try {
    debugLog('Bookmarks', 'Saving new bookmark', bookmark);
    const tab = await getCurrentTab();
    await waitForContentScript(tab.id);
    
    // Get the video title
    const result = await storageGet({ bookmarks: [], videoTitles: {} });
    const bookmarks = result.bookmarks;
    const videoTitles = result.videoTitles;
    
    const newBookmark = {
      ...bookmark,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      videoTitle: videoTitles[bookmark.videoId] || null
    };
    
    bookmarks.push(newBookmark);
    await storageSet({ bookmarks });
    
    debugLog('Bookmarks', 'Bookmark saved successfully', newBookmark);
    await loadBookmarks();
    
    // Notify content script to update markers
    await sendMessageToTab(tab.id, { action: "bookmarkUpdated" });
  } catch (error) {
    debugLog('Bookmarks', 'Failed to save bookmark', { error: error.message });
    showError("Failed to save bookmark: " + error.message);
  }
}

// Function to show error message with auto-cleanup
function showError(message, duration = 3000) {
  const errorElement = document.getElementById("error-message");
  errorElement.textContent = message;
  errorElement.classList.add("show");
  errorElement.classList.remove("hide");

  setTimeout(() => {
    errorElement.classList.add("hide");
    errorElement.classList.remove("show");
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 300); // Match the CSS transition duration
  }, duration);
}

// Function to delete a bookmark
async function deleteBookmark(bookmarkId) {
  try {
    debugLog('Bookmarks', 'Deleting bookmark', { bookmarkId });
    const tab = await getCurrentTab();
    await waitForContentScript(tab.id);
    
    const result = await storageGet({ bookmarks: [] });
    const bookmarks = result.bookmarks.filter(b => b.id !== parseInt(bookmarkId));
    
    await storageSet({ bookmarks });
    debugLog('Bookmarks', 'Bookmark deleted successfully');
    
    await loadBookmarks();
    await sendMessageToTab(tab.id, { action: "bookmarkUpdated" });
  } catch (error) {
    debugLog('Bookmarks', 'Failed to delete bookmark', { error: error.message });
    showError("Failed to delete bookmark: " + error.message);
  }
}

// Load and display bookmarks
async function loadBookmarks() {
  try {
    debugLog('Bookmarks', 'Loading bookmarks');
    const tab = await getCurrentTab();
    if (!tab.url.includes("youtube.com/watch")) {
      debugLog('Bookmarks', 'Not on a YouTube video page');
      return;
    }

    const videoId = extractVideoId(tab.url);
    if (!videoId) {
      debugLog('Bookmarks', 'No video ID found');
      return;
    }

    debugLog('Bookmarks', 'Checking content script status');
    await waitForContentScript(tab.id);

    const result = await storageGet({ bookmarks: [] });
    const bookmarks = result.bookmarks
      .filter(b => b.videoId === videoId)
      .sort((a, b) => a.timestamp - b.timestamp);

    debugLog('Bookmarks', 'Found bookmarks for video', { 
      count: bookmarks.length, 
      videoId 
    });

    const bookmarkList = document.getElementById("bookmark-list");
    const loadingSpinner = bookmarkList.querySelector(".loading-spinner");
    
    if (loadingSpinner) {
      loadingSpinner.style.display = "none";
    }

    if (bookmarks.length === 0) {
      debugLog('UI', 'No bookmarks to display');
      bookmarkList.innerHTML = '<div class="no-bookmarks">No bookmarks yet</div>';
      return;
    }

    debugLog('UI', 'Rendering bookmarks');
    bookmarkList.innerHTML = bookmarks.map(b => `
      <div class="bookmark" 
           data-timestamp="${b.timestamp}" 
           data-id="${b.id}"
           title="${b.description || 'No description'}">
        <span>${formatTimestamp(b.timestamp)} - ${b.description || "No description"}</span>
        <button class="delete-bookmark" aria-label="Delete bookmark">Delete</button>
      </div>
    `).join("");

    // Add event listeners for bookmarks
    document.querySelectorAll(".bookmark").forEach(bookmarkEl => {
      const deleteBtn = bookmarkEl.querySelector(".delete-bookmark");
      const bookmarkId = bookmarkEl.getAttribute("data-id");
      const timestamp = bookmarkEl.getAttribute("data-timestamp");

      // Delete button click
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await deleteBookmark(bookmarkId);
      });

      // Timestamp navigation click
      bookmarkEl.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("delete-bookmark")) {
          const currentTab = await getCurrentTab();
          await handleBookmarkClick(currentTab, timestamp);
        }
      });
    });
  } catch (error) {
    debugLog('Bookmarks', 'Error loading bookmarks', { error: error.message });
    console.error("Error loading bookmarks:", error);
    showError("Failed to load bookmarks: " + error.message);
  }
}

// Update the bookmark click handler
async function handleBookmarkClick(tab, timestamp) {
  try {
    await waitForContentScript(tab.id);
    await sendMessageToTab(tab.id, { 
      action: "setTimestamp", 
      timestamp: parseFloat(timestamp) 
    });
  } catch (error) {
    debugLog('Bookmarks', 'Error setting timestamp', { error: error.message });
    console.error("Error setting timestamp:", error);
    showError("Failed to navigate to timestamp: " + error.message);
  }
}

// Initialize popup
document.addEventListener("DOMContentLoaded", () => {
  debugLog('Init', 'Popup opened');
  loadBookmarks();
  
  // Add bookmark button click handler
  document.getElementById("add-bookmark").addEventListener("click", async () => {
    try {
      debugLog('UI', 'Add bookmark button clicked');
      const tab = await getCurrentTab();
      
      if (!tab.url.includes("youtube.com/watch")) {
        throw new Error("Please navigate to a YouTube video first!");
      }

      const videoId = extractVideoId(tab.url);
      if (!videoId) {
        throw new Error("Could not find a valid YouTube video ID");
      }

      debugLog('Bookmarks', 'Getting current timestamp');
      await waitForContentScript(tab.id);
      const response = await sendMessageToTab(tab.id, { action: "getTimestamp" });

      if (response && response.timestamp != null) {
        const description = document.getElementById("description").value;
        const bookmark = { videoId, timestamp: response.timestamp, description };
        await saveBookmark(bookmark);
        document.getElementById("description").value = ""; // Clear input after saving
      } else {
        throw new Error("Could not get current video timestamp");
      }
    } catch (error) {
      debugLog('Error', 'Failed to add bookmark', { error: error.message });
      console.error("Error:", error);
      showError(error.message);
    }
  });

  // Add handler for View All Bookmarks link
  document.getElementById('view-all-bookmarks').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: chrome.runtime.getURL('bookmarks.html')
    });
  });
});
