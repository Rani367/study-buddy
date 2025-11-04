// Configuration
const API_URL = 'http://localhost:3000/api/chat'; // Change for production

// State
let currentPageData = null;
let currentSessionId = null;
let conversationSummary = null;

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const statusElement = document.getElementById('status');
const detectedQuestionsSection = document.getElementById('detected-questions');
const questionsList = document.getElementById('questions-list');
const pageInfo = document.getElementById('page-info');
const pageTitle = document.getElementById('page-title');

// Quick action buttons
const explainPageBtn = document.getElementById('explain-page-btn');
const summarizeBtn = document.getElementById('summarize-btn');
const quizMeBtn = document.getElementById('quiz-me-btn');
const closeQuestionsBtn = document.getElementById('close-questions-btn');

// Initialize - Get page content when popup opens
async function init() {
  try {
    // Check for pending question from context menu
    const storage = await chrome.storage.local.get(['pendingQuestion']);
    if (storage.pendingQuestion) {
      // Auto-fill the question and clear it from storage
      messageInput.value = storage.pendingQuestion;
      await chrome.storage.local.remove('pendingQuestion');
      messageInput.focus();
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      showStatus('Unable to access current tab', true);
      return;
    }

    // Send message to content script to get page data
    chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting page content:', chrome.runtime.lastError);
        addMessage("I'm ready to help! However, I couldn't access the page content. You can still ask me questions!", false);
        return;
      }

      if (response) {
        currentPageData = response;

        // Initialize session for this page
        initializeSession();

        displayPageInfo(response);
        displayDetectedQuestions(response.questions);

        // Check if this is a PDF
        const isPDF = response.url && response.url.toLowerCase().includes('.pdf');
        const hasLimitedPDFAccess = response.content && (
          response.content.includes('PDF content cannot be automatically extracted') ||
          response.content.includes('Content extraction not available')
        );

        // Auto-greet based on context
        if (isPDF && hasLimitedPDFAccess) {
          setTimeout(() => {
            addMessage("I can see you're viewing a PDF! While I couldn't automatically read all the content, I'm here to help. Please copy and paste text from the PDF or describe what you need help with.", false);
          }, 300);
        } else if (isPDF && response.content.length > 100) {
          setTimeout(() => {
            addMessage("I've loaded the PDF content! I can help you understand this document. What would you like to know?", false);
          }, 300);
        } else if (response.questions && response.questions.length > 0) {
          setTimeout(() => {
            addMessage(`I detected ${response.questions.length} question(s) on this page. Click on any question below to get help, or ask me anything!`, false);
          }, 300);
        } else {
          setTimeout(() => {
            addMessage("I'm ready to help you understand this page! What would you like to know?", false);
          }, 300);
        }
      }
    });
  } catch (error) {
    console.error('Init error:', error);
    showStatus('Error initializing extension', true);
  }
}

// Display page information
function displayPageInfo(data) {
  if (data.title) {
    pageTitle.textContent = data.title;
    pageInfo.style.display = 'block';
  }
}

// Display detected questions
function displayDetectedQuestions(questions) {
  if (!questions || questions.length === 0) {
    detectedQuestionsSection.style.display = 'none';
    return;
  }

  detectedQuestionsSection.style.display = 'block';
  questionsList.innerHTML = '';

  questions.forEach((question, index) => {
    const questionBtn = document.createElement('button');
    questionBtn.className = 'question-item';
    questionBtn.textContent = question;
    questionBtn.addEventListener('click', () => {
      askAboutQuestion(question);
    });
    questionsList.appendChild(questionBtn);
  });
}

// Ask about a detected question
function askAboutQuestion(question) {
  messageInput.value = `Help me understand: ${question}`;
  sendMessage();
}

