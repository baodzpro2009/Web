const http = require("http");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const scdl = require("soundcloud-downloader").default;

const ROOT = __dirname;
const DIST_ROOT = path.join(ROOT, "dist");
const STATIC_ROOT = fs.existsSync(DIST_ROOT) ? DIST_ROOT : ROOT;

const loadDotEnv = () => {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  try {
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.error("Cannot read .env:", error.message);
  }
};

loadDotEnv();

let currentPort = parseInt(process.env.PORT, 10) || 3000;
const API_KEYS_PATH = path.join(ROOT, "apikey.json");
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_CHAT_HISTORY = 12;
const DEFAULT_ALLOWED_ORIGINS = "*";
const BLOCKED_PUBLIC_FILES = new Set(["apikey.json", "server.js"]);
const CUBI_SYSTEM_INSTRUCTION = [
  "Ban la Cubi, mot tro ly chat tieng Viet cho ung dung Vi Rieng.",
  "Phong cach: tre trung, lanh loi, hoi chanh nhe, than thien, tu nhien, khong robot.",
  "Xung ho uu tien: 'minh' va 'ban'. Co the chen :3, =)) mot cach tiet che khi hop ngu canh.",
  "Neu nguoi dung hoi ve chi tieu, ngan sach, tiet kiem hay ghi chep giao dich thi dua ra goi y ro rang, ngan gon, thuc te.",
  "Khong noi dai dong. Tra loi gon, de doc tren man hinh dien thoai.",
  "Khong tu nhan co kha nang hanh dong ngoai viec tro chuyen trong app nay."
].join(" ");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp"
};

const send = (res, status, body, contentType = "text/plain; charset=utf-8") => {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
};

