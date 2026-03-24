# cubi-Chan Web Chat - Setup Guide

## Overview
This adds an AI chat interface to your profile website that connects to your existing Node.js bot backend.

## Files Included

1. **chat.html** - Chat interface (embed in your profile)
2. **chat-style.css** - Chat styling
3. **chat.js** - Chat functionality with API connection
4. **api-chat-router.js** - Express router for the web chat API endpoint

## Installation Steps

### Step 1: Install Dependencies
Make sure you have Express and CORS in your main server file:

```bash
npm install express cors
```

### Step 2: Add API Router to Your Backend

In your main server file (e.g., `server.js` or `index.js`), add:

```javascript
const express = require('express');
const cors = require('cors');
const chatRouter = require('./path/to/api-chat-router');

const app = express();

// Enable CORS for web requests
app.use(cors({
    origin: '*', // Adjust this to your domain
    methods: ['GET', 'POST'],
    credentials: false
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add chat API routes
app.use('/api', chatRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Configure Chat Widget

Open **chat.js** and update the API endpoint:

```javascript
const API_ENDPOINT = 'http://localhost:3000/api/chat'; // Change to your server URL
```

For production, use your actual domain:
```javascript
const API_ENDPOINT = 'https://yourdomain.com/api/chat';
```

### Step 4: Embed Chat in Your Profile

Add to your **index.html**:

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Your existing head content -->
</head>
<body>
    <!-- Your existing content -->
    
    <!-- Chat Widget -->
    <iframe 
        src="chat.html" 
        style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 450px;
            height: 600px;
            border: none;
            border-radius: 12px;
            box-shadow: 0 5px 40px rgba(0,0,0,0.16);
            z-index: 9999;
        "
        allow="autoplay"
    ></iframe>
</body>
</html>
```

**Or** directly include the files without iframe:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="chat-style.css">
</head>
<body>
    <!-- Your content -->
    
    <!-- Chat HTML -->
    <div class="chat-container">
        <!-- Copy content from chat.html -->
    </div>
    
    <script src="chat.js"></script>
</body>
</html>
```

## API Response Format

The backend API should return JSON in this format:

```json
{
    "success": true,
    "reply": "Your bot's response message",
    "music": {
        "status": false,
        "keyword": "song name (if music requested)"
    },
    "image": {
        "status": false,
        "prompt": "image description (if image requested)"
    }
}
```

## Customization

### Change Chat Theme Colors
Edit **chat-style.css**, look for:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Replace with your own colors.

### Change Bot Name
Edit **chat.html**, line with:
```html
<h1>cubi-Chan 👀</h1>
```

### Change Welcome Message
Edit **chat.html**, look for:
```html
<p>Chào cậu! Mình là cubi-Chan 😊 Có gì mình có thể giúp cậu không? 💕</p>
```

### Adjust Chat Window Size
Edit **chat-style.css**:

```css
.chat-container {
    max-width: 450px;  /* Change width */
    height: 600px;     /* Change height */
}
```

## Troubleshooting

### CORS Error
If you see CORS errors in browser console:
1. Make sure CORS is enabled on your backend
2. Check the API endpoint URL matches your server
3. Whitelist your domain in CORS settings

### API Not Responding
1. Verify your backend server is running on the configured port
2. Check API endpoint URL is correct
3. Look at browser console Network tab for failed requests
4. Check backend server logs for errors

### Chat Not Loading
1. Check browser console for JavaScript errors
2. Verify all CSS and JS files are in the correct path
3. Check file permissions

## Mobile Support

The chat interface is fully responsive and works on mobile devices. On small screens, it expands to fill most of the viewport.

## Security Notes

- Keep your API endpoint URL hidden in production code
- Validate all user inputs on the backend
- Don't expose your Gemini API keys in frontend code
- Use HTTPS in production

## Advanced Features

### Add Message History
Modify **api-chat-router.js** to load chat history from your existing thread files

### Add File Upload
Extend the API to handle file uploads for image/video analysis

### Add Typing Indicators
Already implemented - shows when bot is thinking

### Add Message Reactions
You can modify the chat.js to add emoji reactions

## Support

For issues or customization needs, check:
1. Browser console for errors (F12)
2. Backend server logs
3. Network tab to see API requests/responses

---

Created with 💕 by cubi-Chan Web Chat Interface
