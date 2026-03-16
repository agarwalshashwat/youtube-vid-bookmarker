const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const BOOKMARKS_FILE = path.join(__dirname, 'bookmarks.json');

// Load bookmarks from file
async function loadBookmarks() {
  try {
    const data = await fs.readFile(BOOKMARKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    throw error;
  }
}

// Save bookmarks to file
async function saveBookmarks(bookmarks) {
  await fs.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2));
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Fetch all bookmarks for a specific video
app.get("/bookmarks/:videoId", async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const bookmarks = await loadBookmarks();
    const videoBookmarks = bookmarks.filter(b => b.videoId === videoId);
    res.json(videoBookmarks);
  } catch (error) {
    next(error);
  }
});

// Add a new bookmark
app.post("/bookmarks", async (req, res, next) => {
  try {
    const { videoId, timestamp, description } = req.body;
    if (!videoId || timestamp == null) {
      return res.status(400).json({ error: "videoId and timestamp are required." });
    }

    const bookmarks = await loadBookmarks();
    const newBookmark = {
      id: Date.now(),
      videoId,
      timestamp,
      description: description || "",
      createdAt: new Date().toISOString()
    };
    
    bookmarks.push(newBookmark);
    await saveBookmarks(bookmarks);
    res.status(201).json(newBookmark);
  } catch (error) {
    next(error);
  }
});

// Delete a bookmark by ID
app.delete("/bookmarks/:id", async (req, res, next) => {
  try {
    const bookmarkId = parseInt(req.params.id);
    const bookmarks = await loadBookmarks();
    const index = bookmarks.findIndex(b => b.id === bookmarkId);
    
    if (index === -1) {
      return res.status(404).json({ error: "Bookmark not found." });
    }
    
    const removedBookmark = bookmarks.splice(index, 1)[0];
    await saveBookmarks(bookmarks);
    res.json(removedBookmark);
  } catch (error) {
    next(error);
  }
});

// Update a bookmark
app.put("/bookmarks/:id", async (req, res, next) => {
  try {
    const bookmarkId = parseInt(req.params.id);
    const { description } = req.body;
    const bookmarks = await loadBookmarks();
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    
    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found." });
    }
    
    bookmark.description = description;
    await saveBookmarks(bookmarks);
    res.json(bookmark);
  } catch (error) {
    next(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