// Add message to chat
function addMessage(text, isUser = false) {
  // Remove welcome message if it exists
  const welcomeMsg = chatContainer.querySelector('.welcome-message');
  if (welcomeMsg) {
    welcomeMsg.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;

  // Format markdown-like text (simple formatting)
  const formattedText = formatText(text);
  messageDiv.innerHTML = formattedText;

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Simple text formatting
function formatText(text) {
  // Convert **bold** to <strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert *italic* to <em>
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Convert line breaks
  text = text.replace(/\n/g, '<br>');
  return text;
}

// Show status message
function showStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.className = `status ${isError ? 'error' : 'success'}`;
  setTimeout(() => {
    statusElement.textContent = '';
    statusElement.className = 'status';
  }, 3000);
}

// Initialize or resume session for current page
async function initializeSession() {
  if (!currentPageData) return;

  // Create session ID based on page (URL + title for uniqueness)
  const pageKey = `${currentPageData.url || 'unknown'}_${currentPageData.title || 'untitled'}`;
  currentSessionId = btoa(pageKey).substring(0, 32); // Base64 encode and limit length

  // Try to load existing session data
  try {
    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || {};

    if (sessions[currentSessionId]) {
      // Resume existing session
      conversationSummary = sessions[currentSessionId].summary || null;
      console.log('Resumed session:', currentSessionId);
    } else {
      // New session
      conversationSummary = null;
      console.log('Started new session:', currentSessionId);
    }
  } catch (error) {
    console.error('Error initializing session:', error);
  }
}

// Get recent conversation history for current session
async function getConversationHistory() {
  try {
    const result = await chrome.storage.local.get(['chatHistory']);
    const history = result.chatHistory || [];

    if (!currentPageData) return [];

    // Filter messages from current page and add session tracking
    const pageHistory = history.filter(item =>
      item.page === currentPageData.title
    );

    // Return last 8 messages for context (adjust as needed)
    return pageHistory.slice(-8);
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

// Check if conversation needs summarization
async function checkAndSummarize() {
  try {
    const history = await getConversationHistory();

    // Trigger summarization if:
    // 1. More than 15 messages in current session
    // 2. OR total character count > 5000
    const messageCount = history.length;
    const totalChars = history.reduce((sum, item) =>
      sum + (item.user?.length || 0) + (item.ai?.length || 0), 0
    );

    if (messageCount > 15 || totalChars > 5000) {
      await summarizeConversation(history);
    }
  } catch (error) {
    console.error('Error checking for summarization:', error);
  }
}

// Summarize conversation using AI
async function summarizeConversation(history) {
  try {
    // Build conversation text for summarization
    const conversationText = history.map(item =>
      `User: ${item.user}\nAssistant: ${item.ai}`
    ).join('\n\n');

    const summaryPrompt = `Please provide a concise summary of this conversation. Focus on key topics discussed, important questions asked, and main points covered. Keep it brief (2-3 sentences):\n\n${conversationText}`;

    // Call API to get summary
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: summaryPrompt })
    });

    if (response.ok) {
      const data = await response.json();
      conversationSummary = data.response;

      // Save summary to storage
      const result = await chrome.storage.local.get(['sessions']);
      const sessions = result.sessions || {};

      sessions[currentSessionId] = {
        summary: conversationSummary,
        lastUpdated: new Date().toISOString(),
        messageCount: history.length
      };

      await chrome.storage.local.set({ sessions });
      console.log('Conversation summarized');
    }
  } catch (error) {
    console.error('Error summarizing conversation:', error);
  }
}

// Build conversation context for AI
async function buildConversationContext(currentMessage) {
  const history = await getConversationHistory();

  if (history.length === 0 && !conversationSummary) {
    return ''; // No context to add
  }

  let context = '';

  // Add summary if it exists
  if (conversationSummary) {
    context += `Previous conversation summary: ${conversationSummary}\n\n`;
  }

  // Add recent messages (last 5-8 depending on summary existence)
  const recentCount = conversationSummary ? 5 : 8;
  const recentMessages = history.slice(-recentCount);

  if (recentMessages.length > 0) {
    context += 'Recent conversation:\n';

    // Filter out repetitive quiz/explain/summarize commands from history
    // to prevent the AI from getting stuck in loops
    const filteredMessages = recentMessages.filter(item => {
      const userMsg = item.user.toLowerCase();

      // If current message is a follow-up (shorter, not a command), include all context
      const isFollowUp = currentMessage && currentMessage.length < 50 &&
                         !userMsg.includes('quiz') &&
                         !userMsg.includes('explain') &&
                         !userMsg.includes('summarize');

      if (isFollowUp) {
        return true; // Include all recent messages for follow-ups
      }

      // Otherwise, filter out command-like messages if we have enough context
      const isCommand = userMsg.includes('quiz me') ||
                       userMsg.includes('explain what this page') ||
                       userMsg.includes('summarize the key points');

      return !isCommand || recentMessages.length <= 2;
    });

    const messagesToShow = filteredMessages.length > 0 ? filteredMessages : recentMessages.slice(-3);

    messagesToShow.forEach(item => {
      context += `User: ${item.user}\nAssistant: ${item.ai}\n\n`;
    });
  }

  return context;
}

// Get content to send to AI - send all main article content
function getContentForAI(fullContent) {
  // Send as much cleaned content as possible
  // The content is already filtered (main article only, no nav/sidebar/ads)
  const maxLength = 8000; // Increased limit since content is already clean

  if (fullContent.length <= maxLength) {
    return fullContent;
  }

  // If very long, include beginning (intro) and end (conclusion)
  // This ensures we get the most important parts
  const partSize = Math.floor(maxLength * 0.6); // 60% from beginning
  const endSize = maxLength - partSize; // 40% from end

  const beginning = fullContent.substring(0, partSize);
  const ending = fullContent.substring(fullContent.length - endSize);

  return beginning + '\n\n[...content continues...]\n\n' + ending;
}

