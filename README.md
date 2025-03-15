# YouTube Video Bookmark Extension

A Chrome extension that allows users to create and manage timestamped bookmarks for YouTube videos with descriptions. Seamlessly save and jump to your favorite moments in any YouTube video.

## Features

- Create bookmarks at specific timestamps in YouTube videos with custom descriptions
- Quick navigation between bookmarks with a single click
- Keyboard shortcut (Alt+B) to quickly add bookmarks
- Error handling with user-friendly messages
- Persistent storage of bookmarks using Chrome's local storage
- Smooth animations and intuitive user interface
- Real-time bookmark updates
- Automatically sorts bookmarks by timestamp
- Tooltip descriptions on hover
- Delete bookmarks with a single click

## Project Structure

```
📦 youtube-video-bookmark
├── backend/
│   ├── index.js           # Express server for bookmark storage
│   ├── videoBookmarks.js  # YouTube player integration
│   └── data/
│       └── bookmarks.json # Persistent storage file
└── frontend/
    ├── manifest.json      # Chrome extension configuration
    ├── popup.html        # Extension popup interface
    ├── popup.js         # Popup functionality
    ├── content.js      # YouTube page integration
    ├── styles.css     # UI styling
    └── icon.png      # Extension icon
```

## Prerequisites

- Node.js (v12 or higher)
- Google Chrome browser
- npm (Node Package Manager)

## Installation

### Backend Setup
1. Clone this repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Or for production:
   ```bash
   npm start
   ```

### Extension Setup
1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `frontend` directory from this project
6. The extension icon should appear in your Chrome toolbar

## Usage

1. Navigate to any YouTube video
2. You can add bookmarks in two ways:
   - Click the extension icon and use the "Add Bookmark" button
   - Use the keyboard shortcut `Alt+B`
3. Optional: Add a description for your bookmark
4. Your bookmarks will appear in a list, sorted by timestamp
5. Click any bookmark to jump to that timestamp in the video
6. Hover over bookmarks to see full descriptions
7. Use the delete button to remove unwanted bookmarks

## Technical Details

### Frontend
- Built using vanilla JavaScript, HTML, and CSS
- Uses Chrome Extension Manifest V3
- Features:
  - Real-time video timestamp tracking
  - Chrome storage API for persistence
  - Content script for YouTube video interaction
  - Message passing between extension and content script
  - Responsive popup interface
  - Error handling with user feedback

### Backend
- Node.js with Express
- Features:
  - RESTful API endpoints for CRUD operations
  - File-based persistence
  - CORS enabled for extension access
  - Error handling middleware
  - Async/await for clean asynchronous code

## Development

To start development:

1. Run the backend in development mode:
   ```bash
   npm run dev
   ```
2. Make changes to frontend files
3. Reload the extension from `chrome://extensions/`
4. Changes to content.js require a page refresh

## Error Handling

The extension includes comprehensive error handling for:
- Invalid YouTube URLs
- Video loading issues
- Storage failures
- Network connectivity problems
- API communication errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the Chrome Extensions API documentation
- YouTube IFrame API for video control
- Express.js team for the backend framework
