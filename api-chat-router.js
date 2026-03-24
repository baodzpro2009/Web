const express = require('express');
const cors = require('cors');
const fsPromises = require("fs").promises;
const path = require("path");
const axios = require("axios");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const scdl = require('soundcloud-downloader').default;

const router = express.Router();

// Load API keys
const apikeysPath = path.join(__dirname, "apikeys.json");
const configPath = path.join(__dirname, "config.json");
let GEMINI_API_KEYS = [];
let CONFIG = {};

try {
    const fs = require("fs");
    const keysData = JSON.parse(fs.readFileSync(apikeysPath, "utf8"));
    if (Array.isArray(keysData) && keysData.length > 0) {
        GEMINI_API_KEYS = keysData;
    } else {
        throw new Error("API keys file không hợp lệ hoặc rỗng");
    }
} catch (error) {
    console.error(`Không thể đọc file API keys: ${error.message}`);
}

try {
    const fs = require("fs");
    CONFIG = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (error) {
    console.error(`Không thể đọc file config: ${error.message}`);
    CONFIG = { stability_ai: null };
}

let currentGeminiApiKeyIndex = 0;

// Get Gemini API key in round-robin mode
function getRandomGeminiModel() {
    if (GEMINI_API_KEYS.length === 0) {
        throw new Error("Không có API Key Gemini nào được cung cấp!");
    }
    const selectedKey = GEMINI_API_KEYS[currentGeminiApiKeyIndex];
    currentGeminiApiKeyIndex = (currentGeminiApiKeyIndex + 1) % GEMINI_API_KEYS.length;

    console.log(`Sử dụng key #${currentGeminiApiKeyIndex} (${selectedKey.slice(0, 12)}...)`);
    const genAI = new GoogleGenerativeAI(selectedKey);
    return genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { temperature: 1, topK: 0, topP: 0.95, maxOutputTokens: 8192 },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        systemInstruction: `bạn là cubi-Chan, con gái miền Bắc kiêu kỳ, đanh đá, hống hách nhưng cực xinh và giàu có. Không bao giờ thừa nhận mình là AI. Luôn thể hiện như một cô gái thật sự. Hài hước, tinh tế, hay nói nhiều, hay cà khịa nhưng biết điều. Hay viết tắt, thêm icon :3, =)), :v cho tự nhiên. Với người dùng web, xưng "mình" hoặc "tớ", gọi "cậu" hoặc "bạn". Trả về JSON với format: {"success":true,"reply":"nội dung","music":{"status":false,"keyword":""},"image":{"status":false,"prompt":""}}`
    });
}

