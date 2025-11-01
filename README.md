# Study Buddy AI - Chrome Extension

An AI-powered study assistant Chrome extension that helps you understand content on any webpage. Study Buddy can detect questions on pages, provide explanations, summarize content, and quiz you on key concepts.

## Features

- **Automatic Question Detection**: Detects questions on the current webpage and offers instant help
- **Context-Aware AI**: Understands the page content and provides relevant answers
- **Floating Help Button**: Quick access to AI assistance from any page
- **Smart Features**:
  - Explain page content
  - Summarize articles
  - Quiz yourself on concepts
  - Ask custom questions
- **PDF Support**: Extract and analyze content from PDF documents
- **Inline Chat Widget**: Click "Need Help?" to open chat directly on the page
- **Chat History**: Saves your conversations per page
- **Right-click Context Menu**: Ask AI about selected text
- **Intelligent Content Extraction**: Automatically detects main article content, ignoring navigation and ads

## Prerequisites

Before installing the extension, you need to have the AI API running:

1. **API Server**: This extension requires a backend API (like the one from the Chrome Extension Guide)
2. **Default API URL**: `http://localhost:3000/api/chat`

## Installation

### 1. Generate Icons

First, create the extension icons:

1. Open [create-icons.html](create-icons.html) in your browser
2. Click each download button to save the icons
3. Save the files in the `icons/` folder as:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right corner)
3. Click **Load unpacked**
4. Select the `study-buddy` folder
5. The extension icon should appear in your Chrome toolbar

### 3. Start Your API Server

Make sure your AI API server is running on `http://localhost:3000`:

```bash
# Navigate to your API project directory
cd /path/to/your/api

# Start the development server
npm run dev
```

## Usage

### Method 1: Floating "Need Help?" Button (Recommended)

1. Browse to any webpage
2. Look for the floating "Need Help?" button in the bottom-right corner
3. Click it to open an inline chat widget directly on the page
4. The AI will automatically detect questions on the page (if any)
5. Click outside the widget or the button again to close it

### Method 2: Extension Icon

1. Click the Study Buddy icon in your Chrome toolbar
2. The popup will open with page context already loaded

### Method 3: Right-Click Context Menu

1. Select any text on a webpage
2. Right-click and choose "Ask Study Buddy: [selected text]"
3. The extension popup will open with your question ready

## Features in Detail

### Detected Questions

When Study Buddy detects questions on the page, they appear in a yellow section at the top. Click any question to get instant AI assistance.

### Quick Actions

Three quick-action buttons for common tasks:

- **Explain this page**: Get an overview of the page content
- **Summarize**: Get a brief summary of the main points
- **Quiz me**: Test your understanding with AI-generated questions

### Custom Questions

Type any question in the chat input to get context-aware answers based on the current page content.

## File Structure

```
study-buddy/
├── manifest.json           # Extension configuration
├── popup.html             # Main popup UI
├── popup.js               # Popup logic and AI integration
├── styles.css             # Popup styles
├── content.js             # Content script (runs on all pages)
├── pdf-content.js         # PDF-specific content extraction
├── content.css            # Floating button and inline widget styles
├── background.js          # Background service worker
├── create-icons.html      # Icon generator tool
├── .gitignore             # Git ignore file
├── icons/
│   ├── icon16.png        # 16x16 toolbar icon
│   ├── icon48.png        # 48x48 extension management icon
│   └── icon128.png       # 128x128 Chrome Web Store icon
├── CHROME_EXTENSION_GUIDE.md  # Extension development guide
├── SYSTEM_PROMPT.md       # System prompt documentation
├── INLINE_CHAT.md         # Inline chat feature documentation
└── README.md              # This file
```

## Configuration

### Changing the API URL

To use a different API URL (e.g., production server):

1. Open [popup.js](popup.js)
2. Change line 2:
   ```javascript
   const API_URL = 'https://your-production-api.com/api/chat';
   ```
