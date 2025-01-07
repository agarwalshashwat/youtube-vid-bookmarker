# YouTube Video Bookmark Extension

A Chrome extension that allows users to create and manage timestamped bookmarks for YouTube videos.

## Features

- Create bookmarks at specific timestamps in YouTube videos
- Quick navigation between bookmarks
- Persistent storage of bookmarks
- Simple and intuitive user interface

## Project Structure

```
📦 youtube-video-bookmark
├── backend/
│   └── index.js
└── frontend/
    ├── manifest.json
    ├── popup.html
    ├── popup.js
    ├── styles.css
    └── content.js
```

## Installation

### Backend Setup
1. Navigate to the backend directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

### Extension Setup
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `frontend` directory

## Development

### Backend
- Node.js server for storing bookmark data
- RESTful API endpoints for CRUD operations

### Frontend
- Chrome Extension built with HTML, CSS, and JavaScript
- Content script for YouTube video interaction
- Popup interface for bookmark management

## Usage

1. Navigate to any YouTube video
2. Click the extension icon in Chrome
3. Use the "Add Bookmark" button at desired timestamps
4. Click on saved bookmarks to jump to specific times

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
