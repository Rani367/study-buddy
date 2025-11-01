# System Prompt Configuration - Study Buddy AI

## Location

The system prompt is defined in **[popup.js](popup.js:183)**

## Current System Prompt

```javascript
let systemPrompt = `You are a helpful study assistant. Be concise and direct. Answer questions straight to the point without unnecessary introductions or explanations about how you'll help. For quizzes, just provide the question. For explanations, get straight to the answer. Keep responses brief and focused.`;
```

## What It Does

This prompt instructs the AI to:
- ✅ Be concise and direct
- ✅ Skip unnecessary introductions
- ✅ For quizzes: Just show the question
- ✅ For explanations: Get straight to the answer
- ✅ Keep responses brief and focused

## How It Works

The system prompt is **prepended** to every user message:

```javascript
const fullPrompt = `${systemPrompt}\n\n${contextualPrompt}`;
```

So when a user asks "Quiz me on this page", the actual prompt sent to the API is:

```
You are a helpful study assistant. Be concise and direct. Answer questions straight to the point without unnecessary introductions or explanations about how you'll help. For quizzes, just provide the question. For explanations, get straight to the answer. Keep responses brief and focused.

I'm looking at a webpage titled "Roman Empire - Wikipedia".
Here's some content from the page: [page content]...

My question: Can you quiz me on the key concepts from this page?
```

## Before vs After

### Before (No System Prompt):

**User**: "Quiz me"

**AI Response**:
```
I'd be happy to quiz you on the key concepts from the Roman Empire Wikipedia page. Here's how we can do it:

I'll ask you a question, and you try to answer it based on the content from the page. If you need help or want to ask for a hint, just let me know. If you answer correctly, I'll give you another question. If you answer incorrectly, I'll provide the correct answer and explain it briefly.

Here's your first question:

What period in Roman history is characterized by relative peace and stability?
A) Transition from Republic to Empire
B) Pax Romana
C) Fall in the West
D) Transition to late antiquity
```

### After (With System Prompt):

**User**: "Quiz me"

**AI Response**:
```
What period in Roman history is characterized by relative peace and stability?
A) Transition from Republic to Empire
B) Pax Romana
C) Fall in the West
D) Transition to late antiquity
```

Much cleaner! 🎯

## Customizing the System Prompt

To change the AI's behavior, edit the `systemPrompt` variable in [popup.js](popup.js:183):

### Examples:

**More detailed responses**:
```javascript
let systemPrompt = `You are a patient study tutor. Provide detailed explanations with examples. Break down complex concepts into simple steps.`;
```

**Formal academic style**:
```javascript
let systemPrompt = `You are an academic assistant. Use formal language and cite concepts accurately. Provide scholarly explanations.`;
```

**Encouraging tone**:
```javascript
let systemPrompt = `You are an encouraging study buddy. Be supportive and positive. Help students feel confident while learning.`;
```

**Super brief (Twitter-style)**:
```javascript
let systemPrompt = `You are a concise study assistant. Maximum 2 sentences per response. No fluff, just facts.`;
```

**Socratic method**:
```javascript
let systemPrompt = `You are a Socratic tutor. Instead of giving direct answers, ask guiding questions that lead students to discover answers themselves.`;
```

## Best Practices

### Do's ✅

- Keep it concise (the prompt counts against token limits)
- Be specific about tone and style
- Define how to handle different request types (quiz, explain, summarize)
- Test with various questions to ensure consistency

### Don'ts ❌

- Don't make it too long (wastes tokens)
- Don't contradict yourself (e.g., "be brief" AND "be detailed")
- Don't include examples (save tokens for actual content)
- Don't use complex formatting instructions (may not work)

## Advanced: Context-Specific Prompts

You can make the system prompt **dynamic** based on the user's request:

```javascript
let systemPrompt;

// Detect quiz requests
if (message.toLowerCase().includes('quiz')) {
  systemPrompt = `You are a quiz master. Provide only the question with multiple choice options. No introduction.`;
}
// Detect explanation requests
else if (message.toLowerCase().includes('explain')) {
  systemPrompt = `You are a clear explainer. Break down concepts into simple terms with examples.`;
}
// Default
else {
  systemPrompt = `You are a helpful study assistant. Be concise and direct.`;
}
```

## Token Considerations

Each character in the system prompt uses tokens:

- **Current prompt**: ~45 words = ~60 tokens
- **User message**: ~50-200 tokens
- **Page context**: ~500-1000 tokens
- **AI response**: ~200-500 tokens

**Total per request**: ~800-1800 tokens

Keep the system prompt brief to save tokens for actual content!

## Testing Your Prompt

After changing the prompt:

1. **Reload extension**:
   - Go to `chrome://extensions/`
   - Click reload on Study Buddy AI

2. **Test different scenarios**:
   - Ask for a quiz
   - Ask for an explanation
   - Ask for a summary
   - Ask a specific question

3. **Check responses**:
   - Are they concise enough?
   - Do they include unnecessary intro text?
   - Is the tone appropriate?
   - Are they helpful?

## Example Scenarios

### Scenario 1: Quiz

**Prompt**: "Quiz me on this page"

**Expected Response**:
```
What is X?
A) Option 1
B) Option 2
C) Option 3
D) Option 4
```

**NOT**:
```
I'll create a quiz for you! Here's how it works...
[long explanation]
Here's your first question:
[question]
```

### Scenario 2: Explanation

**Prompt**: "Explain photosynthesis"

**Expected Response**:
```
Photosynthesis is the process where plants convert light energy into chemical energy. It happens in chloroplasts using chlorophyll. The equation is: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.
```

**NOT**:
```
I'd be happy to explain photosynthesis! It's a fascinating process. Let me break it down for you...
[long preamble before actual explanation]
```

### Scenario 3: Summary

**Prompt**: "Summarize this page"

**Expected Response**:
```
This article covers:
- Main point 1
- Main point 2
- Main point 3
```

**NOT**:
```
I'll summarize this page for you. Here's what I found...
[unnecessary intro]
The main points are:
[actual summary]
```

## Troubleshooting

### AI still verbose?

- Make prompt MORE explicit: "No introductions. No explanations of how you'll help. Just the answer."
- Add: "Skip all preamble and pleasantries."

### AI too brief?

- Remove "concise" from prompt
- Add: "Provide complete explanations with context."

### AI ignoring prompt?

- Put it at the beginning (already done)
- Make it more direct: "IMPORTANT: " prefix
- Test with different AI models (some follow instructions better)

---

## Quick Reference

**File**: [popup.js](popup.js:183)

**Line**: 183

**Variable**: `systemPrompt`

**To edit**:
1. Open popup.js
2. Find line 183
3. Change the text in backticks
4. Save and reload extension

That's it! The AI will now follow your custom instructions.
