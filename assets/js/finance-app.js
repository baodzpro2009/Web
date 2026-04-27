const STORAGE_KEYS = {
  onboarding: "virieng.onboarding",
  theme: "virieng.theme",
  entries: "virieng.entries",
  budgets: "virieng.budgets",
  goal: "virieng.goal",
  dataVersion: "virieng.data-version"
};

const APP_DATA_VERSION = "2026-04-empty-start";

const CATEGORY_META = {
  income: {
    "Lương": { icon: "💼", keywords: ["luong", "salary", "payroll"] },
    "Freelance": { icon: "🧩", keywords: ["freelance", "du an", "project", "thiet ke"] },
    "Thưởng": { icon: "🎁", keywords: ["thuong", "bonus", "thuong nong"] },
    "Hoàn tiền": { icon: "↩️", keywords: ["hoan tien", "refund", "cashback"] },
    "Khác": { icon: "✨", keywords: [] }
  },
  expense: {
    "Ăn uống": { icon: "🍜", keywords: ["an", "trua", "toi", "sang", "tra sua", "ca phe", "do an", "com", "banh"] },
    "Di chuyển": { icon: "🚗", keywords: ["xang", "grab", "taxi", "di chuyen", "gui xe", "ve xe"] },
    "Nhà ở": { icon: "🏠", keywords: ["tien nha", "thue nha", "nha", "phong tro"] },
    "Hóa đơn": { icon: "💡", keywords: ["dien", "nuoc", "wifi", "internet", "hoa don", "dien thoai"] },
    "Mua sắm": { icon: "🛍️", keywords: ["mua", "shopping", "quan ao", "giay", "sieu thi"] },
    "Giải trí": { icon: "🎮", keywords: ["xem phim", "game", "giai tri", "du lich", "ca nhac"] },
    "Học tập": { icon: "📚", keywords: ["hoc", "khoa hoc", "sach", "hoc phi", "course"] },
    "Sức khỏe": { icon: "🩺", keywords: ["thuoc", "kham", "benh vien", "bao hiem", "suc khoe"] },
    "Khác": { icon: "🧾", keywords: [] }
  }
};

const DEFAULT_ENTRIES = [];
const DEFAULT_BUDGETS = [];
const DEFAULT_GOAL = 30000000;

const QUICK_ADD_PRESETS = [
  { label: "Ăn sáng 30k", title: "Ăn sáng 30k", type: "expense", category: "Ăn uống", amount: 30000 },
  { label: "Đổ xăng 100k", title: "Đổ xăng 100k", type: "expense", category: "Di chuyển", amount: 100000 },
  { label: "Lương 18tr", title: "Lương tháng", type: "income", category: "Lương", amount: 18000000 },
  { label: "Trà sữa 45k", title: "Trà sữa 45k", type: "expense", category: "Ăn uống", amount: 45000 }
];

const CHART_COLORS = ["#0f766e", "#1d4ed8", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316"];

const resetStoredData = () => {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(DEFAULT_ENTRIES));
  localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(DEFAULT_BUDGETS));
  localStorage.setItem(STORAGE_KEYS.goal, String(DEFAULT_GOAL));
  localStorage.setItem(STORAGE_KEYS.dataVersion, APP_DATA_VERSION);
};

if (localStorage.getItem(STORAGE_KEYS.dataVersion) !== APP_DATA_VERSION) {
  resetStoredData();
}

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch (error) {
    console.error(`Invalid localStorage JSON for ${key}:`, error);
    localStorage.removeItem(key);
    return fallback;
  }
};

const sanitizeEntries = (value) =>
  Array.isArray(value)
    ? value.filter(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          typeof entry.id === "string" &&
          typeof entry.title === "string" &&
          Number.isFinite(Number(entry.amount)) &&
          typeof entry.type === "string" &&
          typeof entry.category === "string" &&
          typeof entry.date === "string"
      )
    : DEFAULT_ENTRIES;

const sanitizeBudgets = (value) =>
  Array.isArray(value)
    ? value.filter(
        (budget) =>
          budget &&
          typeof budget === "object" &&
          typeof budget.category === "string" &&
          Number.isFinite(Number(budget.limit))
      )
    : DEFAULT_BUDGETS;

const savedEntries = sanitizeEntries(readJson(STORAGE_KEYS.entries, DEFAULT_ENTRIES));
const savedBudgets = sanitizeBudgets(readJson(STORAGE_KEYS.budgets, DEFAULT_BUDGETS));

const state = {
  currentScreen: "splash",
  onboardingIndex: 0,
  darkMode: localStorage.getItem(STORAGE_KEYS.theme) === "dark",
  entries: savedEntries,
  budgets: savedBudgets,
  savingsGoal: Number(localStorage.getItem(STORAGE_KEYS.goal) || String(DEFAULT_GOAL)),
  selectedEntryId: savedEntries[0]?.id || "",
  historySearch: "",
  historyType: "all",
  historyCategory: "all",
  historyMonth: new Date().toISOString().slice(0, 7),
  liteMode: false,
  chatInitialized: false
};

