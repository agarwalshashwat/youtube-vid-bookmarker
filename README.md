# YouTube Video Bookmark Extension

A Chrome extension that allows users to create and manage timestamped bookmarks for YouTube videos with descriptions. Seamlessly save and jump to your favorite moments in any YouTube video—no backend required!

## Features

- **No Server Needed**: Works entirely within your browser using Chrome's local storage.
- **Visual Markers**: See your bookmarks directly on the YouTube progress bar.
- **Quick Add**: Keyboard shortcut (`Alt+B`) to quickly capture moments.
- **Smart Sorting**: Bookmarks are automatically sorted by timestamp.
- **Easy Navigation**: Click any bookmark or marker to jump to that moment.
- **Persistence**: Your bookmarks stay saved even after closing the browser.

## Project Structure

```
📦 youtube-video-bookmark
└── frontend/
    ├── manifest.json      # Extension configuration
    ├── popup.html        # Extension popup interface
    ├── popup.js         # Popup logic (saves to local storage)
    ├── content.js      # Injects markers into YouTube pages
    ├── bookmarks.html  # Full-page dashboard
    ├── bookmarks.js    # Dashboard logic
    ├── styles.css     # Common styling
    └── icon.png      # Extension icon
```

## Installation

### For Developers (Unpacked)
1. Clone this repository or download the source code.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right corner.
4. Click **"Load unpacked"**.
5. Select the `frontend` directory from this project.
6. The extension is now ready to use!

### For Public Sharing (Distribution)
To share this extension with others:
1. Zip the `frontend` folder.
2. Send the `.zip` file to the user.
3. They follow the "For Developers" steps above, selecting the unzipped folder.

## Usage

1. Open any YouTube video.
2. **Add a Bookmark**:
   - Click the extension icon and enter a description.
   - Or use the keyboard shortcut `Alt+B`.
3. **Navigate**:
   - Click a bookmark in the popup list.
   - Click a marker (blue line) on the YouTube progress bar.
   - Open the "View All Bookmarks" page for a full dashboard.
4. **Delete**: Click the "Delete" button next to any bookmark.

## Technical Details

- **Manifest V3**: Uses the latest Chrome extension standards.
- **Storage**: `chrome.storage.local` ensures data persists without a backend.
- **DOM Injection**: `content.js` dynamically adds CSS and HTML elements to the YouTube UI.
- **Message Passing**: Coordinates timestamp data between the popup and the video player.

## License

This project is licensed under the MIT License.
