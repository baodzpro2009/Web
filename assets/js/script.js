import { isSupabaseConfigured, listPosts, getPostById } from "./supabase-client.js";

const ANH_TRUONG = {
  anhBanner: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=80",
  anhKhuonVien: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=80",
  anhLopHoc: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80",
  anhThuVien: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80",
  anhHoatDong: "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=80",
  anhKhuThuVien: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80",
  anhPhongThiNghiem: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80",
  anhSanBong: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  anhHoiTruong: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80"
};

const THONG_TIN_TRUONG = {
  soDienThoai: "0123456789",
  zaloLink: "https://zalo.me/0123456789",
  tieuDeThongBao: "Thông báo nhanh",
  noiDungThongBao: "Nhà trường đang cập nhật kế hoạch tuyển sinh, lịch ôn tập và hoạt động học kỳ II. Theo dõi mục Thông báo để xem đầy đủ."
};

/* legacy sample posts removed
  {
    id: "post-ke-hoach-on-tap",
    title: "Kế hoạch kiểm tra học kỳ và ôn tập cuối năm",
    summary: "Nhà trường triển khai lịch ôn tập tập trung, củng cố kiến thức theo từng khối lớp.",
    content:
      "Nhà trường xây dựng kế hoạch ôn tập cuối năm theo từng khối lớp nhằm củng cố kiến thức trọng tâm, rèn kỹ năng làm bài và tăng cường sự chủ động cho học sinh trước kỳ kiểm tra học kỳ.",
    category: "Thông báo",
    image: "",
    video_url: "",
    date: "2026-04-11"
  },
  {
    id: "post-tuyen-sinh-moi",
    title: "Hướng dẫn hồ sơ đầu vào năm học mới",
    summary: "Phụ huynh và học sinh theo dõi thời gian nộp hồ sơ, điều kiện xét tuyển và thủ tục nhập học.",
    content:
      "Hồ sơ tuyển sinh gồm bản sao học bạ, giấy khai sinh, giấy chứng nhận tốt nghiệp tạm thời và đơn đăng ký nhập học. Nhà trường tiếp nhận hồ sơ theo kế hoạch từng đợt.",
    category: "Tuyển sinh",
    image: "",
    video_url: "",
    date: "2026-04-09"
  }
*/

const sections = document.querySelectorAll("section[id], footer[id]");
const navLinks = document.querySelectorAll(".nav-link");
const themeToggle = document.querySelector("#dark-mode-toggle");
const themeToggleIcon = themeToggle?.querySelector(".theme-toggle-icon");
const navActions = document.querySelector(".nav-actions");
const heroCopy = document.querySelector(".hero-copy, .subpage-copy");
const heroBanner = document.querySelector(".hero-banner");
const classFilter = document.querySelector("#classFilter");
const teacherFilter = document.querySelector("#teacherFilter");
const scheduleRows = document.querySelectorAll("#scheduleBody tr");
const scheduleEmpty = document.querySelector("#scheduleEmpty");
const countdownElement = document.querySelector(".countdown");
const zoneButtons = document.querySelectorAll(".zone-button");
const zonePanels = document.querySelectorAll(".zone-panel");
const statNumbers = document.querySelectorAll(".stat-number");
const postList = document.querySelector("[data-post-list]");
const postTitle = document.querySelector("#postTitle");
const postSummary = document.querySelector("#postSummary");
const postContent = document.querySelector("#postContent");

const setBackgroundImage = (selector, overlay, imageUrl) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.style.backgroundImage = `${overlay}, url("${imageUrl}")`;
  });
};

setBackgroundImage(".hero-banner", "linear-gradient(0deg, rgba(14, 40, 48, 0.52), rgba(14, 40, 48, 0.18))", ANH_TRUONG.anhBanner);
setBackgroundImage(".campus-main", "linear-gradient(rgba(19, 53, 64, 0.18), rgba(19, 53, 64, 0.18))", ANH_TRUONG.anhKhuonVien);
setBackgroundImage(".classroom", "linear-gradient(rgba(19, 53, 64, 0.12), rgba(19, 53, 64, 0.12))", ANH_TRUONG.anhLopHoc);
setBackgroundImage(".library", "linear-gradient(rgba(19, 53, 64, 0.12), rgba(19, 53, 64, 0.12))", ANH_TRUONG.anhThuVien);
setBackgroundImage(".activities", "linear-gradient(rgba(19, 53, 64, 0.12), rgba(19, 53, 64, 0.12))", ANH_TRUONG.anhHoatDong);
setBackgroundImage(".library-zone-image", "linear-gradient(rgba(19, 53, 64, 0.2), rgba(19, 53, 64, 0.2))", ANH_TRUONG.anhKhuThuVien);
setBackgroundImage(".lab-zone-image", "linear-gradient(rgba(19, 53, 64, 0.2), rgba(19, 53, 64, 0.2))", ANH_TRUONG.anhPhongThiNghiem);
setBackgroundImage(".sports-zone-image", "linear-gradient(rgba(19, 53, 64, 0.2), rgba(19, 53, 64, 0.2))", ANH_TRUONG.anhSanBong);
setBackgroundImage(".hall-zone-image", "linear-gradient(rgba(19, 53, 64, 0.2), rgba(19, 53, 64, 0.2))", ANH_TRUONG.anhHoiTruong);

const formatPostDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "";
  return date.toLocaleDateString("vi-VN");
};

const getPostDate = (post) => post.published_at || post.created_at || post.date;

const getVideoEmbedUrl = (url) => {
  if (!url) return "";
  if (url.includes("/embed/")) return url;

  const youtubeMatch = url.match(/[?&]v=([^&]+)/i);
  if (youtubeMatch?.[1]) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

  const shortYoutubeMatch = url.match(/youtu\.be\/([^?&]+)/i);
  if (shortYoutubeMatch?.[1]) return `https://www.youtube.com/embed/${shortYoutubeMatch[1]}`;

  return url;
};

const isDirectVideoFile = (url) => /^data:video\//i.test(url || "") || /\.(mp4|webm|ogg)(\?|#|$)/i.test(url || "");

const renderPostMedia = (post, variant = "detail") => {
  const image = post.image?.trim() || "";
  const videoUrl = post.video_url?.trim() || "";
  const mediaClass = variant === "card" ? "post-media post-media-card" : "post-media";
  let html = "";

  if (image) {
    html += `
      <div class="${mediaClass}" data-media-source="${image}">
        <img src="${image}" alt="${post.title || "Anh bai viet"}" loading="lazy" referrerpolicy="no-referrer">
        <div class="post-media-fallback" hidden>
          <a href="${image}" target="_blank" rel="noreferrer">Mo anh o tab moi</a>
        </div>
      </div>
    `;
  }

  if (videoUrl) {
    if (isDirectVideoFile(videoUrl)) {
      html += `
        <div class="${mediaClass}">
          <video controls preload="metadata">
            <source src="${videoUrl}">
          </video>
        </div>
      `;
    } else {
      html += `
        <div class="${mediaClass}">
          <iframe
            src="${getVideoEmbedUrl(videoUrl)}"
            title="${post.title || "Video bai viet"}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>
      `;
    }
  }

  return html;
};

const bindPostMediaFallback = () => {
  document.querySelectorAll(".post-media img").forEach((image) => {
    if (image.dataset.fallbackBound === "1") return;
    image.dataset.fallbackBound = "1";

    image.addEventListener("error", () => {
      const wrapper = image.closest(".post-media");
      const fallback = wrapper?.querySelector(".post-media-fallback");
      image.hidden = true;
      if (fallback) fallback.hidden = false;
      wrapper?.classList.add("is-broken");
    });
  });
};