const screens = Array.from(document.querySelectorAll("[data-screen]"));
const bottomNav = document.querySelector("#bottomNav");
const onboardingSlides = Array.from(document.querySelectorAll(".onboarding-slide"));
const onboardingDots = Array.from(document.querySelectorAll("#onboardingDots span"));
const nextOnboardingButton = document.querySelector("#nextOnboarding");
const skipOnboardingButton = document.querySelector("#skipOnboarding");
const summaryHero = document.querySelector("#summaryHero");
const homeInsightGrid = document.querySelector("#homeInsightGrid");
const reminderList = document.querySelector("#reminderList");
const recentList = document.querySelector("#recentList");
const quickEntryForm = document.querySelector("#quickEntryForm");
const quickAddChips = document.querySelector("#quickAddChips");
const smartHint = document.querySelector("#smartHint");
const entryTitle = document.querySelector("#entryTitle");
const entryAmount = document.querySelector("#entryAmount");
const entryType = document.querySelector("#entryType");
const entryCategory = document.querySelector("#entryCategory");
const entryDate = document.querySelector("#entryDate");
const historySearch = document.querySelector("#historySearch");
const historyType = document.querySelector("#historyType");
const historyCategory = document.querySelector("#historyCategory");
const historyMonth = document.querySelector("#historyMonth");
const historyList = document.querySelector("#historyList");
const detailView = document.querySelector("#detailView");
const budgetView = document.querySelector("#budgetView");
const insightView = document.querySelector("#insightView");
const settingsView = document.querySelector("#settingsView");

const currency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);

const monthFormatter = new Intl.DateTimeFormat("vi-VN", { month: "short", year: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const normalizeText = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getTodayString = () => new Date().toISOString().slice(0, 10);
const getMonthKey = (value) => new Date(value).toISOString().slice(0, 7);
const formatDate = (value) => dateFormatter.format(new Date(value));
const formatMonth = (monthKey) => monthFormatter.format(new Date(`${monthKey}-01T00:00:00`));
const generateId = (prefix) => `${prefix}-${Date.now()}`;

const getPreviousMonthKey = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const persistEntries = () => localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(state.entries));
const persistBudgets = () => localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(state.budgets));
const persistGoal = () => localStorage.setItem(STORAGE_KEYS.goal, String(state.savingsGoal));
const runIdle = (callback) =>
  typeof window.requestIdleCallback === "function"
    ? window.requestIdleCallback(callback, { timeout: 600 })
    : window.setTimeout(callback, 120);

const safeRun = (label, task) => {
  try {
    return task();
  } catch (error) {
    console.error(`Render/boot error at ${label}:`, error);
    return null;
  }
};

const detectLiteMode = () =>
  /Android/i.test(navigator.userAgent) ||
  (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4) ||
  (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 6) ||
  (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

const setTheme = (isDark) => {
  state.darkMode = isDark;
  document.body.dataset.theme = isDark ? "dark" : "light";
  localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
};

const renderHomeScreen = () => {
  renderSummaryHero();
  renderHomeInsightGrid();
  renderReminderList();
  renderRecentList();
};

const renderActiveScreen = (screenName) => {
  switch (screenName) {
    case "home":
      renderHomeScreen();
      break;
    case "history":
      renderHistoryList();
      break;
    case "detail":
      renderDetailView();
      break;
    case "budget":
      renderBudgetView();
      break;
    case "insights":
      renderInsightView();
      break;
    case "settings":
      renderSettingsView();
      break;
    default:
      break;
  }
};

const showScreen = (screenName) => {
  state.currentScreen = screenName;
  screens.forEach((screen) => {
    screen.classList.toggle("screen-active", screen.dataset.screen === screenName);
  });

  const showBottomNav = ["home", "add", "history", "budget", "chat"].includes(screenName);
  bottomNav.classList.toggle("is-visible", showBottomNav);

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.openScreen === screenName);
  });

  renderActiveScreen(screenName);

  if (screenName === "chat" && !state.chatInitialized) {
    state.chatInitialized = true;
    window.AIAssistant?.initChat?.();
  }
};

const completeOnboarding = () => {
  localStorage.setItem(STORAGE_KEYS.onboarding, "done");
  showScreen("home");
};

const getEntryById = (entryId) => state.entries.find((entry) => entry.id === entryId) || null;

const getEntriesForMonth = (monthKey) => state.entries.filter((entry) => getMonthKey(entry.date) === monthKey);

const getMonthlyIncome = (monthKey = state.historyMonth) =>
  getEntriesForMonth(monthKey)
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);

const getMonthlyExpense = (monthKey = state.historyMonth) =>
  getEntriesForMonth(monthKey)
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);

const getTotalBalance = () => {
  const income = state.entries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = state.entries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  return income - expense;
};

const getSavingsRate = (monthKey = state.historyMonth) => {
  const income = getMonthlyIncome(monthKey);
  if (!income) return 0;
  return Math.max(0, Math.round(((income - getMonthlyExpense(monthKey)) / income) * 100));
};

const getBudgetByCategory = (category) => state.budgets.find((budget) => budget.category === category);

const getBudgetSpending = (category, monthKey = state.historyMonth) =>
  getEntriesForMonth(monthKey)
    .filter((entry) => entry.type === "expense" && entry.category === category)
    .reduce((sum, entry) => sum + entry.amount, 0);

const getCategoryBreakdown = (monthKey = state.historyMonth) => {
  const expenseEntries = getEntriesForMonth(monthKey).filter((entry) => entry.type === "expense");
  const total = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0) || 1;
  const grouped = {};

  expenseEntries.forEach((entry) => {
    grouped[entry.category] = (grouped[entry.category] || 0) + entry.amount;
  });

  return Object.entries(grouped)
    .map(([category, amount], index) => ({
      category,
      amount,
      ratio: Math.round((amount / total) * 100),
      color: CHART_COLORS[index % CHART_COLORS.length],
      icon: CATEGORY_META.expense[category]?.icon || "🧾"
    }))
    .sort((a, b) => b.amount - a.amount);
};