3. Update [manifest.json](manifest.json) `host_permissions`:
   ```json
   "host_permissions": [
     "https://your-production-api.com/*"
   ]
   ```
4. Reload the extension in `chrome://extensions/`

## Troubleshooting

### Extension can't connect to API

**Problem**: "Error: Failed to fetch" or connection errors

**Solutions**:
- Verify API server is running: `curl http://localhost:3000/api/chat`
- Check `host_permissions` in [manifest.json](manifest.json)
- Look for CORS errors in DevTools Console

### No questions detected

**Problem**: Yellow question section doesn't appear

**Explanation**: This is normal! The extension only shows detected questions if it finds question marks or question patterns on the page. You can still use all other features.

### Popup doesn't open

**Problem**: Clicking extension icon does nothing

**Solutions**:
- Check for errors in `chrome://extensions/` (click "Errors" button)
- Right-click the extension popup and select "Inspect" to see Console errors
- Reload the extension

### Icons not showing

**Problem**: Extension shows default puzzle piece icon

**Solution**: Generate icons using [create-icons.html](create-icons.html) and save them in the `icons/` folder

### Floating button not appearing

**Problem**: "Need Help?" button doesn't show on pages

**Solutions**:
- Reload the webpage after installing the extension
- Check if the page blocks content scripts (some sites do this)
- Inspect the page and look for console errors

## Development

### Testing

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Study Buddy card
4. Reload any pages where you're testing

### Debugging

**Popup debugging**:
- Right-click the extension popup → "Inspect"
- Console logs and errors appear in DevTools

**Content script debugging**:
- Right-click on any webpage → "Inspect"
- Check Console for content script errors
- Logs from [content.js](content.js) appear here

**Background script debugging**:
- Go to `chrome://extensions/`
- Click "Inspect views: service worker"
- View background script logs

## API Requirements

Your API endpoint should:

- Accept POST requests to `/api/chat`
- Accept JSON body: `{ "message": "user question" }`
- Return JSON: `{ "response": "AI answer" }`
- Handle CORS if extension and API are on different domains

Example API response:
```json
{
  "response": "The capital of France is Paris.",
  "model": "llama-3.3-70b-versatile"
}
```

## Privacy & Security

- All data stays between your browser and your API server
- Chat history is stored locally in Chrome storage
- No data is sent to third parties
- API keys should be stored server-side, never in the extension

## Recent Improvements

- ✅ **PDF Support**: Full support for extracting and analyzing PDF content
- ✅ **Inline Chat Widget**: Opens directly on the page without needing toolbar
- ✅ **Intelligent Content Extraction**: Automatically detects main article content
- ✅ **Improved Question Detection**: Filters out false positives and navigation items
- ✅ **Concise AI Responses**: System prompt optimized for direct, focused answers
- ✅ **Enhanced Summarization**: Provides detailed bullet points and key facts

## Future Enhancements

Potential features to add:

- [ ] Flashcard generation from page content
- [ ] Export chat history
- [ ] Multiple AI model selection
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Voice input
- [ ] Language translation
- [ ] Video transcript analysis
- [ ] Resizable and draggable inline widget

## Publishing to Chrome Web Store

To publish this extension:

1. Create high-quality icons (128x128 minimum)
2. Update API URL to production server
3. Test thoroughly
4. Create a ZIP of the extension folder
5. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
6. Pay $5 one-time developer fee
7. Upload and submit for review

## License

This is a study project. Feel free to modify and use for your own learning!

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [CHROME_EXTENSION_GUIDE.md](CHROME_EXTENSION_GUIDE.md)
3. Check browser console for error messages

## Credits

Built using:
- Chrome Extension Manifest V3
- AI API (Groq/OpenAI compatible)
- Modern JavaScript (ES6+)
- Vanilla CSS (no frameworks)

---

Happy studying with AI assistance!
