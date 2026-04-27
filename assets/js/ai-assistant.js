(function () {
  const CHAT_STORAGE_KEY = "virieng.cubi-chat-history";
  const MAX_MESSAGES = 14;
  const DEFAULT_PRODUCTION_API_BASE_URL = "https://web-xcvk.onrender.com";

  const selectors = {
    messages: "#chatMessages",
    form: "#chatForm",
    input: "#chatInput",
    chips: "#chatPromptChips"
  };

  let initialized = false;
  let history = [];

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

  const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

  const isNativeAppRuntime = () =>
    Boolean(window.Capacitor?.isNativePlatform?.()) ||
    window.location.protocol === "capacitor:" ||
    window.location.protocol === "file:";

  const getDefaultNativeApiBaseUrl = () => {
    return DEFAULT_PRODUCTION_API_BASE_URL;
  };

  const getConfiguredApiBaseUrl = () => {
    const runtimeValue =
      window.CUBI_CONFIG?.apiBaseUrl ||
      document.querySelector('meta[name="cubi-api-base-url"]')?.getAttribute("content") ||
      window.localStorage.getItem("virieng.cubi-api-base-url") ||
      "";

    const configuredValue = trimTrailingSlash(String(runtimeValue || "").trim());
    if (configuredValue) {
      return configuredValue;
    }

    if (isNativeAppRuntime()) {
      return getDefaultNativeApiBaseUrl();
    }

    return "";
  };

  const buildApiUrl = (path) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const baseUrl = getConfiguredApiBaseUrl();
    return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
  };

  const createBackendConnectionError = () => {
    const apiBaseUrl = getConfiguredApiBaseUrl() || DEFAULT_PRODUCTION_API_BASE_URL;
    return new Error(
      `Cubi chua noi duoc backend. Hay bat server va kiem tra ket noi toi ${apiBaseUrl}. Neu dang test may that Android thi chay them adb reverse tcp:3000 tcp:3000.`
    );
  };

  const normalizeRequestError = (error) => {
    const rawMessage = String(error?.message || "").trim();
    if (!rawMessage || /failed to fetch|networkerror|load failed/i.test(rawMessage)) {
      return createBackendConnectionError();
    }

    return new Error(rawMessage);
  };

  const normalizeHistoryItem = (item) => {
    if (!item || typeof item !== "object" || typeof item.content !== "string" || !item.content.trim()) {
      return null;
    }

    return {
      role: item.role === "user" ? "user" : "assistant",
      content: item.content.trim(),
      music: item.music && typeof item.music === "object" ? item.music : null
    };
  };

  const readHistory = () => {
    try {
      const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(normalizeHistoryItem).filter(Boolean) : [];
    } catch (error) {
      console.error("Cannot read Cubi history:", error);
      return [];
    }
  };

  const persistHistory = () => {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history.slice(-MAX_MESSAGES)));
  };

  const scrollMessagesToBottom = () => {
    const chatMessages = document.querySelector(selectors.messages);
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  };

  const createMusicCardHtml = (music) => {
    if (!music) return "";

    const title = escapeHtml(music.title || "Bai nhac SoundCloud");
    const artist = escapeHtml(music.artist || "SoundCloud");
    const url = escapeHtml(music.url || music.searchUrl || "https://soundcloud.com");
    const artwork = music.artwork
      ? `<img class="music-card-art" src="${escapeHtml(music.artwork)}" alt="${title}">`
      : `<div class="music-card-art placeholder">♪</div>`;
    const player = music.embedUrl
      ? `
          <div class="music-card-player">
            <iframe
              title="${title}"
              src="${escapeHtml(music.embedUrl)}"
              allow="autoplay"
              loading="lazy"
              referrerpolicy="no-referrer"
            ></iframe>
          </div>
        `
      : "";

    return `
      <div class="music-card">
        <div class="music-card-head">
          ${artwork}
          <div class="music-card-copy">
            <strong>${title}</strong>
            <span>${artist}</span>
          </div>
        </div>
        <div class="music-card-actions">
          <a class="music-action-btn is-primary" href="${url}" target="_blank" rel="noreferrer noopener">Nghe luon</a>
          <a class="music-action-btn" href="https://soundcloud.com" target="_blank" rel="noreferrer noopener">Mo SCL</a>
        </div>
        ${player}
      </div>
    `;
  };

  const renderMessage = (entryInput) => {
    const chatMessages = document.querySelector(selectors.messages);
    if (!chatMessages) return;

    const entry = normalizeHistoryItem(entryInput);
    if (!entry) return;

    const className = entry.role === "user" ? "message user-message" : "message ai-message";
    const avatar = entry.role === "user" ? "🧑" : "✨";

    const messageHtml = `
      <div class="${className}">
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <p>${escapeHtml(entry.content)}</p>
          ${createMusicCardHtml(entry.music)}
        </div>
      </div>
    `;

    chatMessages.insertAdjacentHTML("beforeend", messageHtml);
    scrollMessagesToBottom();
  };

  const renderHistory = () => {
    const chatMessages = document.querySelector(selectors.messages);
    if (!chatMessages) return;

    chatMessages.innerHTML = "";

    if (!history.length) {
      renderMessage({
        role: "assistant",
        content: "Chao ban, minh la Cubi day. Ban muon tam su, hoi meo chi tieu hay bao minh mo nhac la minh mo cho ban luon :3",
        music: null
      });
      return;
    }

    history.forEach((item) => renderMessage(item));
  };

  const setSubmittingState = (isSubmitting) => {
    const form = document.querySelector(selectors.form);
    const input = document.querySelector(selectors.input);
    const button = form?.querySelector("button[type='submit']");

    if (input) input.disabled = isSubmitting;
    if (button) {
      button.disabled = isSubmitting;
      button.textContent = isSubmitting ? "Dang gui..." : "Gui";
    }
  };

  const isSoundCloudUrl = (value) => /^https?:\/\/(soundcloud\.com|on\.soundcloud\.com)\//i.test(value);

  const extractMusicRequest = (value = "") => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (isSoundCloudUrl(trimmed)) {
      return trimmed;
    }

    const normalized = trimmed.toLowerCase();
    const triggers = [
      "mo nhac",
      "mở nhạc",
      "nghe nhac",
      "nghe nhạc",
      "bat nhac",
      "bật nhạc",
      "phat nhac",
      "phát nhạc",
      "mo bai",
      "mở bài",
      "phat bai",
      "phát bài"
    ];

    const matchedTrigger = triggers.find((trigger) => normalized.includes(trigger));
    if (!matchedTrigger) {
      return "";
    }

    const query = trimmed
      .replace(new RegExp(matchedTrigger, "i"), "")
      .replace(/^(cho|minh|toi|giup|minh voi|ho)\s+/i, "")
      .trim();

    return query || "nhac chill";
  };

  const buildFallbackMusicReply = (value) => {
    const target = isSoundCloudUrl(value)
      ? value
      : `https://soundcloud.com/search/sounds?q=${encodeURIComponent(value)}`;

    return {
      role: "assistant",
      content: isSoundCloudUrl(value)
        ? "Cubi mo dung link SoundCloud cho ban roi, bam Nghe luon nha :3"
        : `Cubi tim voi tu khoa "${value}" roi do, bam Nghe luon nha :3`,
      music: {
        title: value,
        artist: "SoundCloud",
        url: target,
        searchUrl: target,
        embedUrl: isSoundCloudUrl(value)
          ? `https://w.soundcloud.com/player/?url=${encodeURIComponent(value)}&color=%230f766e&auto_play=true&hide_related=false&show_comments=false&show_user=true&show_reposts=false&visual=true`
          : "",
        artwork: ""
      }
    };
  };

  const fetchMusicTrack = async (query) => {
    const response = await fetch(buildApiUrl("/api/soundcloud/search"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.track) {
      throw new Error(payload.error || "Khong tim thay bai phu hop.");
    }

    return {
      role: "assistant",
      content: `Cubi keo bai "${payload.track.title}" cho ban roi do :3`,
      music: payload.track
    };
  };

  const sendChatMessage = async (message) => {
    try {
      const response = await fetch(buildApiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          messages: history.slice(-MAX_MESSAGES)
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload.reply) {
        return String(payload.reply).trim();
      }

      if (response.status === 0) {
        throw new Error("Cubi chua ket noi duoc toi may chu.");
      }

      throw new Error(payload?.error || "Khong the noi chuyen voi Cubi luc nay.");
    } catch (error) {
      throw normalizeRequestError(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const input = document.querySelector(selectors.input);
    const message = input?.value?.trim();
    if (!message) return;

    history.push({ role: "user", content: message, music: null });
    persistHistory();
    renderMessage(history[history.length - 1]);

    if (input) input.value = "";

    const musicRequest = extractMusicRequest(message);
    if (musicRequest) {
      setSubmittingState(true);

      try {
        const reply = isSoundCloudUrl(musicRequest)
          ? buildFallbackMusicReply(musicRequest)
          : await fetchMusicTrack(musicRequest).catch(() => buildFallbackMusicReply(musicRequest));

        history.push(reply);
        history = history.slice(-MAX_MESSAGES);
        persistHistory();
        renderMessage(history[history.length - 1]);
      } finally {
        setSubmittingState(false);
        input?.focus();
      }

      return;
    }

    setSubmittingState(true);

    try {
      const reply = await sendChatMessage(message);
      history.push({
        role: "assistant",
        content: reply || "Minh dang dung hinh mot chut, ban nhan lai giup minh nhe :3",
        music: null
      });
      history = history.slice(-MAX_MESSAGES);
      persistHistory();
      renderMessage(history[history.length - 1]);
    } catch (error) {
      console.error("Cubi chat error:", error);
      renderMessage({
        role: "assistant",
        content: error.message || "Cubi dang bi nghen ti, ban thu lai sau nhe.",
        music: null
      });
    } finally {
      setSubmittingState(false);
      input?.focus();
    }
  };

  const bindChatPromptChips = () => {
    const chips = document.querySelector(selectors.chips);
    const input = document.querySelector(selectors.input);
    if (!chips || !input) return;

    chips.addEventListener("click", (event) => {
      const button = event.target.closest("[data-chat-prompt]");
      if (!button) return;
      input.value = button.dataset.chatPrompt || "";
      input.focus();
    });
  };

  const initChat = () => {
    if (initialized) {
      scrollMessagesToBottom();
      return;
    }

    initialized = true;
    history = readHistory().slice(-MAX_MESSAGES);
    renderHistory();

    const form = document.querySelector(selectors.form);
    form?.addEventListener("submit", handleSubmit);

    bindChatPromptChips();
  };

  window.AIAssistant = { initChat };
})();
