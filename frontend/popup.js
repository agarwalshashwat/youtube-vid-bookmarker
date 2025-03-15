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

// Function to save a bookmark
function saveBookmark(bookmark) {
  chrome.storage.local.get({ bookmarks: [] }, (result) => {
    const bookmarks = result.bookmarks;
    const newBookmark = {
      ...bookmark,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    bookmarks.push(newBookmark);
    chrome.storage.local.set({ bookmarks }, () => {
      console.log("Bookmark saved:", newBookmark);
      loadBookmarks();
    });
  });
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
    chrome.storage.local.get({ bookmarks: [] }, (result) => {
      const bookmarks = result.bookmarks.filter(b => b.id !== parseInt(bookmarkId));
      chrome.storage.local.set({ bookmarks }, () => {
        console.log("Bookmark deleted:", bookmarkId);
        loadBookmarks(); // Refresh the list after deletion
      });
    });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    showError("Failed to delete bookmark");
  }
}

// Load and display bookmarks
async function loadBookmarks() {
  try {
    const tab = await getCurrentTab();
    if (!tab.url.includes("youtube.com/watch")) {
      return;
    }

    const videoId = extractVideoId(tab.url);
    if (!videoId) {
      return;
    }

    chrome.storage.local.get({ bookmarks: [] }, (result) => {
      const bookmarks = result.bookmarks
        .filter(b => b.videoId === videoId)
        .sort((a, b) => a.timestamp - b.timestamp);

      const bookmarkList = document.getElementById("bookmark-list");
      const loadingSpinner = bookmarkList.querySelector(".loading-spinner");
      
      if (loadingSpinner) {
        loadingSpinner.style.display = "none";
      }

      if (bookmarks.length === 0) {
        bookmarkList.innerHTML = '<div class="no-bookmarks">No bookmarks yet</div>';
        return;
      }

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
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteBookmark(bookmarkId);
        });

        // Timestamp navigation click
        bookmarkEl.addEventListener("click", (e) => {
          if (!e.target.classList.contains("delete-bookmark")) {
            chrome.tabs.sendMessage(tab.id, { 
              action: "setTimestamp", 
              timestamp: parseFloat(timestamp) 
            });
          }
        });
      });
    });
  } catch (error) {
    console.error("Error loading bookmarks:", error);
    showError("Failed to load bookmarks");
  }
}

// Initialize popup
document.addEventListener("DOMContentLoaded", () => {
  loadBookmarks();
  
  // Add bookmark button click handler
  document.getElementById("add-bookmark").addEventListener("click", async () => {
    try {
      const tab = await getCurrentTab();
      
      if (!tab.url.includes("youtube.com/watch")) {
        throw new Error("Please navigate to a YouTube video first!");
      }

      const videoId = extractVideoId(tab.url);
      if (!videoId) {
        throw new Error("Could not find a valid YouTube video ID");
      }

      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(
          tab.id, 
          { action: "getTimestamp" },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response && response.timestamp != null) {
        const description = document.getElementById("description").value;
        const bookmark = { videoId, timestamp: response.timestamp, description };
        saveBookmark(bookmark);
        document.getElementById("description").value = ""; // Clear input after saving
      } else {
        throw new Error("Could not get current video timestamp");
      }
    } catch (error) {
      console.error("Error:", error);
      showError(error.message);
    }
  });
});