const getFilteredEntries = () => {
  const query = normalizeText(state.historySearch);

  return [...state.entries]
    .filter((entry) => (state.historyType === "all" ? true : entry.type === state.historyType))
    .filter((entry) => (state.historyCategory === "all" ? true : entry.category === state.historyCategory))
    .filter((entry) => (state.historyMonth ? getMonthKey(entry.date) === state.historyMonth : true))
    .filter((entry) =>
      !query
        ? true
        : normalizeText([entry.title, entry.note, entry.category, entry.account].join(" ")).includes(query)
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};

const getRecentEntries = () => [...state.entries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

const getUpcomingBills = () => {
  const today = new Date(getTodayString());
  return state.entries
    .filter((entry) => entry.type === "expense" && entry.dueDate && !entry.settled)
    .map((entry) => ({
      ...entry,
      daysLeft: Math.ceil((new Date(entry.dueDate) - today) / (24 * 60 * 60 * 1000))
    }))
    .filter((entry) => entry.daysLeft >= -1)
    .sort((a, b) => a.daysLeft - b.daysLeft);
};

const getBudgetAlerts = () =>
  state.budgets
    .map((budget) => {
      const spent = getBudgetSpending(budget.category, state.historyMonth);
      const ratio = budget.limit ? spent / budget.limit : 0;
      return { ...budget, spent, ratio };
    })
    .filter((budget) => budget.ratio >= 0.8)
    .sort((a, b) => b.ratio - a.ratio);

const getMonthlySeries = (count = 6) => {
  const current = new Date(`${state.historyMonth}-01T00:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - (count - index - 1), 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      monthKey,
      label: monthFormatter.format(date).replace(" thg ", "/"),
      expense: getMonthlyExpense(monthKey),
      income: getMonthlyIncome(monthKey)
    };
  });
};

const getSmartAdvice = () => {
  const currentExpense = getMonthlyExpense(state.historyMonth);
  const previousExpense = getMonthlyExpense(getPreviousMonthKey(state.historyMonth));
  const breakdown = getCategoryBreakdown(state.historyMonth);
  const topCategory = breakdown[0];

  if (!state.entries.length) {
    return "Bạn chưa có giao dịch nào. Hãy bắt đầu bằng khoản chi hoặc khoản thu đầu tiên để ứng dụng tạo thống kê.";
  }

  if (!currentExpense) {
    return "Tháng này chưa có khoản chi nào được ghi lại. Khi có dữ liệu, ứng dụng sẽ bắt đầu so sánh và phân tích xu hướng.";
  }

  if (topCategory && topCategory.ratio >= 40) {
    return `Danh mục ${topCategory.category.toLowerCase()} đang chiếm ${topCategory.ratio}% tổng chi tháng này. Đây là nhóm nên theo dõi sát nhất.`;
  }

  if (previousExpense && currentExpense > previousExpense) {
    return `Chi tiêu tháng này đang cao hơn tháng trước ${currency(currentExpense - previousExpense)}. Nên rà lại các khoản phát sinh gần đây.`;
  }

  return "Nhịp chi tiêu hiện khá ổn. Cứ ghi đều để số liệu ngày càng sát thực tế hơn.";
};

const getChartGradient = (items) => {
  if (!items.length) {
    return "conic-gradient(rgba(148, 163, 184, 0.18) 0deg 360deg)";
  }

  let current = 0;
  const segments = items
    .map((item) => {
      const start = current;
      const end = current + item.ratio * 3.6;
      current = end;
      return `${item.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return `conic-gradient(${segments})`;
};

const detectCategory = (text, type) => {
  const normalized = normalizeText(text);
  const group = CATEGORY_META[type];
  if (!normalized || !group) return "";

  return (
    Object.keys(group).find((category) =>
      group[category].keywords.some((keyword) => normalized.includes(keyword))
    ) || ""
  );
};

const parseAmountFromText = (text) => {
  const normalized = normalizeText(text);
  const match = normalized.match(/(\d+(?:[.,]\d+)?)\s*(tr|trieu|k|nghin|ngan)?/);
  if (!match) return 0;

  const base = Number(match[1].replace(",", "."));
  if (!Number.isFinite(base)) return 0;

  const unit = match[2] || "";
  if (unit === "tr" || unit === "trieu") return Math.round(base * 1000000);
  if (unit === "k" || unit === "nghin" || unit === "ngan") return Math.round(base * 1000);
  return Math.round(base);
};

const renderCategoryOptions = () => {
  entryCategory.innerHTML = Object.keys(CATEGORY_META[entryType.value])
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");

  historyCategory.innerHTML = [
    `<option value="all">Tất cả</option>`,
    ...Object.keys(CATEGORY_META.expense).map(
      (category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
    ),
    ...Object.keys(CATEGORY_META.income)
      .filter((category) => category !== "Khác")
      .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
  ].join("");

  historyCategory.value = state.historyCategory;
};

const renderOnboarding = () => {
  onboardingSlides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === state.onboardingIndex);
  });
  onboardingDots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === state.onboardingIndex);
  });
  nextOnboardingButton.textContent = state.onboardingIndex === onboardingSlides.length - 1 ? "Bắt đầu" : "Tiếp tục";
};

const renderQuickChips = () => {
  quickAddChips.innerHTML = QUICK_ADD_PRESETS.map(
    (item) => `<button class="quick-chip" data-preset="${escapeHtml(item.label)}" type="button">${escapeHtml(item.label)}</button>`
  ).join("");
};

const updateSmartHint = () => {
  const text = entryTitle.value || "";
  const suggestedCategory = detectCategory(text, entryType.value);
  const parsedAmount = parseAmountFromText(text);

  if (!entryAmount.value && parsedAmount) {
    entryAmount.value = String(parsedAmount);
  }

  if (suggestedCategory && entryType.value === "expense") {
    entryCategory.value = suggestedCategory;
  }

  const messages = [];
  if (suggestedCategory) messages.push(`Gợi ý danh mục: ${suggestedCategory}`);
  if (parsedAmount) messages.push(`Nhận ra số tiền: ${currency(parsedAmount)}`);

  smartHint.textContent =
    messages.join(" • ") || "Nhập mô tả như “trà sữa 45k” để ứng dụng tự gợi ý danh mục và số tiền.";
};

