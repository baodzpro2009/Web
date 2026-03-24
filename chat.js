// Configuration
const API_ENDPOINT = 'http://localhost:3000/api/chat'; // Change this to your backend URL
const MUSIC_API_ENDPOINT = 'http://localhost:3000/api/music/search';
const IMAGE_API_ENDPOINT = 'http://localhost:3000/api/generate-image';
const THREAD_ID = 'web-chat-' + Date.now();
let isWaitingForResponse = false;

// Get DOM elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const typingIndicator = document.getElementById('typingIndicator');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});

/**
 * Format current time in Vietnamese format
 */
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Add a message to the chat
 */
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const textP = document.createElement('p');
    textP.textContent = text;
    contentDiv.appendChild(textP);
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'timestamp';
    timeSpan.textContent = getCurrentTime();
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeSpan);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Show typing indicator
 */
function showTyping() {
    typingIndicator.classList.add('active');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Hide typing indicator
 */
function hideTyping() {
    typingIndicator.classList.remove('active');
}

/**
 * Search and display music
 */
async function searchMusic(keyword) {
    try {
        const response = await fetch(MUSIC_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword })
        });

        const data = await response.json();

        if (data.success && data.song) {
            const song = data.song;
            // Create music player card
            const musicDiv = document.createElement('div');
            musicDiv.className = 'message bot-message';
            
            const musicCard = document.createElement('div');
            musicCard.style.cssText = `
                background: linear-gradient(135deg, #1DB954, #1ed760);
                border-radius: 12px;
                padding: 15px;
                color: white;
                width: 280px;
                box-shadow: 0 4px 10px rgba(29, 185, 84, 0.3);
            `;
            
            // Duration formatter
            const formatDuration = (ms) => {
                const seconds = Math.floor(ms / 1000);
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${String(secs).padStart(2, '0')}`;
            };
            
            const musicId = 'music-player-' + Date.now();
            
            // Check if embedUrl exists, use iframe player; else fallback to link
            let audioHtml = '';
            if (song.embedUrl) {
                audioHtml = `
                    <div style="margin-bottom: 10px;">
                        <iframe width="100%" height="140" scrolling="no" frameborder="no" allow="autoplay"
                            src="${song.embedUrl}"></iframe>
                    </div>
                `;
            } else if (song.streamUrl) {
                audioHtml = `
                    <audio id="${musicId}" style="width: 100%; margin-bottom: 10px;" controls crossorigin="anonymous">
                        <source src="${song.streamUrl}" type="audio/mpeg">
                        Trình duyệt không hỗ trợ
                    </audio>
                `;
            } else {
                audioHtml = `<div style="margin: 10px 0;">🔗 Bạn có thể click link bên dưới để nghe nhạc</div>`;
            }
            
            musicCard.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px;">🎵 ${song.title}</div>
                <div style="font-size: 12px; margin-bottom: 8px;">Nghệ sĩ: ${song.artist}</div>
                <div style="font-size: 12px; margin-bottom: 12px;">⏱️ ${formatDuration(song.duration)}</div>
                ${audioHtml}
                <a href="${song.url}" target="_blank" style="
                    display: inline-block;
                    background: white;
                    color: #1DB954;
                    padding: 8px 12px;
                    border-radius: 20px;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                ">🔗 Nghe trên SoundCloud</a>
            `;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.appendChild(musicCard);
            
            musicDiv.appendChild(contentDiv);
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'timestamp';
            timeSpan.textContent = getCurrentTime();
            musicDiv.appendChild(timeSpan);
            
            chatMessages.appendChild(musicDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            addMessage(`Huhu ${data.message || 'không tìm thấy bài hát'} 😢`, false);
        }
    } catch (error) {
        console.error('Music search error:', error);
        addMessage('Lỗi tìm nhạc! Thử lại nha! 😢', false);
    }
}

/**
 * Generate and display image
 */
