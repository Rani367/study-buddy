# Quick Start Guide - Study Buddy AI

## Immediate Setup (No Icons Needed)

The extension will work without custom icons (Chrome will use a default icon). Follow these steps:

### Step 1: Fix the Icon Issue Temporarily

**Option A: Use the HTML Icon Generator (Recommended)**

1. Open [create-icons.html](create-icons.html) in Chrome
2. Click each "Download" button to save the PNG files
3. Move the downloaded files to the `icons/` folder:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

**Option B: Remove Icon References (Quick Test)**

Temporarily comment out the icon references in [manifest.json](manifest.json) to test without icons:

```json
{
  "manifest_version": 3,
  "name": "Study Buddy AI",
  "version": "1.0.0",
  "description": "AI-powered study assistant that helps you understand content on any webpage",
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "contextMenus"
  ],
  "host_permissions": [
    "http://localhost:3000/*",
    "https://*/*"
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ]
}
```

### Step 2: Load the Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `study-buddy` folder
6. The extension should load successfully!

### Step 3: Test the Extension

1. Visit any website (like Wikipedia or a documentation page)
2. Look for the purple "Need Help?" button in the bottom-right corner
3. Click the extension icon in your Chrome toolbar
4. Try asking a question!

**Note**: The AI API connection will fail until you set up the backend API. The extension UI will still work and show an error message.

## Setting Up the AI API

To make the AI features work, you need a backend API:

### If you have the API from the Chrome Extension Guide:

1. Navigate to your API project:
   ```bash
   cd /path/to/your/api
   npm run dev
   ```

2. Verify it's running:
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"Hello"}'
   ```

### If you don't have an API yet:

You'll need to set up a backend API that:
- Accepts POST requests to `/api/chat`
- Receives: `{"message": "user question"}`
- Returns: `{"response": "AI answer"}`

See the [CHROME_EXTENSION_GUIDE.md](CHROME_EXTENSION_GUIDE.md) for API setup instructions.

## Troubleshooting

### "Service worker registration failed"
✅ **FIXED!** This was resolved by moving the context menu creation inside the `onInstalled` listener.

### Extension loads but shows errors
- Check the Chrome Extensions page (`chrome://extensions/`)
- Click "Errors" button on the Study Buddy card
- Look for specific error messages

### Popup doesn't open
- Right-click the extension icon → "Inspect popup"
- Check the Console for JavaScript errors

### "Failed to fetch" error when asking questions
- Make sure your API is running on `http://localhost:3000`
- Check the API URL in [popup.js](popup.js) line 2
- Verify CORS is enabled on your API

### Floating button doesn't appear
- Refresh the webpage after installing the extension
- Some websites block content scripts - try a different site
- Check the page's Console (F12) for errors

## Next Steps

Once everything is working:

1. ✅ Generate proper icons using [create-icons.html](create-icons.html)
2. ✅ Test on various educational websites
3. ✅ Try the quick action buttons (Explain, Summarize, Quiz)
4. ✅ Test the right-click context menu on selected text
5. ✅ Check the chat history feature

## Need Help?

- See the full [README.md](README.md) for detailed documentation
- Check [CHROME_EXTENSION_GUIDE.md](CHROME_EXTENSION_GUIDE.md) for API setup
- Review the troubleshooting section above

Happy studying!
