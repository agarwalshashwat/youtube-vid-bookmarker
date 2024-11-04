const express = require("express");
const cors = require("cors"); // Import CORS middleware
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let bookmarks = [];

// Fetch all bookmarks for a specific video
app.get("/bookmarks/:videoId", (req, res) => {
  const { videoId } = req.params;
  const videoBookmarks = bookmarks.filter(b => b.videoId === videoId);
  res.json(videoBookmarks);
});

// Add a new bookmark
app.post("/bookmarks", (req, res) => {
  const { videoId, timestamp, description } = req.body;
  if (videoId && timestamp) {
    const newBookmark = {
      id: bookmarks.length + 1,
      videoId,
      timestamp,
      description: description || ""
    };
    bookmarks.push(newBookmark);
    res.status(201).json(newBookmark);
  } else {
    res.status(400).json({ message: "videoId and timestamp are required." });
  }
});

// Delete a bookmark by ID
app.delete("/bookmarks/:id", (req, res) => {
  const bookmarkId = parseInt(req.params.id);
  const index = bookmarks.findIndex(b => b.id === bookmarkId);
  if (index !== -1) {
    const removedBookmark = bookmarks.splice(index, 1);
    res.json(removedBookmark[0]);
  } else {
    res.status(404).json({ message: "Bookmark not found." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
