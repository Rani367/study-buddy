# Study Buddy

A Chrome extension that helps you study by providing AI-powered explanations and answers while you browse.

## Features

- Floating "Need Help?" button on every page
- Detects questions on webpages automatically
- Summarize articles and explain concepts
- Quiz yourself on page content
- Works with PDFs
- Right-click any text to ask questions
- Chat history saved per page

## Setup

You'll need a backend API server running. The extension expects it at `http://localhost:3000/api/chat` by default.

### Install the Extension

1. Go to `chrome://extensions/`
2. Turn on "Developer mode"
3. Click "Load unpacked" and select this folder
4. Make sure your API server is running

### Configure API URL

Edit `API_URL` in [popup.js](popup.js:2) to point to your server. Don't forget to update `host_permissions` in [manifest.json](manifest.json) too.

## Usage

Click the floating "Need Help?" button on any page, or click the extension icon in your toolbar. The AI will read the page content and help you understand it.

Use the quick action buttons to explain, summarize, or quiz yourself on the page. Or just type your own questions in the chat.

## Project Structure

```
study-buddy/
├── manifest.json      # Extension config
├── popup.html/js      # Main popup interface
├── content.js         # Runs on webpages
├── pdf-content.js     # PDF support
├── content.css        # Floating button styles
├── background.js      # Service worker
└── icons/             # Extension icons
```

## Troubleshooting

**Can't connect to API**: Make sure your server is running and the URL in [popup.js](popup.js:2) is correct.

**Button not showing**: Reload the page after installing the extension.

**Extension not working**: Check for errors at `chrome://extensions/` and reload the extension.

## API Format

Your server should accept POST requests to `/api/chat`:

**Request:**
```json
{
  "message": "What is photosynthesis?"
}
```

**Response:**
```json
{
  "response": "Photosynthesis is the process..."
}
```

## License

MIT - Feel free to use this for your own projects!