const renderSummaryHero = () => {
  const balance = getTotalBalance();
  const monthlyIncome = getMonthlyIncome(state.historyMonth);
  const monthlyExpense = getMonthlyExpense(state.historyMonth);
  const monthlyLeft = monthlyIncome - monthlyExpense;

  summaryHero.innerHTML = `
    <article class="summary-card">
      <div class="metric-row">
        <div>
          <p class="eyebrow">Số dư hiện tại</p>
          <h3 class="summary-balance">${currency(balance)}</h3>
        </div>
        <span class="amount-pill ${balance >= 0 ? "is-income" : "is-expense"}">${state.entries.length ? (balance >= 0 ? "Dòng tiền ổn" : "Cần cân đối") : "Chưa có dữ liệu"}</span>
      </div>
      <p class="meta-line">${state.entries.length ? `Tháng ${escapeHtml(formatMonth(state.historyMonth))} bạn đang còn ${currency(monthlyLeft)} sau khi trừ các khoản chi đã ghi.` : "Ứng dụng đang ở trạng thái trống. Khi bạn thêm giao dịch, tổng quan và thống kê sẽ tự cập nhật."}</p>
      <div class="metric-grid">
        <div class="metric-tile">
          <span>Thu tháng này</span>
          <strong>${currency(monthlyIncome)}</strong>
        </div>
        <div class="metric-tile">
          <span>Chi tháng này</span>
          <strong>${currency(monthlyExpense)}</strong>
        </div>
        <div class="metric-tile">
          <span>Tỷ lệ tiết kiệm</span>
          <strong>${getSavingsRate(state.historyMonth)}%</strong>
        </div>
      </div>
    </article>
  `;
};

const renderHomeInsightGrid = () => {
  const breakdown = getCategoryBreakdown(state.historyMonth);
  const currentExpense = getMonthlyExpense(state.historyMonth);
  const previousExpense = getMonthlyExpense(getPreviousMonthKey(state.historyMonth));
  const diff = currentExpense - previousExpense;
  const alerts = getBudgetAlerts();

  homeInsightGrid.innerHTML = `
    <article class="card panel-card chart-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Biểu đồ chi</p>
          <h3>Biểu đồ tròn tháng này</h3>
        </div>
        <span class="category-pill">${currency(currentExpense)}</span>
      </div>
      <div class="donut-layout">
        <div class="donut-chart" style="background:${getChartGradient(breakdown)}">
          <div class="donut-hole">
            <strong>${breakdown.length ? `${breakdown[0].ratio}%` : "0%"}</strong>
            <span>${breakdown.length ? escapeHtml(breakdown[0].category) : "Chưa có dữ liệu"}</span>
          </div>
        </div>
        <div class="legend-list">
          ${
            breakdown.length
              ? breakdown
                  .slice(0, 4)
                  .map(
                    (item) => `
                      <div class="legend-item">
                        <span class="legend-dot" style="background:${item.color}"></span>
                        <div>
                          <strong>${item.icon} ${escapeHtml(item.category)}</strong>
                          <span>${currency(item.amount)} • ${item.ratio}%</span>
                        </div>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="empty-inline">Chưa có giao dịch để vẽ biểu đồ.</div>`
          }
        </div>
      </div>
    </article>

    <article class="card panel-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Đi nhanh</p>
          <h3>Màn hình bạn cần nhất</h3>
        </div>
      </div>
      <div class="action-grid">
        <button class="shortcut-btn" data-open-screen="add" type="button">
          <strong>➕ Thêm giao dịch</strong>
          <span>Ghi ngay khoản thu hoặc chi mới.</span>
        </button>
        <button class="shortcut-btn" data-open-screen="insights" type="button">
          <strong>📊 Xem thống kê</strong>
          <span>Biểu đồ, xu hướng và so sánh tháng.</span>
        </button>
        <button class="shortcut-btn" data-open-screen="budget" type="button">
          <strong>🎯 Ngân sách</strong>
          <span>${alerts.length ? `${alerts.length} danh mục đang cần chú ý.` : "Đặt giới hạn theo nhóm chi tiêu."}</span>
        </button>
      </div>
    </article>

    <article class="card panel-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">So sánh</p>
          <h3>Tháng này và tháng trước</h3>
        </div>
      </div>
      <div class="compare-inline">
        <div class="compare-mini">
          <span>Chi tháng này</span>
          <strong>${currency(currentExpense)}</strong>
        </div>
        <div class="compare-mini">
          <span>Chi tháng trước</span>
          <strong>${currency(previousExpense)}</strong>
        </div>
      </div>
      <p class="meta-line">${!state.entries.length ? "Chưa có dữ liệu để so sánh tháng. Khi bạn bắt đầu ghi giao dịch, phần này sẽ tự đầy." : diff > 0 ? `Bạn đang chi nhiều hơn ${currency(diff)} so với tháng trước.` : diff < 0 ? `Bạn đã giảm chi ${currency(Math.abs(diff))} so với tháng trước.` : "Mức chi tháng này đang ngang với tháng trước."}</p>
    </article>
  `;
};