async function generateImage(prompt) {
    try {
        console.log('Generating image for prompt:', prompt);
        const response = await fetch(IMAGE_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });

        console.log('API response status:', response.status);
        const data = await response.json();
        console.log('API response data:', data);

        if (data.success && data.imageUrl) {
            // Create image display
            const imageDiv = document.createElement('div');
            imageDiv.className = 'message bot-message';

            const imageCard = document.createElement('div');
            imageCard.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 15px;
                color: white;
                width: 280px;
                box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
            `;

            imageCard.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px;">🎨 Ảnh đã tạo xong!</div>
                <div style="font-size: 12px; margin-bottom: 12px;">Mô tả: ${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}</div>
                <img src="${data.imageUrl}" alt="Generated Image" style="
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    border-radius: 8px;
                    margin-bottom: 10px;
                " onerror="this.src='https://via.placeholder.com/400x300/667eea/white?text=Image+Generation+Failed'">
                <a href="${data.imageUrl}" target="_blank" style="
                    display: inline-block;
                    background: white;
                    color: #667eea;
                    padding: 8px 12px;
                    border-radius: 20px;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                ">🔗 Xem ảnh gốc</a>
            `;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.appendChild(imageCard);

            imageDiv.appendChild(contentDiv);

            const timeSpan = document.createElement('span');
            timeSpan.className = 'timestamp';
            timeSpan.textContent = getCurrentTime();
            imageDiv.appendChild(timeSpan);

            chatMessages.appendChild(imageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            addMessage(`Huhu tạo ảnh thất bại: ${data.message || 'không rõ lỗi'} 😢`, false);
        }
    } catch (error) {
        console.error('Image generation error:', error);
        addMessage('Lỗi tạo ảnh! Thử lại nha! 😢', false);
    }
}

async function sendMessage() {
    const message = chatInput.value.trim();
    
    if (!message || isWaitingForResponse) return;

    // Add user message to chat
    addMessage(message, true);
    chatInput.value = '';

    // Show typing indicator
    showTyping();
    isWaitingForResponse = true;

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                threadID: THREAD_ID,
                senderID: 'web-user-' + Date.now(),
                message: message,
                body: message,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        hideTyping();
        
        // Process the response
        if (data.success) {
            addMessage(data.reply, false);
            
            // Handle music request if present
            if (data.music && data.music.status && data.music.keyword) {
                console.log('Music request:', data.music.keyword);
                setTimeout(() => {
                    searchMusic(data.music.keyword);
                }, 800);
            }
            
            // Handle image generation if present
            if (data.image && data.image.status && data.image.prompt) {
                console.log('Image generation:', data.image.prompt);
                setTimeout(() => {
                    addMessage(`🎨 Em đang tạo ảnh với mô tả: "${data.image.prompt}" Chờ em 10-15s nha! ✨`, false);
                    setTimeout(() => {
                        generateImage(data.image.prompt);
                    }, 2000); // Wait 2 seconds before calling API
                }, 800);
            }
        } else {
            addMessage('Huhu, mình không hiểu! :(( Hỏi lại nha!', false);
        }
        
    } catch (error) {
        hideTyping();
        console.error('Error:', error);
        addMessage('Có lỗi kết nối! Vui lòng thử lại! 😢', false);
    } finally {
        isWaitingForResponse = false;
        chatInput.focus();
    }
}

/**
 * Toggle chat window (minimize/maximize)
 */
function toggleChat() {
    const container = document.querySelector('.chat-container');
    const messagesArea = document.querySelector('.chat-messages');
    const inputArea = document.querySelector('.chat-input-area');
    
    if (messagesArea.style.display === 'none') {
        messagesArea.style.display = 'flex';
        inputArea.style.display = 'block';
        container.style.height = '600px';
    } else {
        messagesArea.style.display = 'none';
        inputArea.style.display = 'none';
        container.style.height = 'auto';
    }
}
