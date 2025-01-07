function extractVideoId(url) {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('v');
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

document.getElementById("add-bookmark").addEventListener("click", async () => {
  const tab = await getCurrentTab();
  
  if (!tab.url.includes("youtube.com/watch")) {
    alert("Please navigate to a YouTube video first!");
    return;
  }

  const videoId = extractVideoId(tab.url);
  
  if (!videoId) {
    alert("Could not find a valid YouTube video ID");
    return;
  }

  try {
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
  
      loadBookmarks(videoId);
    } else {
      throw new Error("Invalid response from content script");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Please refresh the YouTube page and try again.");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const tab = await getCurrentTab();
  
  if (tab.url.includes("youtube.com/watch")) {
    const videoId = extractVideoId(tab.url);
    if (videoId) {
      loadBookmarks(videoId);
    }
  }
});
  
// Load and display bookmarks with clickable links to jump to timestamps and delete buttons
async function loadBookmarks(videoId) {
  chrome.storage.local.get({ bookmarks: [] }, (result) => {
    const bookmarks = result.bookmarks;
    const bookmarkList = document.getElementById("bookmark-list");

    bookmarkList.innerHTML = bookmarks.map(b => `
      <div class="bookmark" data-timestamp="${b.timestamp}" data-id="${b.id}">
        <span>${formatTimestamp(b.timestamp)} - ${b.description || "No description"}</span>
        <button class="delete-bookmark">Delete</button>
      </div>
    `).join("");

    // Add click event to each bookmark to jump to the specified timestamp
    document.querySelectorAll(".bookmark").forEach(bookmarkEl => {
      bookmarkEl.addEventListener("click", async (event) => {
        if (event.target.classList.contains("delete-bookmark")) {
          const bookmarkId = bookmarkEl.getAttribute("data-id");
          deleteBookmark(bookmarkId);
          bookmarkEl.remove();
        } else {
          const timestamp = bookmarkEl.getAttribute("data-timestamp");
          chrome.tabs.sendMessage(tab.id, { action: "setTimestamp", timestamp: parseFloat(timestamp) });
        }
      });
    });
  });
}

// Helper function to format timestamp (e.g., 123 -> "02:03")
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Function to save a bookmark
function saveBookmark(bookmark) {
  chrome.storage.local.get({ bookmarks: [] }, (result) => {
    const bookmarks = result.bookmarks;
    bookmarks.push(bookmark);
    chrome.storage.local.set({ bookmarks: bookmarks }, () => {
      console.log("Bookmark saved:", bookmark);
    });
  });
}

// Function to delete a bookmark
function deleteBookmark(bookmarkId) {
  chrome.storage.local.get({ bookmarks: [] }, (result) => {
    const bookmarks = result.bookmarks.filter(b => b.id !== parseInt(bookmarkId));
    chrome.storage.local.set({ bookmarks: bookmarks }, () => {
      console.log("Bookmark deleted:", bookmarkId);
    });
  });
}

// Function to load bookmarks
function loadBookmarks() {
  chrome.storage.local.get({ bookmarks: [] }, (result) => {
    const bookmarks = result.bookmarks;
    // Render bookmarks in the UI
    renderBookmarks(bookmarks);
  });
}

// Function to render bookmarks in the UI
function renderBookmarks(bookmarks) {
  const bookmarkList = document.getElementById("bookmark-list");
  bookmarkList.innerHTML = ""; // Clear existing bookmarks

  bookmarks.forEach((bookmark) => {
    const bookmarkEl = document.createElement("div");
    bookmarkEl.className = "bookmark";
    bookmarkEl.setAttribute("data-timestamp", bookmark.timestamp);
    bookmarkEl.setAttribute("data-id", bookmark.id);
    bookmarkEl.innerHTML = `
      <span>${formatTimestamp(bookmark.timestamp)} - ${bookmark.description || "No description"}</span>
      <button class="delete-bookmark">Delete</button>
    `;

    // Add click event handlers
    const deleteBtn = bookmarkEl.querySelector('.delete-bookmark');
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent bookmark click event
      const bookmarkId = bookmark.id;
      deleteBookmark(bookmarkId);
      bookmarkEl.remove();
    });

    // Add timestamp click event
    bookmarkEl.addEventListener("click", () => {
      const timestamp = bookmark.timestamp;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "setTimestamp", timestamp: parseFloat(timestamp) });
      });
    });

    bookmarkList.appendChild(bookmarkEl);
  });
}
