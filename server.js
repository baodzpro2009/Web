const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const SITE_FILE = path.join(DATA_DIR, "site.json");
const sessions = new Map();

const MIME_TYPES = {
  ".htm": "text/html; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const readJson = (filePath, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
};

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};

const sendJson = (res, statusCode, data, headers = {}) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
  res.end(JSON.stringify(data));
};

const sendFile = (res, filePath) => {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
  });
  fs.createReadStream(filePath).pipe(res);
};

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });

const parseCookies = (cookieHeader = "") =>
  cookieHeader.split(";").reduce((acc, item) => {
    const [key, ...rest] = item.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});

const requireAuth = (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = sessions.get(cookies.session_id || "");
  if (!session) {
    sendJson(res, 401, { error: "Unauthorized" });
    return null;
  }
  return session;
};

const routeStatic = (pathname) => {
  if (pathname === "/") return path.join(ROOT, "index.htm");
  const safePath = pathname.replace(/^\/+/, "");
  return path.join(ROOT, safePath);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/api/site") {
    return sendJson(res, 200, readJson(SITE_FILE, {}));
  }

  if (req.method === "POST" && pathname === "/api/admin/login") {
    try {
      const body = await parseBody(req);
      const site = readJson(SITE_FILE, {});
      const admin = site.admin || {};
      const valid = body.username === admin.username && body.password === admin.password;

      if (!valid) {
        return sendJson(res, 401, { error: "Sai tai khoan hoac mat khau" });
      }

      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, { username: body.username, createdAt: Date.now() });
      return sendJson(
        res,
        200,
        { ok: true, username: body.username },
        { "Set-Cookie": `session_id=${sessionId}; HttpOnly; Path=/; Max-Age=28800` }
      );
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === "POST" && pathname === "/api/admin/logout") {
    const cookies = parseCookies(req.headers.cookie);
    sessions.delete(cookies.session_id || "");
    return sendJson(res, 200, { ok: true }, { "Set-Cookie": "session_id=; HttpOnly; Path=/; Max-Age=0" });
  }

  if (req.method === "GET" && pathname === "/api/admin/session") {
    const cookies = parseCookies(req.headers.cookie);
    const session = sessions.get(cookies.session_id || "");
    return sendJson(res, 200, { authenticated: Boolean(session), username: session?.username || null });
  }

  if (req.method === "PUT" && pathname === "/api/site") {
    if (!requireAuth(req, res)) return;
    try {
      const body = await parseBody(req);
      const current = readJson(SITE_FILE, {});
      const next = { ...current, ...body };
      writeJson(SITE_FILE, next);
      return sendJson(res, 200, next);
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  return sendFile(res, routeStatic(pathname));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