// Send message to AI
async function sendMessage() {
  const message = messageInput.value.trim();

  if (!message) {
    showStatus('Please enter a message', true);
    return;
  }

  // Disable input while processing
  messageInput.disabled = true;
  sendButton.disabled = true;
  sendButton.innerHTML = '<span class="spinner"></span>';

  // Add user message to chat
  addMessage(message, true);
  messageInput.value = '';

  try {
    // Check if we need to summarize conversation before continuing
    await checkAndSummarize();

    // Build context-aware prompt with system instructions
    let systemPrompt = `You are a helpful study assistant. Be concise and direct. Answer questions straight to the point without unnecessary introductions or explanations about how you'll help. For quizzes, just provide the question. For explanations, get straight to the answer. Keep responses brief and focused.

You can use both the webpage content provided AND your general knowledge to answer questions. Prioritize information from the webpage when it's relevant to the question, but don't hesitate to use your knowledge for general questions, follow-ups, or when the page doesn't contain the answer.

IMPORTANT: Pay attention to the user's CURRENT question. If they ask you to stop, explain something, or change topics, do so immediately - don't keep repeating previous tasks like quizzing.`;

    // Build conversation context (pass current message to help filter appropriately)
    const conversationContext = await buildConversationContext(message);

    let contextualPrompt = '';

    // Detect if user wants to break out of a loop/mode
    const breakoutPhrases = ['stop', 'enough', 'no more', 'change topic', 'different question', 'tell me', 'explain'];
    const isBreakout = breakoutPhrases.some(phrase => message.toLowerCase().includes(phrase));

    // Add conversation history if it exists (but not if user is trying to break out)
    if (conversationContext && !isBreakout) {
      contextualPrompt += conversationContext + '\n';
    } else if (isBreakout) {
      // If breaking out, only add a minimal note about the context switch
      contextualPrompt += 'Note: User is changing topics or asking for something different.\n\n';
    }

    // Add current page context
    if (currentPageData) {
      contextualPrompt += `Currently viewing webpage: "${currentPageData.title}"\n`;

      if (currentPageData.selectedText) {
        contextualPrompt += `Selected text: "${currentPageData.selectedText}"\n`;
      }

      // Get main content from the page (already cleaned by content script)
      const relevantContent = getContentForAI(currentPageData.content);

      contextualPrompt += `\nPage content:\n${relevantContent}\n\n`;
    }

    // Add current user question
    contextualPrompt += `Current question: ${message}`;

    // Combine system prompt with contextual information
    const fullPrompt = `${systemPrompt}\n\n${contextualPrompt}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: fullPrompt })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    const data = await response.json();

    // Add AI response to chat
    addMessage(data.response, false);

    // Save to history
    saveToHistory(message, data.response);

  } catch (error) {
    console.error('Error:', error);
    showStatus(`Error: ${error.message}`, true);
    addMessage(`Sorry, I encountered an error: ${error.message}. Please make sure the API is running.`, false);
  } finally {
    // Re-enable input
    messageInput.disabled = false;
    sendButton.disabled = false;
    sendButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    `;
    messageInput.focus();
  }
}

// Quick action: Explain page
explainPageBtn.addEventListener('click', () => {
  if (!currentPageData) {
    showStatus('No page content available', true);
    return;
  }
  messageInput.value = 'Can you explain what this page is about?';
  sendMessage();
});

// Quick action: Summarize
summarizeBtn.addEventListener('click', () => {
  if (!currentPageData) {
    showStatus('No page content available', true);
    return;
  }
  messageInput.value = 'Summarize the key points, main ideas, and important facts from this page in bullet points or short paragraphs';
  sendMessage();
});

// Quick action: Quiz me
quizMeBtn.addEventListener('click', () => {
  if (!currentPageData) {
    showStatus('No page content available', true);
    return;
  }
  messageInput.value = 'Can you quiz me on the key concepts from this page?';
  sendMessage();
});

// Close questions section
closeQuestionsBtn.addEventListener('click', () => {
  detectedQuestionsSection.style.display = 'none';
});

// Save chat history
async function saveToHistory(userMessage, aiResponse) {
  try {
    const result = await chrome.storage.local.get(['chatHistory']);
    const history = result.chatHistory || [];

    history.push({
      timestamp: new Date().toISOString(),
      user: userMessage,
      ai: aiResponse,
      page: currentPageData ? currentPageData.title : 'Unknown'
    });

    // Keep only last 100 messages
    if (history.length > 100) {
      history.shift();
    }

    await chrome.storage.local.set({ chatHistory: history });
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

// Load chat history for current page
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['chatHistory']);
    const history = result.chatHistory || [];

    if (!currentPageData) return;

    // Find messages from current page
    const pageHistory = history.filter(item =>
      item.page === currentPageData.title
    ).slice(-5); // Last 5 messages from this page

    if (pageHistory.length > 0) {
      // Show previous conversations
      pageHistory.forEach(item => {
        addMessage(item.user, true);
        addMessage(item.ai, false);
      });
    }
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

// Initialize when popup opens
init();

// Focus input on load
messageInput.focus();