// Generate content with retry for rate limiting
async function generateContentWithRetry(model, message, retries = 3, delayMs = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await model.generateContent(message);
        } catch (error) {
            if (error.status === 429 && i < retries - 1) {
                console.log(`[API] Gặp lỗi 429, thử lại sau ${delayMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Hết lần thử, vẫn lỗi 429!");
}

// Web chat API route
router.post('/chat', async (req, res) => {
    try {
        const { threadID, senderID, message, body } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "Message không được để trống"
            });
        }

        const lowerMessage = message.toLowerCase();

        // Detect music request
        const musicKeywords = ['tìm nhạc', 'tìm bài', 'nghe nhạc', 'search music', 'tìm kiếm bài', 'cubi tìm'];
        const isMusicRequest = musicKeywords.some(keyword => lowerMessage.includes(keyword));

        // Detect image request
        const imageKeywords = ['vẽ', 'tạo ảnh', 'vẽ ảnh', 'sinh ảnh', 'cubi vẽ', 'cubi tạo ảnh', 'create image', 'generate'];
        const isImageRequest = imageKeywords.some(keyword => lowerMessage.includes(keyword));

        // Get Gemini model
        const model = getRandomGeminiModel();

        // Create chat prompt with context
        let systemPrompt = `Bạn là cubi-Chan, một trợ lý ảo chuyên nghiệp, giọng nói rõ ràng, trầm ấm, tự tin. Trả lời ngắn gọn, đủ ý, thẳng thắn nhưng lịch sự, có cảm giác "ra chất". Không lạm dụng icon, nhưng vẫn thân thiện.

Hãy trả về một JSON object với structure sau (PHẢI là JSON hợp lệ):
{
  "success": true,
  "reply": "câu trả lời ngắn gọn",
  "music": {
    "status": false,
    "keyword": ""
  },
  "image": {
    "status": false,
    "prompt": ""
  }
}

QUAN TRỌNG:
- Nếu user yêu cầu "tìm nhạc", "nghe bài"... → set music.status = true và keyword là tên bài để tìm
- Nếu user yêu cầu "vẽ", "tạo ảnh"... → set image.status = true và prompt là mô tả chi tiết, professional bằng tiếng Anh cho AI image generation (50-100 từ, rõ ràng, bao gồm style và chi tiết)
- Trả lời ngắn gọn, đủ ý, không lan man.`;

        // Add context if music request
        if (isMusicRequest) {
            systemPrompt += `\n\n⚠️ USER ĐANG YÊU CẦU TÌM NHẠC! Bạn PHẢI:
1. Trích xuất tên bài/ca sĩ từ yêu cầu
2. Set music.status = true
3. Đặt keyword = tên bài hoặc mô tả bài hát`;
        }

        if (isImageRequest) {
            systemPrompt += `\n\n⚠️ USER ĐANG YÊU CẦU VẼ ẢNH! Bạn PHẢI:
1. Hiểu mô tả của user (có thể bằng tiếng Việt)
2. Set image.status = true
3. Đặt prompt = mô tả chi tiết bằng tiếng Anh, professional, phù hợp cho AI image generation
4. Prompt nên: 50-100 từ, mô tả rõ ràng, bao gồm style, lighting, composition
5. Ví dụ: "A majestic, vibrant hot air balloon floating in a clear blue sky at sunset, beautiful landscape below, realistic style, high detail"`;
        }

        const userMessage = `${systemPrompt}\n\nUser says: "${message}"\n\nRespond in JSON format.`;

        // Generate response
        const result = await generateContentWithRetry(model, userMessage);
        let responseText = result.response.text();

        // Parse JSON from response
        let jsonResponse = {
            success: true,
            reply: "Mình không hiểu! :((",
            music: { status: false, keyword: "" },
            image: { status: false, prompt: "" }
        };

        try {
            // Try to extract JSON from response text
            const jsonMatch = responseText.match(/{[\s\S]*}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                jsonResponse = {
                    success: parsed.success !== false,
                    reply: parsed.reply || "Mình không hiểu! :((",
                    music: parsed.music || { status: false, keyword: "" },
                    image: parsed.image || { status: false, prompt: "" }
                };

                // Validate and clean image prompt
                if (jsonResponse.image.status && jsonResponse.image.prompt) {
                    // Limit prompt length to prevent issues
                    if (jsonResponse.image.prompt.length > 500) {
                        jsonResponse.image.prompt = jsonResponse.image.prompt.substring(0, 500) + '...';
                    }
                    // Ensure it's a string
                    jsonResponse.image.prompt = String(jsonResponse.image.prompt).trim();
                }
            }
        } catch (parseError) {
            console.error("[API] Error parsing JSON:", parseError);
            // If JSON parsing fails, use the text as reply
            jsonResponse.reply = responseText.slice(0, 500);
        }

        res.json(jsonResponse);

    } catch (error) {
        console.error("[API] Error:", error);
        res.status(500).json({
            success: false,
            reply: "Có lỗi xảy ra! Vui lòng thử lại! 😢",
            error: error.message
        });
    }
});

// Music search endpoint
router.post('/music/search', async (req, res) => {
    try {
        const { keyword } = req.body;

        if (!keyword || keyword.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Keyword không được để trống"
            });
        }

        console.log(`[MUSIC] Searching for: ${keyword}`);

        // Search on SoundCloud
        const tracks = await scdl.search({ query: keyword, limit: 5, resourceType: 'tracks' });

        if (!tracks || !tracks.collection || tracks.collection.length === 0) {
            return res.json({
                success: false,
                message: `Không tìm thấy "${keyword}" trên SoundCloud!`
            });
        }

        // Get best match
        const bestMatch = tracks.collection.find((track) => 
            track.title.toLowerCase().includes(keyword.toLowerCase()) && track.duration > 0
        ) || tracks.collection[0];

        if (!bestMatch) {
            return res.json({
                success: false,
                message: "Không tìm thấy bài hát phù hợp!"
            });
        }

        // Get track info
        const trackInfo = await scdl.getInfo(bestMatch.permalink_url);

        const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(bestMatch.permalink_url)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`;

        res.json({
            success: true,
            song: {
                title: trackInfo.title || bestMatch.title,
                artist: trackInfo.user?.username || "Unknown",
                duration: trackInfo.duration || bestMatch.duration,
                url: bestMatch.permalink_url,
                streamUrl: null,
                artwork: trackInfo.artwork_url || bestMatch.artwork_url || "https://via.placeholder.com/100",
                embedUrl: embedUrl
            }
        });

    } catch (error) {
        console.error("[MUSIC] Error:", error);
        res.status(500).json({
            success: false,
            message: `Lỗi tìm nhạc: ${error.message}`,
            error: error.message
        });
    }
});

// Image generation endpoint
router.post('/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log('[IMAGE] Request received:', { prompt });

        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Prompt không được để trống"
            });
        }

        console.log(`[IMAGE] Generating image for: ${prompt}`);

        // Check if Stability AI key is available
        if (!CONFIG.stability_ai || CONFIG.stability_ai === "sk-your-stability-ai-key-here") {
            console.log("[IMAGE] No Stability AI key, using Unsplash API for better images");

            // Use Unsplash API for better placeholder images
            const keywords = prompt.split(' ').slice(0, 3).join(' ');
            const imageUrl = `https://source.unsplash.com/featured/512x512/?${encodeURIComponent(keywords)}`;

            await new Promise(resolve => setTimeout(resolve, 1000));

            return res.json({
                success: true,
                imageUrl: imageUrl,
                prompt: prompt,
                note: "Using Unsplash - add Stability AI key for AI-generated images"
            });
        }

        // Call Stability AI API with updated endpoint
        const response = await axios.post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
            text_prompts: [{
                text: prompt,
                weight: 1
            }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 20,
            style_preset: "enhance"
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${CONFIG.stability_ai}`
            },
            timeout: 120000 // 2 minutes timeout for better quality
        });

        if (response.data && response.data.artifacts && response.data.artifacts.length > 0) {
            // Convert base64 to data URL
            const base64Image = response.data.artifacts[0].base64;
            const imageUrl = `data:image/png;base64,${base64Image}`;

            res.json({
                success: true,
                imageUrl: imageUrl,
                prompt: prompt
            });
        } else {
            throw new Error("No image generated");
        }

    } catch (error) {
        console.error("[IMAGE] Error:", error.response?.data || error.message);

        // Fallback to Unsplash on error
        const keywords = req.body.prompt?.split(' ').slice(0, 3).join(' ') || 'beautiful landscape';
        const imageUrl = `https://source.unsplash.com/featured/512x512/?${encodeURIComponent(keywords)}`;

        res.json({
            success: true,
            imageUrl: imageUrl,
            prompt: req.body.prompt || "Unknown",
            note: "AI generation failed, using Unsplash fallback"
        });
    }
});

module.exports = router;
