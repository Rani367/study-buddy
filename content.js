// Content script that runs on all web pages
// Extracts page content and detects questions

// Function to extract page content
function getPageContent() {
  // Check if this is a PDF viewer
  if (isPDFViewer()) {
    return getPDFContent();
  }

  // Try to find the main content area intelligently
  let mainContent = '';

  // Priority 1: Look for main article/content tags
  const mainSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.main-content',
    '.article-content',
    '.post-content',
    '.entry-content',
    '#content',
    '.content'
  ];

  for (const selector of mainSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const clone = element.cloneNode(true);
      // Remove unwanted elements
      const unwanted = clone.querySelectorAll('script, style, noscript, nav, header, footer, aside, .sidebar, .menu, .advertisement, .ad');
      unwanted.forEach(el => el.remove());

      const text = clone.innerText || clone.textContent;
      if (text && text.trim().length > 200) {
        mainContent = text;
        break;
      }
    }
  }

  // Priority 2: If no main content found, use body but clean it better
  if (!mainContent) {
    const bodyClone = document.body.cloneNode(true);

    // Remove all navigation, headers, footers, sidebars, ads
    const unwanted = bodyClone.querySelectorAll(
      'script, style, noscript, nav, header, footer, aside, ' +
      '.nav, .navbar, .navigation, .menu, .sidebar, .header, .footer, ' +
      '.advertisement, .ad, .ads, .promo, .social, .share, ' +
      '.comments, .related, .recommended'
    );
    unwanted.forEach(el => el.remove());

    mainContent = bodyClone.innerText || bodyClone.textContent;
  }

  // Clean up whitespace
  return mainContent.replace(/\s+/g, ' ').trim();
}

// Check if current page is a PDF viewer
function isPDFViewer() {
  // Check URL ends with .pdf
  if (window.location.href.toLowerCase().endsWith('.pdf')) {
    return true;
  }

  // Check if it's Chrome's PDF viewer
  if (document.querySelector('embed[type="application/pdf"]')) {
    return true;
  }

  // Check for PDF.js viewer
  if (document.querySelector('#viewer.pdfViewer')) {
    return true;
  }

  return false;
}

// Extract content from PDF viewer
function getPDFContent() {
  let content = '';

  // Try to get text from PDF.js text layer (if available)
  const textLayers = document.querySelectorAll('.textLayer');
  if (textLayers.length > 0) {
    textLayers.forEach(layer => {
      content += layer.textContent + ' ';
    });
    return content.trim();
  }

  // Try Chrome's PDF viewer embed
  const pdfEmbed = document.querySelector('embed[type="application/pdf"]');
  if (pdfEmbed) {
    // For Chrome PDF viewer, we need to use a different approach
    // Check if there's an iframe with the PDF content
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
          const textContent = iframeDoc.body.innerText || iframeDoc.body.textContent;
          if (textContent && textContent.trim()) {
            return textContent.trim();
          }
        }
      } catch (e) {
        // Cross-origin restriction, can't access
        console.log('Cannot access iframe:', e);
      }
    }
  }

  // Try to select all text on the page (works for some PDF viewers)
  try {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(document.body);
    selection.removeAllRanges();
    selection.addRange(range);
    const selectedText = selection.toString();
    selection.removeAllRanges();

    if (selectedText && selectedText.trim().length > 100) {
      return selectedText.trim();
    }
  } catch (e) {
    console.log('Cannot select text:', e);
  }

  // Last resort: Return a helpful message
  const filename = window.location.pathname.split('/').pop() || 'document';
  return `This is a PDF file (${filename}). I'm trying to read the content but it may be limited. Please select and copy text from the PDF to share specific parts you need help with.`;
}

// Function to detect questions on the page
function detectQuestions() {
  const content = getPageContent();
  const questions = [];
  const seen = new Set(); // Avoid duplicates

  // Split by common sentence endings, but preserve question marks
  const sentences = content.split(/(?<=[.!])\s+/);

  sentences.forEach(sentence => {
    const trimmed = sentence.trim();

    // Must have a question mark to be considered a question
    if (!trimmed.includes('?')) {
      return;
    }

    // Extract the question (up to and including the ?)
    const questionMatch = trimmed.match(/[^.!]*\?/);
    if (!questionMatch) {
      return;
    }

    const question = questionMatch[0].trim();

    // Filter out false positives
    // Must be between 15 and 200 characters
    if (question.length < 15 || question.length > 200) {
      return;
    }

    // Must start with a capital letter or common question word
    const startsValid = /^[A-Z]/.test(question) ||
                       /^(what|where|when|why|how|who|which|can|do|does|will|would|could|should|is|are)/i.test(question);

    if (!startsValid) {
      return;
    }

    // Avoid navigation/menu items (too short or contains common nav patterns)
    if (question.length < 20 && /^(home|about|contact|menu|login|sign|search)/i.test(question)) {
      return;
    }

    // Check for duplicates (case-insensitive)
    const questionLower = question.toLowerCase();
    if (seen.has(questionLower)) {
      return;
    }

    seen.add(questionLower);
    questions.push(question);
  });

  return questions;
}

// Function to get focused/highlighted text
function getSelectedText() {
  return window.getSelection().toString().trim();
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    const content = getPageContent();
    const questions = detectQuestions();
    const selectedText = getSelectedText();

    sendResponse({
      content: content.substring(0, 5000), // Limit to first 5000 chars
      questions: questions.slice(0, 5), // Return up to 5 questions
      selectedText: selectedText,
      url: window.location.href,
      title: document.title
    });
  }

  return true; // Keep channel open for async response
});

// Create floating "Need Help?" button
function createHelpButton() {
  // Check if button already exists
  if (document.getElementById('study-buddy-help-btn')) {
    return;
  }

  const button = document.createElement('div');
  button.id = 'study-buddy-help-btn';
  button.className = 'study-buddy-floating-btn';
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
    <span>Need Help?</span>
  `;

  button.addEventListener('click', () => {
    // Toggle the inline chat widget
    toggleInlineChat();
  });

  document.body.appendChild(button);
}

// Create inline chat widget
function toggleInlineChat() {
  const existingWidget = document.getElementById('study-buddy-inline-chat');

  if (existingWidget) {
    existingWidget.remove();
    return;
  }

  const widget = document.createElement('iframe');
  widget.id = 'study-buddy-inline-chat';
  widget.src = chrome.runtime.getURL('popup.html');
  widget.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 420px;
    height: 600px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 999998;
    background: white;
    animation: slideInWidget 0.3s ease-out;
  `;

  document.body.appendChild(widget);

  // Add close on outside click
  const closeOnOutsideClick = (e) => {
    if (!widget.contains(e.target) && !document.getElementById('study-buddy-help-btn').contains(e.target)) {
      widget.remove();
      document.removeEventListener('click', closeOnOutsideClick);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', closeOnOutsideClick);
  }, 100);
}

// Initialize button when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createHelpButton);
} else {
  createHelpButton();
}