const addMobileMenu = () => {
  if (!navActions || navActions.querySelector(".menu-toggle")) return;

  const tools = document.createElement("div");
  tools.className = "nav-tools";

  if (themeToggle) {
    themeToggle.parentElement?.insertBefore(tools, themeToggle);
    tools.appendChild(themeToggle);
  } else {
    navActions.prepend(tools);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "menu-toggle";
  button.setAttribute("aria-label", "Mở menu");
  button.innerHTML = `<span class="menu-toggle-bar"></span>`;
  tools.prepend(button);

  button.addEventListener("click", () => {
    navActions.classList.toggle("menu-open");
  });
};

const addClock = () => {
  if (!heroCopy || heroCopy.querySelector(".hero-clock")) return;

  const clock = document.createElement("div");
  clock.className = "hero-clock";
  clock.innerHTML = `<span class="date">--/--/----</span><span class="time">--:--:--</span>`;
  heroCopy.appendChild(clock);

  const dateElement = clock.querySelector(".date");
  const timeElement = clock.querySelector(".time");

  const updateClock = () => {
    const now = new Date();
    dateElement.textContent = now.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    timeElement.textContent = now.toLocaleTimeString("vi-VN");
  };

  updateClock();
  setInterval(updateClock, 1000);
};

const addPopup = () => {
  if (localStorage.getItem("school_popup_seen") === "1" || document.querySelector(".popup-overlay")) return;

  const isSubPage = window.location.pathname.includes("/pages/");
  const thongBaoPath = isSubPage ? "thong-bao.htm" : "pages/thong-bao.htm";
  const popup = document.createElement("div");
  popup.className = "popup-overlay show";
  popup.innerHTML = `
    <div class="popup-card">
      <p class="section-kicker">Thông báo</p>
      <h3>${THONG_TIN_TRUONG.tieuDeThongBao}</h3>
      <p>${THONG_TIN_TRUONG.noiDungThongBao}</p>
      <div class="popup-actions">
        <a class="btn btn-primary ripple-btn" href="${thongBaoPath}">Xem thông báo</a>
        <button class="btn btn-secondary ripple-btn popup-close" type="button">Đóng</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  const closePopup = () => {
    popup.remove();
    localStorage.setItem("school_popup_seen", "1");
  };

  popup.addEventListener("click", (event) => {
    if (event.target === popup || event.target.closest(".popup-close")) {
      closePopup();
    }
  });
};

const startBannerSlider = () => {
  if (!heroBanner) return;

  const bannerImages = [ANH_TRUONG.anhBanner, ANH_TRUONG.anhKhuonVien, ANH_TRUONG.anhLopHoc, ANH_TRUONG.anhHoatDong];
  let currentIndex = 0;

  setInterval(() => {
    currentIndex = (currentIndex + 1) % bannerImages.length;
    heroBanner.style.backgroundImage = `linear-gradient(0deg, rgba(14, 40, 48, 0.52), rgba(14, 40, 48, 0.18)), url("${bannerImages[currentIndex]}")`;
  }, 4500);
};

const renderPosts = async () => {
  if (!postList) return;

  let posts = null;

  if (!isSupabaseConfigured()) {
    postList.innerHTML = `<p class="schedule-empty">Chua cau hinh Supabase nen khong the tai bai viet.</p>`;
    return;
  }

  if (isSupabaseConfigured()) {
    try {
      posts = await listPosts();
    } catch (error) {
      console.error("Không tải được bài viết từ Supabase:", error);
    }
  }

  if (!Array.isArray(posts)) {
    postList.innerHTML = `<p class="schedule-empty">Khong tai duoc danh sach bai viet.</p>`;
    return;
  }

  if (posts.length === 0) {
    postList.innerHTML = `<p class="schedule-empty">Chua co bai viet nao.</p>`;
    return;
  }

  const limit = Number(postList.dataset.postList || posts.length);
  postList.innerHTML = posts
    .slice(0, limit)
    .map(
      (post) => `
        <article class="news-card glass-card">
          ${renderPostMedia(post, "card")}
          <span class="news-date">${post.category || "Thông báo"}</span>
          <h3>${post.title}</h3>
          <p>${post.summary || "Chưa có mô tả."}</p>
          <a class="news-card-link" href="${window.location.pathname.includes("/pages/") ? `tin-tuc-chi-tiet.htm?id=${post.id}` : `pages/tin-tuc-chi-tiet.htm?id=${post.id}`}">Đọc chi tiết</a>
        </article>
      `
    )
    .join("");

  bindPostMediaFallback();
};

const renderPostDetail = async () => {
  if (!postTitle || !postSummary || !postContent) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  if (!isSupabaseConfigured()) {
    postTitle.textContent = "Chua cau hinh Supabase";
    postSummary.textContent = "Khong the tai bai viet khi chua ket noi Supabase.";
    postContent.innerHTML = `<h3>Thong bao</h3><p>Hay cau hinh Supabase de xem noi dung bai viet.</p>`;
    return;
  }

  let post = null;

  if (isSupabaseConfigured()) {
    try {
      post = await getPostById(id);
    } catch (error) {
      console.error("Không tải được chi tiết bài viết từ Supabase:", error);
    }
  }

  if (!post) {
    postTitle.textContent = "Không tìm thấy bài viết";
    postSummary.textContent = "Bài viết đã bị xóa hoặc chưa tồn tại.";
    postContent.innerHTML = `<h3>Thông báo</h3><p>Không thể tải nội dung bài viết.</p>`;
    return;
  }

  postTitle.textContent = post.title;
  postSummary.textContent = `${post.category || "Thông báo"} • ${formatPostDate(getPostDate(post))}`;
  postContent.innerHTML = `
    ${renderPostMedia(post)}
    <h3>${post.title}</h3>
    <p>${(post.content || "Nội dung đang được cập nhật.").replace(/\n/g, "<br>")}</p>
  `;

  bindPostMediaFallback();
};

const addQuickContact = () => {
  if (document.querySelector(".quick-contact")) return;

  const quickContact = document.createElement("div");
  quickContact.className = "quick-contact";
  quickContact.innerHTML = `
    <a class="call-btn ripple-btn" href="tel:${THONG_TIN_TRUONG.soDienThoai}"><span class="quick-icon">☏</span><span>Gọi ngay</span></a>
    <a class="zalo-btn ripple-btn" href="${THONG_TIN_TRUONG.zaloLink}" target="_blank" rel="noreferrer"><span class="quick-icon quick-icon-zalo">Z</span><span>Zalo</span></a>
  `;

  document.body.appendChild(quickContact);
};

addMobileMenu();
addClock();
addPopup();
startBannerSlider();
addQuickContact();
renderPosts();
renderPostDetail();

const setActiveLink = () => {
  const currentPage = window.location.pathname.split("/").pop() || "index.htm";
  let currentId = "";

  sections.forEach((section) => {
    const top = window.scrollY;
    const offset = section.offsetTop - 160;
    const height = section.offsetHeight;
    if (top >= offset && top < offset + height) currentId = section.id;
  });

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const isSectionLink = href.startsWith("#");
    const isActive = isSectionLink ? href === `#${currentId}` : href === currentPage;
    link.classList.toggle("active", isActive);
  });
};

