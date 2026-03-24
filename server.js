const express = require('express');
const cors = require('cors');
const path = require('path');
const chatRouter = require('./api-chat-router');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(__dirname));

// Routes
app.use('/api', chatRouter);

// Serve index.htm
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.htm'));
});

// Fallback for any other routes
app.get('/:file', (req, res) => {
    res.sendFile(path.join(__dirname, req.params.file));
});

// Start server
app.listen(PORT, () => {
    console.log(`🎉 Server running on http://localhost:${PORT}`);
    console.log(`📝 Mở browser: http://localhost:${PORT}`);
    console.log(`📝 API endpoint: http://localhost:${PORT}/api/chat`);
    console.log(`✅ Khung chat AI đã sẵn sàng!`);
});