const renderReminderList = () => {
  const reminders = [];
  const todayHasExpense = state.entries.some((entry) => entry.date === getTodayString() && entry.type === "expense");

  if (!state.entries.length) {
    reminderList.innerHTML = `<div class="empty-state">Chưa có giao dịch nào. Hãy thêm khoản đầu tiên để ứng dụng bắt đầu theo dõi thu chi cho bạn.</div>`;
    return;
  }

  if (!todayHasExpense) {
    reminders.push({
      title: "Hôm nay bạn chưa ghi chi tiêu",
      description: "Nếu có khoản phát sinh trong ngày, thêm ngay để lịch sử không bị thiếu.",
      tone: "is-warning"
    });
  }

  getUpcomingBills().slice(0, 2).forEach((bill) => {
    reminders.push({
      title: bill.daysLeft <= 0 ? `${bill.title} đến hạn hôm nay` : `${bill.title} còn ${bill.daysLeft} ngày`,
      description: `${currency(bill.amount)} • ${bill.category} • hạn ${formatDate(bill.dueDate)}`,
      tone: bill.daysLeft <= 1 ? "is-danger" : "is-info",
      action: `<button class="action-btn" data-entry-paid="${bill.id}" type="button">Đánh dấu đã trả</button>`
    });
  });

  getBudgetAlerts().slice(0, 2).forEach((item) => {
    reminders.push({
      title: `${item.category} đã dùng ${Math.round(item.ratio * 100)}% ngân sách`,
      description: `${currency(item.spent)} / ${currency(item.limit)} trong tháng ${formatMonth(state.historyMonth)}`,
      tone: item.ratio >= 1 ? "is-danger" : "is-warning"
    });
  });

  if (!reminders.length) {
    reminderList.innerHTML = `<div class="empty-state">Chưa có khoản nào đến hạn hoặc vượt ngưỡng cảnh báo.</div>`;
    return;
  }

  reminderList.innerHTML = reminders
    .map(
      (item) => `
        <article class="alert-card ${item.tone}">
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="meta-line">${escapeHtml(item.description)}</p>
          </div>
          ${item.action || ""}
        </article>
      `
    )
    .join("");
};

