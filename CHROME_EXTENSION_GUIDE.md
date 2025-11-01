# Using the API in a Chrome Extension

This guide shows you how to integrate the chat API into a Chrome extension.

## Overview

Chrome extensions can call your API using `fetch()` just like any web application. You'll need to:
1. Set up proper CORS headers (if calling from a different domain)
2. Configure manifest permissions
3. Make API calls from your extension scripts

## Chrome Extension Setup

### 1. Create Extension Structure

```
my-chrome-extension/
├── manifest.json
├── popup.html
├── popup.js
├── background.js (optional)
├── styles.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 2. Manifest File (manifest.json)

**For Manifest V3 (recommended):**

```json
{
  "manifest_version": 3,
  "name": "AI Chat Assistant",
  "version": "1.0.0",
  "description": "Chat with AI powered by Groq",
  "permissions": [
    "storage"
  ],
  "host_permissions": [
    "http://localhost:3000/*",
    "https://yourdomain.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Key points:**
- `host_permissions`: Add your API URL (localhost for dev, your domain for production)
- `storage`: Optional, for saving chat history
- Update URLs to match your deployed API

### 3. Popup HTML (popup.html)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI Chat</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AI Chat Assistant</h1>
    </div>

    <div id="chat-container" class="chat-container">
      <!-- Messages will appear here -->
    </div>

    <div class="input-container">
      <textarea
        id="message-input"
        placeholder="Type your message..."
        rows="3"
      ></textarea>
      <button id="send-button">Send</button>
    </div>

    <div id="status" class="status"></div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

### 4. Popup JavaScript (popup.js)

```javascript
// Configuration
const API_URL = 'http://localhost:3000/api/chat'; // Change for production

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const statusElement = document.getElementById('status');

// Add message to chat
function addMessage(text, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
  messageDiv.textContent = text;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Show status
function showStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.className = `status ${isError ? 'error' : 'success'}`;
  setTimeout(() => {
    statusElement.textContent = '';
    statusElement.className = 'status';
  }, 3000);
}

// Send message to API
async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message) {
    showStatus('Please enter a message', true);
    return;
  }

  // Disable input while processing
  messageInput.disabled = true;
  sendButton.disabled = true;
  sendButton.textContent = 'Sending...';

  // Add user message to chat
  addMessage(message, true);
  messageInput.value = '';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    const data = await response.json();

    // Add AI response to chat
    addMessage(data.response, false);

    // Save to storage (optional)
    saveToHistory(message, data.response);

  } catch (error) {
    console.error('Error:', error);
    showStatus(`Error: ${error.message}`, true);
    addMessage(`Error: ${error.message}`, false);
  } finally {
    // Re-enable input
    messageInput.disabled = false;
    sendButton.disabled = false;
    sendButton.textContent = 'Send';
    messageInput.focus();
  }
}

// Save chat history (optional)
async function saveToHistory(userMessage, aiResponse) {
  try {
    const result = await chrome.storage.local.get(['chatHistory']);
    const history = result.chatHistory || [];

    history.push({
      timestamp: new Date().toISOString(),
      user: userMessage,
      ai: aiResponse
    });

    // Keep only last 50 messages
    if (history.length > 50) {
      history.shift();
    }

    await chrome.storage.local.set({ chatHistory: history });
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

// Load chat history on popup open (optional)
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['chatHistory']);
    const history = result.chatHistory || [];

    // Display last 10 messages
    const recentHistory = history.slice(-10);
    recentHistory.forEach(item => {
      addMessage(item.user, true);
      addMessage(item.ai, false);
    });
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Load history when popup opens
loadHistory();

// Focus input on load
messageInput.focus();
```

### 5. Styles (styles.css)

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 400px;
  height: 600px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f5f5;
}

.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.header {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f9fafb;
}

.message {
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 80%;
  word-wrap: break-word;
  line-height: 1.5;
  font-size: 14px;
}

.user-message {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.ai-message {
  background: white;
  color: #333;
  align-self: flex-start;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}

.input-container {
  padding: 16px;
  background: white;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
}

#message-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

#message-input:focus {
  border-color: #667eea;
}

#message-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

#send-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  font-size: 14px;
}

