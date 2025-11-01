// Special content script for PDF files
// This runs in the PDF viewer context

console.log('PDF content script loaded');

// Wait for PDF to load and extract text
function extractPDFText() {
  return new Promise((resolve) => {
    // Try multiple methods to get PDF text

    // Method 1: Check for text selection capability
    const attemptTextExtraction = () => {
      try {
        // Select all content
        document.execCommand('selectAll');
        const selectedText = window.getSelection().toString();
        window.getSelection().removeAllRanges();

        if (selectedText && selectedText.trim().length > 50) {
          console.log('PDF text extracted via selection:', selectedText.length, 'characters');
          resolve(selectedText.trim());
          return true;
        }
      } catch (e) {
        console.log('Selection method failed:', e);
      }
      return false;
    };

    // Try immediately
    if (attemptTextExtraction()) {
      return;
    }

    // Wait a bit for PDF to fully load
    setTimeout(() => {
      if (attemptTextExtraction()) {
        return;
      }

      // If still no content, try one more time after longer wait
      setTimeout(() => {
        if (!attemptTextExtraction()) {
          // Couldn't extract text
          const filename = window.location.pathname.split('/').pop() || 'document.pdf';
          resolve(`PDF file: ${filename}. Content extraction not available. Please describe what you need help with or copy specific text from the PDF.`);
        }
      }, 2000);
    }, 1000);
  });
}

// Listen for content requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageContent') {
    extractPDFText().then(content => {
      sendResponse({
        content: content.substring(0, 5000),
        questions: [], // PDFs rarely have questions in extractable form
        selectedText: window.getSelection().toString().trim(),
        url: window.location.href,
        title: document.title || 'PDF Document'
      });
    });
    return true; // Keep channel open for async response
  }
});

// Store extracted content for quick access
let cachedContent = null;

// Extract on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    extractPDFText().then(text => {
      cachedContent = text;
    });
  });
} else {
  extractPDFText().then(text => {
    cachedContent = text;
  });
}