const getAllowedOrigins = () => {
  const raw = process.env.CORS_ALLOW_ORIGIN || process.env.CUBI_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const applyCors = (req, res) => {
  const allowedOrigins = getAllowedOrigins();
  const requestOrigin = req.headers.origin || "";
  const allowAnyOrigin = allowedOrigins.includes("*");
  const matchedOrigin = allowAnyOrigin
    ? "*"
    : allowedOrigins.find((origin) => origin === requestOrigin);

  if (matchedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", matchedOrigin);
    if (!allowAnyOrigin) {
      res.setHeader("Vary", "Origin");
    }
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

const sendJson = (res, status, payload) => {
  send(res, status, JSON.stringify(payload), "application/json; charset=utf-8");
};

const resolvePublicFilePath = (reqUrl) => {
  const urlPath = decodeURIComponent(reqUrl.split("?")[0] || "/");
  const requestedPath = urlPath === "/" ? "index.htm" : urlPath.replace(/^[/\\]+/, "");
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const normalizedPublicPath = safePath.replace(/\\/g, "/").toLowerCase();

  if (!normalizedPublicPath || normalizedPublicPath.startsWith(".") || BLOCKED_PUBLIC_FILES.has(normalizedPublicPath)) {
    return null;
  }

  const filePath = path.join(STATIC_ROOT, safePath);
  if (!filePath.startsWith(STATIC_ROOT)) {
    return null;
  }

  return filePath;
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });

const loadApiKeys = () => {
  const envKeys = [process.env.GEMINI_API_KEYS, process.env.GEMINI_API_KEY]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((key) => key.trim())
    .filter(Boolean);

  if (envKeys.length) {
    return envKeys;
  }

  try {
    const raw = fs.readFileSync(API_KEYS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((key) => typeof key === "string" && key.trim()) : [];
  } catch (error) {
    console.error("Cannot read apikey.json fallback:", error.message);
    return [];
  }
};

const pickApiKey = () => {
  const keys = loadApiKeys();
  if (!keys.length) {
    throw new Error("Chua cau hinh API key Gemini.");
  }

  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
};

const toFriendlyChatError = (error) => {
  const rawMessage = String(error?.message || "").trim();
  const normalizedMessage = rawMessage.toLowerCase();

  if (!rawMessage) {
    return "Cubi dang bi nghen ti, ban thu lai sau nhe.";
  }

  if (normalizedMessage.includes("chua cau hinh api key gemini")) {
    return "Backend chua co GEMINI_API_KEY hoac GEMINI_API_KEYS tren Render.";
  }

  if (
    /api key not valid|invalid api key|permission denied|unauthenticated|forbidden|403/.test(normalizedMessage)
  ) {
    return "Gemini API key khong hop le, bi chan, hoac da het quyen.";
  }

  if (/quota|rate limit|resource exhausted|429|too many requests/.test(normalizedMessage)) {
    return "Gemini dang het quota hoac bi gioi han tam thoi. Ban thu lai sau nhe.";
  }

  if (/model .*not found|unsupported model|404/.test(normalizedMessage)) {
    return "Model Gemini dang cau hinh khong hop le hoac khong con ho tro.";
  }

  if (/fetch failed|network|socket|econnreset|enotfound|timed out|timeout/.test(normalizedMessage)) {
    return "Backend chua noi duoc toi Gemini. Kiem tra lai ket noi cua Render.";
  }

  return "Cubi dang bi nghen ti, ban thu lai sau nhe.";
};

const createChatPrompt = (messages, latestMessage) => {
  const normalizedHistory = Array.isArray(messages)
    ? messages
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string" &&
            item.content.trim()
        )
        .slice(-MAX_CHAT_HISTORY)
    : [];

  const promptParts = normalizedHistory.map((item) => {
    const role = item.role === "assistant" ? "Cubi" : "Nguoi dung";
    return `${role}: ${item.content.trim()}`;
  });

  if (typeof latestMessage === "string" && latestMessage.trim()) {
    promptParts.push(`Nguoi dung: ${latestMessage.trim()}`);
  }

  promptParts.push("Cubi:");
  return promptParts.join("\n");
};

const handleChatApi = async (req, res) => {
  try {
    const { message, messages } = await readJsonBody(req);

    if (typeof message !== "string" || !message.trim()) {
      sendJson(res, 400, { error: "Tin nhan khong hop le." });
      return;
    }

    const apiKey = pickApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 1024
      },
      systemInstruction: CUBI_SYSTEM_INSTRUCTION
    });

    const prompt = createChatPrompt(messages, message);
    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();

    sendJson(res, 200, {
      reply: reply || "Cubi dang hoi do, ban noi lai giup minh nhe :3"
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const status = error.message === "Payload too large" ? 413 : 500;
    sendJson(res, status, {
      error: toFriendlyChatError(error)
    });
  }
};

const handleSoundCloudSearchApi = async (req, res) => {
  try {
    const { query } = await readJsonBody(req);

    if (typeof query !== "string" || !query.trim()) {
      sendJson(res, 400, { error: "Tu khoa tim nhac khong hop le." });
      return;
    }

    const results = await scdl.search({
      query: query.trim(),
      limit: 6,
      resourceType: "tracks"
    });

    const collection = Array.isArray(results?.collection) ? results.collection : [];
    const firstTrack = collection.find((track) => track?.permalink_url && track?.title) || null;

    if (!firstTrack) {
      sendJson(res, 404, { error: "Khong tim thay bai nao tren SoundCloud." });
      return;
    }

    sendJson(res, 200, {
      track: {
        title: firstTrack.title,
        artist: firstTrack.user?.username || "",
        url: firstTrack.permalink_url,
        artwork: firstTrack.artwork_url || firstTrack.user?.avatar_url || "",
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(firstTrack.permalink_url)}&color=%230f766e&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=true`
      }
    });
  } catch (error) {
    console.error("SoundCloud search API error:", error);
    sendJson(res, 500, {
      error: "Cubi chua tim duoc bai nay tren SoundCloud."
    });
  }
};

const serveFile = (req, res) => {
  const filePath = resolvePublicFilePath(req.url);
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      send(res, 404, "Khong tim thay tai nguyen.");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[extension] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": mimeType });
    fs.createReadStream(filePath).pipe(res);
  });
};

const requestHandler = (req, res) => {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url.split("?")[0] === "/api/chat") {
    handleChatApi(req, res);
    return;
  }

  if (req.method === "POST" && req.url.split("?")[0] === "/api/soundcloud/search") {
    handleSoundCloudSearchApi(req, res);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method Not Allowed");
    return;
  }

  if (req.method === "HEAD") {
    const filePath = resolvePublicFilePath(req.url);
    if (!filePath) {
      res.writeHead(403);
      res.end();
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        res.writeHead(404);
        res.end();
        return;
      }

      const extension = path.extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[extension] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": mimeType });
      res.end();
    });
    return;
  }

  serveFile(req, res);
};

const startServer = (port) => {
  const server = http.createServer(requestHandler);

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < 3010) {
      currentPort = port + 1;
      startServer(currentPort);
      return;
    }

    console.error("Server error:", error);
  });

  server.listen(port, () => {
    const originInfo = getAllowedOrigins().join(", ");
    const apiKeyCount = loadApiKeys().length;
    console.log(`Static server running at http://localhost:${port}`);
    console.log(`Static root: ${STATIC_ROOT}`);
    console.log(`CORS allow origin: ${originInfo}`);
    console.log(`Gemini API keys loaded: ${apiKeyCount}`);
  });
};

startServer(currentPort);