#send-button:hover:not(:disabled) {
  opacity: 0.9;
}

#send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status {
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  min-height: 32px;
}

.status.error {
  color: #dc2626;
  background: #fee2e2;
}

.status.success {
  color: #059669;
  background: #d1fae5;
}

/* Scrollbar styling */
.chat-container::-webkit-scrollbar {
  width: 6px;
}

.chat-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.chat-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

### 6. Background Script (background.js) - Optional

```javascript
// Optional: Handle background tasks, context menus, etc.

chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Chat Extension installed');
});

// Optional: Add context menu to chat with selected text
chrome.contextMenus.create({
  id: 'askAI',
  title: 'Ask AI about "%s"',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'askAI') {
    const selectedText = info.selectionText;

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Explain this: ${selectedText}`
        })
      });

      const data = await response.json();

      // Show notification with response
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Response',
        message: data.response.substring(0, 200) + '...'
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }
});
```

## Production Setup

### Update API URL

Before publishing, update the API URL in `popup.js`:

```javascript
const API_URL = 'https://your-deployed-api.vercel.app/api/chat';
```

And update `manifest.json` host permissions:

```json
"host_permissions": [
  "https://your-deployed-api.vercel.app/*"
]
```

### Enable CORS (if needed)

If your API and extension are on different domains, add CORS headers to your API route.

Create or update `src/app/api/chat/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  // ... existing code ...

  const response = NextResponse.json({
    response: aiResponse,
    model: 'llama-3.3-70b-versatile',
    usage: chatCompletion.usage,
  });

  // Add CORS headers for Chrome extension
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

## Loading the Extension

### Development Mode

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select your extension folder
5. Make sure your API is running (`npm run dev`)
6. Click the extension icon to test

### Testing

1. Click the extension icon
2. Type a message
3. Click "Send" or press Enter
4. You should see the AI response

## Features to Add

### 1. Streaming Responses

For real-time responses, modify the API to support streaming and update the extension to handle Server-Sent Events.

### 2. Chat History Management

```javascript
// Add clear history button
async function clearHistory() {
  await chrome.storage.local.remove('chatHistory');
  chatContainer.innerHTML = '';
}
```

### 3. Multiple Conversations

Store multiple conversation threads with unique IDs.

### 4. Dark Mode

Add theme toggle:

```javascript
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});
```

### 5. Settings Page

Create `options.html` and `options.js` for user preferences:
- API URL configuration
- Temperature/max tokens settings
- Theme preferences

## Publishing to Chrome Web Store

1. Create icons (16x16, 48x48, 128x128 PNG)
2. Update manifest with production API URL
3. Zip your extension folder
4. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
5. Pay one-time $5 developer fee
6. Upload and submit for review

## Security Notes

- Never hardcode API keys in the extension
- Use environment variables for sensitive data
- Validate all user input
- Consider adding user authentication if needed
- Use HTTPS for production API

## Troubleshooting

**Extension can't connect to API:**
- Check `host_permissions` in manifest.json
- Verify API is running
- Check browser console for CORS errors

**Messages not sending:**
- Open DevTools (right-click extension popup → Inspect)
- Check Console tab for errors
- Verify API URL is correct

**Storage not working:**
- Ensure `storage` permission is in manifest.json
- Check if storage quota is exceeded

## Example: Advanced Extension with Tabs

For a more advanced extension that can inject AI responses into web pages, see the content script example below.

### Content Script Example

Add to `manifest.json`:
```json
"content_scripts": [{
  "matches": ["<all_urls>"],
  "js": ["content.js"]
}]
```

Create `content.js`:
```javascript
// Inject AI button on selected text
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 0) {
    // Show AI button near selection
    showAIButton(selectedText);
  }
});
```

This allows users to select text on any webpage and ask the AI about it directly!
