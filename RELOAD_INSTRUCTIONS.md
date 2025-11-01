# How to Properly Reload the Extension

If you're still seeing errors after updating the code, the service worker might be cached. Follow these steps:

## Method 1: Complete Extension Reload (Recommended)

1. Go to `chrome://extensions/`
2. Find "Study Buddy AI"
3. Click **Remove** button to completely uninstall
4. Click **Load unpacked** again
5. Select the `study-buddy` folder
6. The extension will load with fresh code

## Method 2: Service Worker Hard Reset

1. Go to `chrome://extensions/`
2. Find "Study Buddy AI"
3. Click on **"service worker"** link (it appears after "Inspect views:")
4. In the DevTools that opens, click the **Console** tab
5. Look for any errors
6. Close the DevTools
7. Go back to `chrome://extensions/`
8. Click the **reload button** (↻) on Study Buddy AI
9. Click **"service worker"** again to verify it loaded without errors

## Method 3: Clear All Extension Data

1. Go to `chrome://extensions/`
2. Click **Remove** on Study Buddy AI
3. Close and reopen Chrome
4. Go to `chrome://extensions/`
5. Enable **Developer mode**
6. Click **Load unpacked**
7. Select the `study-buddy` folder

## Verify It's Working

After reloading, check:

1. **No errors in extensions page**:
   - Go to `chrome://extensions/`
   - Look for Study Buddy AI
   - Should see green "Errors" button (if gray, click it - should show 0 errors)

2. **Service worker loaded**:
   - Click "service worker" link
   - Console should show: `Study Buddy AI background service worker loaded`
   - Should see: `Study Buddy AI installed Object {reason: "install", ...}`

3. **Extension works**:
   - Visit any webpage
   - Look for purple floating button in bottom-right
   - Click extension icon
   - Popup should open

## Still Seeing Errors?

If the error persists at line 39 after a complete reload:

1. **Check the file was saved**:
   ```bash
   cat /Users/rani/Desktop/study-buddy/background.js | grep -n "Context menu error"
   ```
   Should show line 39 with: `console.error('Context menu error:', chrome.runtime.lastError);`

2. **Check for syntax errors**:
   ```bash
   node --check /Users/rani/Desktop/study-buddy/background.js
   ```
   Should output nothing if syntax is valid

3. **Verify manifest is valid**:
   - Open `manifest.json` in a JSON validator
   - Or use: `python3 -m json.tool manifest.json`

## Common Issues

### "Cannot read properties of undefined (reading 'create')"

This happens when:
- Chrome APIs aren't fully loaded yet (fixed by our callbacks)
- Old service worker is still cached (use Method 1 above)
- Manifest permissions are missing (we added all needed permissions)

### Service worker shows "Inactive"

- Click on it to activate
- Or reload the extension

### Floating button doesn't appear

- Refresh the webpage (extensions only inject on page load)
- Check if content script loaded in DevTools → Console

## Current File State

Your background.js should now have:
- Line 32-42: Context menu creation with proper error handling
- Line 38-40: Error logging callback
- No try-catch blocks around chrome.contextMenus (using callbacks instead)

The error at "line 39" from Chrome DevTools is likely showing the OLD cached version.

**Solution**: Use Method 1 (complete removal and reinstall) to guarantee fresh code.
