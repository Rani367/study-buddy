// Background service worker for Study Buddy AI
// Handles extension lifecycle and cross-component communication

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Study Buddy AI installed', details);

  if (details.reason === 'install') {
    // First time installation
    chrome.storage.local.set({
      chatHistory: [],
      settings: {
        apiUrl: 'http://localhost:3000/api/chat'
      }
    }).catch(err => console.error('Storage error:', err));

    // Open welcome page or show notification
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Study Buddy AI Installed!',
        message: 'Click on the extension icon to start learning with AI assistance.'
      });
    } catch (err) {
      console.log('Notifications not available:', err);
    }
  }

  // Add context menu for selected text (create on install/update)
  // Remove all existing context menus first to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'studyBuddyExplain',
      title: 'Ask Study Buddy: "%s"',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Context menu error:', chrome.runtime.lastError);
      }
    });
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'questionsDetected') {
    const count = request.count;
    if (count > 0 && sender.tab && sender.tab.id) {
      try {
        chrome.action.setBadgeText({
          text: count.toString(),
          tabId: sender.tab.id
        });
        chrome.action.setBadgeBackgroundColor({
          color: '#f59e0b',
          tabId: sender.tab.id
        });
      } catch (err) {
        console.error('Badge error:', err);
      }
    }
    sendResponse({ success: true });
  }

  return true; // Keep channel open for async responses
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'studyBuddyExplain') {
    const selectedText = info.selectionText;

    // Store the selected text so popup can use it
    await chrome.storage.local.set({
      pendingQuestion: `Explain this: ${selectedText}`
    });

    // Note: We can't programmatically open the popup in Manifest V3
    // User will need to click the extension icon after right-clicking
    // The popup will then read the pendingQuestion from storage
  }
});

console.log('Study Buddy AI background service worker loaded');