const applyTheme = (theme) => {
  document.body.classList.toggle("dark-theme", theme === "dark");
};

const updateThemeToggle = (theme) => {
  if (!themeToggle) return;

  const isDark = theme === "dark";
  const labelElement =
    themeToggle.querySelector(".theme-toggle-label") ||
    Array.from(themeToggle.querySelectorAll("span")).find((element) => !element.classList.contains("theme-toggle-icon"));

  if (labelElement) {
    labelElement.classList.add("theme-toggle-label");
    labelElement.textContent = isDark ? "Light Mode" : "Dark Mode";
  }

  if (themeToggleIcon) {
    themeToggleIcon.textContent = isDark ? "☀" : "☾";
  }

  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Đang bật chế độ tối, bấm để chuyển sang chế độ sáng" : "Đang bật chế độ sáng, bấm để chuyển sang chế độ tối"
  );
  themeToggle.setAttribute("title", isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối");
};

const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);
updateThemeToggle(savedTheme);

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-theme") ? "light" : "dark";
  applyTheme(nextTheme);
  updateThemeToggle(nextTheme);
  localStorage.setItem("theme", nextTheme);
});

const filterSchedule = () => {
  const selectedClass = classFilter?.value || "all";
  const selectedTeacher = teacherFilter?.value || "all";
  let visibleCount = 0;

  scheduleRows.forEach((row) => {
    const matchesClass = selectedClass === "all" || row.dataset.class === selectedClass;
    const matchesTeacher = selectedTeacher === "all" || row.dataset.teacher === selectedTeacher;
    const visible = matchesClass && matchesTeacher;
    row.classList.toggle("is-hidden", !visible);
    if (visible) visibleCount += 1;
  });

  if (scheduleEmpty) scheduleEmpty.hidden = visibleCount !== 0;
};

classFilter?.addEventListener("change", filterSchedule);
teacherFilter?.addEventListener("change", filterSchedule);
filterSchedule();

const updateCountdown = () => {
  if (!countdownElement) return;

  const targetDate = new Date(countdownElement.dataset.countdown).getTime();
  const now = Date.now();
  const distance = Math.max(targetDate - now, 0);

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  const daysEl = document.querySelector("#days");
  const hoursEl = document.querySelector("#hours");
  const minutesEl = document.querySelector("#minutes");
  const secondsEl = document.querySelector("#seconds");

  if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
  if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
  if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
};

updateCountdown();
setInterval(updateCountdown, 1000);

zoneButtons.forEach((button) => {
  const activateZone = () => {
    const zoneId = button.dataset.zone;
    zoneButtons.forEach((item) => item.classList.toggle("active", item === button));
    zonePanels.forEach((panel) => panel.classList.toggle("active", panel.id === zoneId));
  };

  button.addEventListener("mouseenter", activateZone);
  button.addEventListener("click", activateZone);
});

let statsAnimated = false;

const animateStats = () => {
  if (statsAnimated) return;

  const trigger = Array.from(statNumbers).some((stat) => stat.getBoundingClientRect().top < window.innerHeight - 60);
  if (!trigger) return;
  statsAnimated = true;

  statNumbers.forEach((stat) => {
    const target = Number(stat.dataset.target || 0);
    const suffix = stat.dataset.suffix || "";
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 50));

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        stat.textContent = `${target.toLocaleString("vi-VN")}${suffix}`;
        clearInterval(timer);
        return;
      }
      stat.textContent = `${current.toLocaleString("vi-VN")}${suffix}`;
    }, 24);
  });
};

const createRipple = (event) => {
  const button = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  const rect = button.getBoundingClientRect();

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add("ripple");

  const existingRipple = button.querySelector(".ripple");
  if (existingRipple) existingRipple.remove();
  button.appendChild(circle);
};

const bindRipple = () => {
  document.querySelectorAll(".ripple-btn, .zone-button, .theme-toggle, .menu-toggle").forEach((button) => {
    if (button.dataset.rippleBound === "1") return;
    button.dataset.rippleBound = "1";
    button.addEventListener("click", createRipple);
  });
};

bindRipple();

window.addEventListener("scroll", () => {
  setActiveLink();
  animateStats();
});

window.addEventListener("load", () => {
  setActiveLink();
  animateStats();
  bindRipple();
});