const renderEntryList = (target, entries, emptyText) => {
  if (!entries.length) {
    target.innerHTML = `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
    return;
  }

  target.innerHTML = entries
    .map((entry) => {
      const meta = CATEGORY_META[entry.type][entry.category] || { icon: "🧾" };
      return `
        <article class="entry-card">
          <div class="entry-head">
            <div>
              <h3>${meta.icon} ${escapeHtml(entry.title)}</h3>
              <p class="meta-line">${escapeHtml(entry.category)} • ${formatDate(entry.date)} • ${escapeHtml(entry.account)}</p>
            </div>
            <span class="amount-pill ${entry.type === "income" ? "is-income" : "is-expense"}">${entry.type === "income" ? "+" : "-"}${currency(entry.amount)}</span>
          </div>
          <p class="meta-line">${escapeHtml(entry.note || "Không có ghi chú thêm.")}</p>
          <div class="card-actions">
            <span class="category-pill">${entry.type === "income" ? "Thu vào" : "Chi ra"}</span>
            <button class="action-btn" data-entry-open="${entry.id}" type="button">Xem chi tiết</button>
          </div>
        </article>
      `;
    })
    .join("");
};

const renderRecentList = () => {
  renderEntryList(recentList, getRecentEntries(), "Chưa có giao dịch nào gần đây.");
};

const renderHistoryList = () => {
  renderEntryList(historyList, getFilteredEntries(), "Chưa có giao dịch nào khớp với bộ lọc hiện tại.");
};

const renderDetailView = () => {
  const entry = getEntryById(state.selectedEntryId);
  if (!entry) {
    detailView.innerHTML = `<div class="empty-state">Chưa có giao dịch nào để xem chi tiết.</div>`;
    return;
  }

  const meta = CATEGORY_META[entry.type][entry.category] || { icon: "🧾" };

  detailView.innerHTML = `
    <article class="detail-card">
      <div class="detail-head">
        <h2>${meta.icon} ${escapeHtml(entry.title)}</h2>
        <p class="meta-line">${entry.type === "income" ? "Khoản thu" : "Khoản chi"} • ${escapeHtml(entry.category)}</p>
      </div>
      <div class="detail-stat-grid">
        <div class="detail-stat">
          <span>Số tiền</span>
          <strong>${entry.type === "income" ? "+" : "-"}${currency(entry.amount)}</strong>
        </div>
        <div class="detail-stat">
          <span>Ngày</span>
          <strong>${formatDate(entry.date)}</strong>
        </div>
        <div class="detail-stat">
          <span>Tài khoản</span>
          <strong>${escapeHtml(entry.account)}</strong>
        </div>
        <div class="detail-stat">
          <span>Đến hạn</span>
          <strong>${entry.dueDate ? formatDate(entry.dueDate) : "Không áp dụng"}</strong>
        </div>
      </div>
      <article class="insight-card">
        <h3>Ghi chú</h3>
        <p>${escapeHtml(entry.note || "Khoản này chưa có ghi chú chi tiết.")}</p>
      </article>
      <div class="card-actions">
        ${entry.type === "expense" && entry.dueDate ? `<button class="action-btn is-primary" data-entry-paid="${entry.id}" type="button">${entry.settled ? "Đã thanh toán" : "Đánh dấu đã trả"}</button>` : ""}
        <button class="action-btn" data-entry-delete="${entry.id}" type="button">Xóa giao dịch</button>
      </div>
    </article>
  `;
};

const getBudgetStatus = (spent, limit) => {
  const ratio = limit ? spent / limit : 0;
  if (ratio >= 1) return { label: "Vượt mức", className: "is-risk" };
  if (ratio >= 0.8) return { label: "Sắp chạm trần", className: "is-risk" };
  return { label: "An toàn", className: "is-safe" };
};

const renderBudgetView = () => {
  const totalLimit = state.budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = state.budgets.reduce((sum, budget) => sum + getBudgetSpending(budget.category, state.historyMonth), 0);

  const budgetCards = state.budgets
    .map((budget) => {
      const spent = getBudgetSpending(budget.category, state.historyMonth);
      const ratio = Math.min(100, budget.limit ? Math.round((spent / budget.limit) * 100) : 0);
      const status = getBudgetStatus(spent, budget.limit);
      const icon = CATEGORY_META.expense[budget.category]?.icon || "🧾";

      return `
        <article class="budget-card">
          <div class="budget-head">
            <div>
              <h3>${icon} ${escapeHtml(budget.category)}</h3>
              <p>${currency(spent)} / ${currency(budget.limit)}</p>
            </div>
            <span class="status-pill ${status.className}">${status.label}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${ratio}%"></div>
          </div>
          <p class="meta-line">${ratio}% ngân sách đã dùng trong tháng ${formatMonth(state.historyMonth)}.</p>
        </article>
      `;
    })
    .join("");

  budgetView.innerHTML = `
    <div class="budget-grid">
      <article class="card panel-card budget-overview">
        <div class="section-head">
          <div>
            <p class="eyebrow">Tổng ngân sách</p>
            <h3>Kiểm soát chi tiêu tháng này</h3>
          </div>
          <span class="category-pill">${currency(totalSpent)} / ${currency(totalLimit)}</span>
        </div>
        <p class="meta-line">${state.budgets.length ? (getBudgetAlerts().length ? `${getBudgetAlerts().length} danh mục đang dùng từ 80% ngân sách trở lên.` : "Hiện chưa có danh mục nào chạm ngưỡng cảnh báo.") : "Bạn chưa đặt ngân sách nào. Có thể tạo mới ngay bên dưới."}</p>
      </article>

      ${budgetCards}

      <article class="budget-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Cập nhật hạn mức</p>
            <h3>Đặt giới hạn theo danh mục</h3>
          </div>
        </div>
        <form id="budgetForm" class="quick-form">
          <div class="inline-grid">
            <label class="field-stack">
              <span>Danh mục</span>
              <select id="budgetCategory">
                ${Object.keys(CATEGORY_META.expense).map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}
              </select>
            </label>
            <label class="field-stack">
              <span>Giới hạn mới</span>
              <input id="budgetLimit" type="number" min="100000" step="100000" placeholder="2000000" required>
            </label>
          </div>
          <div class="card-actions">
            <button class="primary-btn" type="submit">Lưu ngân sách</button>
          </div>
        </form>
      </article>
    </div>
  `;

  document.querySelector("#budgetForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const category = document.querySelector("#budgetCategory")?.value;
    const limit = Number(document.querySelector("#budgetLimit")?.value || 0);
    if (!category || !limit) return;

    const existing = getBudgetByCategory(category);
    if (existing) {
      existing.limit = limit;
    } else {
      state.budgets.push({ id: generateId("b"), category, limit });
    }

    persistBudgets();
    renderAll();
  });
};

const renderInsightView = () => {
  const monthKey = state.historyMonth;
  const prevMonthKey = getPreviousMonthKey(monthKey);
  const breakdown = getCategoryBreakdown(monthKey);
  const series = getMonthlySeries(6);
  const maxExpense = Math.max(...series.map((item) => item.expense), 1);
  const compareMax = Math.max(getMonthlyIncome(monthKey), getMonthlyIncome(prevMonthKey), getMonthlyExpense(monthKey), getMonthlyExpense(prevMonthKey), 1);
  const goalProgress = Math.min(100, Math.round((Math.max(getTotalBalance(), 0) / state.savingsGoal) * 100) || 0);

  insightView.innerHTML = `
    <div class="insight-grid">
      <article class="insight-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Chi theo danh mục</p>
            <h3>Biểu đồ tròn</h3>
          </div>
          <span class="category-pill">${formatMonth(monthKey)}</span>
        </div>
        <div class="donut-layout">
          <div class="donut-chart large" style="background:${getChartGradient(breakdown)}">
            <div class="donut-hole">
              <strong>${currency(getMonthlyExpense(monthKey))}</strong>
              <span>Tổng chi tháng này</span>
            </div>
          </div>
          <div class="legend-list">
            ${
              breakdown.length
                ? breakdown
                    .map(
                      (item) => `
                        <div class="legend-item">
                          <span class="legend-dot" style="background:${item.color}"></span>
                          <div>
                            <strong>${item.icon} ${escapeHtml(item.category)}</strong>
                            <span>${currency(item.amount)} • ${item.ratio}%</span>
                          </div>
                        </div>
                      `
                    )
                    .join("")
                : `<div class="empty-inline">Chưa có dữ liệu để tạo biểu đồ tròn.</div>`
            }
          </div>
        </div>
      </article>

      <article class="insight-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">So sánh tháng</p>
            <h3>Tháng này và tháng trước</h3>
          </div>
        </div>
        <div class="compare-bars">
          <div class="bar-cluster">
            <span>Thu tháng này</span>
            <div class="bar-track"><span class="bar-fill income" style="height:${Math.round((getMonthlyIncome(monthKey) / compareMax) * 100)}%"></span></div>
            <strong>${currency(getMonthlyIncome(monthKey))}</strong>
          </div>
          <div class="bar-cluster">
            <span>Thu tháng trước</span>
            <div class="bar-track"><span class="bar-fill income soft" style="height:${Math.round((getMonthlyIncome(prevMonthKey) / compareMax) * 100)}%"></span></div>
            <strong>${currency(getMonthlyIncome(prevMonthKey))}</strong>
          </div>
          <div class="bar-cluster">
            <span>Chi tháng này</span>
            <div class="bar-track"><span class="bar-fill expense" style="height:${Math.round((getMonthlyExpense(monthKey) / compareMax) * 100)}%"></span></div>
            <strong>${currency(getMonthlyExpense(monthKey))}</strong>
          </div>
          <div class="bar-cluster">
            <span>Chi tháng trước</span>
            <div class="bar-track"><span class="bar-fill expense soft" style="height:${Math.round((getMonthlyExpense(prevMonthKey) / compareMax) * 100)}%"></span></div>
            <strong>${currency(getMonthlyExpense(prevMonthKey))}</strong>
          </div>
        </div>
      </article>

      <article class="insight-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Xu hướng 6 tháng</p>
            <h3>Biểu đồ cột theo tháng</h3>
          </div>
        </div>
        <div class="trend-grid">
          ${series
            .map(
              (item) => `
                <div class="trend-bar">
                  <div class="trend-track">
                    <span style="height:${item.expense ? Math.max(12, Math.round((item.expense / maxExpense) * 100)) : 0}%"></span>
                  </div>
                  <strong>${escapeHtml(item.label)}</strong>
                  <small>${currency(item.expense)}</small>
                </div>
              `
            )
            .join("")}
        </div>
      </article>

      <article class="insight-card">
        <h3>Mục tiêu quỹ dự phòng</h3>
        <p class="meta-line">Hiện bạn đã tích lũy ${currency(Math.max(getTotalBalance(), 0))} trên mục tiêu ${currency(state.savingsGoal)}.</p>
        <div class="progress-track">
          <div class="progress-fill" style="width:${goalProgress}%"></div>
        </div>
        <p class="meta-line">${goalProgress}% mục tiêu đã hoàn thành.</p>
      </article>

      <article class="insight-card">
        <h3>Gợi ý kiểm soát tiền</h3>
        <p>${escapeHtml(getSmartAdvice())}</p>
      </article>
    </div>
  `;
};

const downloadFile = (name, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const exportCsv = () => {
  const header = ["id", "title", "amount", "type", "category", "date", "account", "note", "dueDate", "settled"];
  const rows = state.entries.map((entry) =>
    [entry.id, entry.title, entry.amount, entry.type, entry.category, entry.date, entry.account, entry.note, entry.dueDate, entry.settled]
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  downloadFile("vi-rieng-transactions.csv", [header.join(","), ...rows].join("\n"), "text/csv;charset=utf-8;");
};

const backupJson = () => {
  downloadFile(
    "vi-rieng-backup.json",
    JSON.stringify({ entries: state.entries, budgets: state.budgets, goal: state.savingsGoal }, null, 2),
    "application/json;charset=utf-8;"
  );
};

const restoreFromFile = (file) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      if (!Array.isArray(parsed.entries) || !Array.isArray(parsed.budgets)) {
        throw new Error("invalid");
      }
      state.entries = parsed.entries;
      state.budgets = parsed.budgets;
      state.savingsGoal = Number(parsed.goal || DEFAULT_GOAL);
      state.selectedEntryId = state.entries[0]?.id || "";
      persistEntries();
      persistBudgets();
      persistGoal();
      renderAll();
      showScreen("home");
    } catch (error) {
      window.alert("File backup không hợp lệ.");
    }
  };
  reader.readAsText(file);
};

const resetData = () => {
  state.entries = [];
  state.budgets = [];
  state.savingsGoal = DEFAULT_GOAL;
  state.selectedEntryId = "";
  persistEntries();
  persistBudgets();
  persistGoal();
  renderAll();
  showScreen("home");
};

const renderSettingsView = () => {
  settingsView.innerHTML = `
    <div class="setting-grid">
      <article class="profile-card">
        <div class="profile-row">
          <h3>Giao diện</h3>
          <button class="toggle-btn" id="themeToggle" type="button">${state.darkMode ? "Đang bật giao diện tối" : "Đang dùng giao diện sáng"}</button>
        </div>
        <p class="meta-line">Đổi nhanh giữa giao diện sáng và tối để nhìn số liệu dễ hơn vào cả ban ngày lẫn buổi tối.</p>
      </article>

      <article class="profile-card">
        <div class="profile-row">
          <h3>Mục tiêu tiết kiệm</h3>
          <span class="category-pill">${currency(state.savingsGoal)}</span>
        </div>
        <form id="goalForm" class="quick-form">
          <label class="field-stack">
            <span>Đặt mục tiêu mới</span>
            <input id="goalAmount" type="number" min="1000000" step="1000000" value="${state.savingsGoal}" required>
          </label>
          <div class="card-actions">
            <button class="primary-btn" type="submit">Lưu mục tiêu</button>
          </div>
        </form>
      </article>

      <article class="profile-card">
        <div class="profile-row">
          <h3>Backup dữ liệu</h3>
          <span class="category-pill">${state.entries.length} giao dịch</span>
        </div>
        <p class="meta-line">Xuất file CSV để mở bằng Excel hoặc backup JSON để lưu toàn bộ dữ liệu ứng dụng.</p>
        <div class="card-actions wrap-actions">
          <button class="action-btn" id="exportCsvButton" type="button">Xuất CSV</button>
          <button class="action-btn" id="backupJsonButton" type="button">Backup JSON</button>
          <button class="action-btn" id="restoreJsonButton" type="button">Khôi phục</button>
        </div>
        <input id="restoreFileInput" class="hidden-input" type="file" accept=".json">
      </article>

      <article class="profile-card">
        <div class="profile-row">
          <h3>Xóa dữ liệu</h3>
          <span class="category-pill">Làm sạch</span>
        </div>
        <p class="meta-line">Xóa toàn bộ giao dịch, ngân sách và mục tiêu hiện tại để bắt đầu từ trạng thái trắng.</p>
        <div class="card-actions">
          <button class="action-btn" id="resetDataButton" type="button">Xóa toàn bộ dữ liệu</button>
        </div>
      </article>
    </div>
  `;

  document.querySelector("#themeToggle")?.addEventListener("click", () => {
    setTheme(!state.darkMode);
    renderSettingsView();
  });

  document.querySelector("#goalForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const goalValue = Number(document.querySelector("#goalAmount")?.value || 0);
    if (!goalValue) return;
    state.savingsGoal = goalValue;
    persistGoal();
    renderAll();
  });

  document.querySelector("#exportCsvButton")?.addEventListener("click", exportCsv);
  document.querySelector("#backupJsonButton")?.addEventListener("click", backupJson);
  document.querySelector("#restoreJsonButton")?.addEventListener("click", () => {
    document.querySelector("#restoreFileInput")?.click();
  });
  document.querySelector("#restoreFileInput")?.addEventListener("change", (event) => {
    restoreFromFile(event.target.files?.[0]);
    event.target.value = "";
  });
  document.querySelector("#resetDataButton")?.addEventListener("click", resetData);
};

const renderAll = () => {
  renderCategoryOptions();
  renderHomeScreen();
  renderHistoryList();
  renderDetailView();
  renderBudgetView();
  renderInsightView();
  renderSettingsView();
};

const addEntry = (formData) => {
  const entry = {
    id: generateId("tx"),
    title: String(formData.get("title") || "").trim(),
    amount: Number(formData.get("amount")),
    type: String(formData.get("type")),
    category: String(formData.get("category")),
    date: String(formData.get("date")),
    account: String(formData.get("type")) === "income" ? "VCB" : "Ví cá nhân",
    note: String(formData.get("note") || "").trim(),
    dueDate: "",
    settled: true
  };

  state.entries = [entry, ...state.entries];
  state.selectedEntryId = entry.id;
  persistEntries();
  renderAll();
  quickEntryForm.reset();
  entryType.value = "expense";
  renderCategoryOptions();
  entryDate.value = getTodayString();
  showScreen("home");
  updateSmartHint();
};

const fillFromPreset = (label) => {
  const preset = QUICK_ADD_PRESETS.find((item) => item.label === label);
  if (!preset) return;
  entryTitle.value = preset.title;
  entryType.value = preset.type;
  renderCategoryOptions();
  entryCategory.value = preset.category;
  entryAmount.value = String(preset.amount);
  entryDate.value = getTodayString();
  showScreen("add");
  updateSmartHint();
};

const markEntryPaid = (entryId) => {
  const entry = getEntryById(entryId);
  if (!entry) return;
  entry.settled = true;
  persistEntries();
  renderAll();
};

const deleteEntry = (entryId) => {
  state.entries = state.entries.filter((entry) => entry.id !== entryId);
  state.selectedEntryId = state.entries[0]?.id || "";
  persistEntries();
  renderAll();
  showScreen("history");
};

const bindGlobalEvents = () => {
  nextOnboardingButton.addEventListener("click", () => {
    if (state.onboardingIndex === onboardingSlides.length - 1) {
      completeOnboarding();
      return;
    }
    state.onboardingIndex += 1;
    renderOnboarding();
  });

  skipOnboardingButton.addEventListener("click", completeOnboarding);

  entryType.addEventListener("change", () => {
    renderCategoryOptions();
    updateSmartHint();
  });

  entryTitle.addEventListener("input", updateSmartHint);

  quickEntryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addEntry(new FormData(quickEntryForm));
  });

  historySearch.addEventListener("input", (event) => {
    state.historySearch = event.target.value || "";
    renderHistoryList();
  });

  historyType.addEventListener("change", (event) => {
    state.historyType = event.target.value;
    renderHistoryList();
  });

  historyCategory.addEventListener("change", (event) => {
    state.historyCategory = event.target.value;
    renderHistoryList();
  });

  historyMonth.addEventListener("change", (event) => {
    state.historyMonth = event.target.value || getTodayString().slice(0, 7);
    renderHomeScreen();
    if (state.currentScreen !== "home") {
      renderActiveScreen(state.currentScreen);
    }
  });

  document.addEventListener("click", (event) => {
    const openScreenButton = event.target.closest("[data-open-screen]");
    if (openScreenButton) {
      showScreen(openScreenButton.dataset.openScreen);
      return;
    }

    const backButton = event.target.closest("[data-back-screen]");
    if (backButton) {
      showScreen(backButton.dataset.backScreen);
      return;
    }

    const openEntryButton = event.target.closest("[data-entry-open]");
    if (openEntryButton) {
      state.selectedEntryId = openEntryButton.dataset.entryOpen;
      renderDetailView();
      showScreen("detail");
      return;
    }

    const paidButton = event.target.closest("[data-entry-paid]");
    if (paidButton) {
      markEntryPaid(paidButton.dataset.entryPaid);
      return;
    }

    const deleteButton = event.target.closest("[data-entry-delete]");
    if (deleteButton) {
      deleteEntry(deleteButton.dataset.entryDelete);
      return;
    }

    const presetButton = event.target.closest("[data-preset]");
    if (presetButton) {
      fillFromPreset(presetButton.dataset.preset);
    }
  });
};

const startApp = () => {
  const hasSeenOnboarding = localStorage.getItem(STORAGE_KEYS.onboarding) === "done";

  safeRun("detectLiteMode", () => {
    state.liteMode = detectLiteMode();
    document.body.classList.toggle("lite-mode", state.liteMode);
  });
  safeRun("setTheme", () => setTheme(state.darkMode));
  safeRun("renderOnboarding", renderOnboarding);
  safeRun("renderQuickChips", renderQuickChips);
  safeRun("renderCategoryOptions", renderCategoryOptions);
  safeRun("bindGlobalEvents", bindGlobalEvents);
  safeRun("renderHomeScreen", renderHomeScreen);
  safeRun("entryDate", () => {
    entryDate.value = getTodayString();
  });
  safeRun("historyMonth", () => {
    historyMonth.value = state.historyMonth;
  });
  safeRun("updateSmartHint", updateSmartHint);
  safeRun("initialScreen", () => showScreen(hasSeenOnboarding ? "home" : "onboarding"));
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp, { once: true });
} else {
  startApp();
}
