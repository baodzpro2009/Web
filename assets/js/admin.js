import { isSupabaseConfigured, signInAdmin, signOutAdmin, getAdminSession, listPosts, createPost, deletePostById } from "./supabase-client.js";

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const loginSection = document.getElementById("loginSection");
  const adminDashboard = document.getElementById("adminDashboard");
  const loginStatus = document.getElementById("loginStatus");
  const logoutButton = document.getElementById("logoutButton");
  const postForm = document.getElementById("postForm");
  const postStatus = document.getElementById("postStatus");
  const adminPostsContainer = document.getElementById("adminPosts");
  const configNotice = document.getElementById("configNotice");
  const imageFileInput = document.getElementById("postImageFile");
  const imageFileName = document.getElementById("postImageFileName");
  const imagePreview = document.getElementById("postImagePreview");
  const imagePreviewImg = document.getElementById("postImagePreviewImg");
  const videoFileInput = document.getElementById("postVideoFile");
  const videoFileName = document.getElementById("postVideoFileName");
  const videoPreview = document.getElementById("postVideoPreview");
  const videoPreviewEl = document.getElementById("postVideoPreviewEl");

  let posts = [];

  const setStatus = (element, message, color = "var(--muted)") => {
    if (!element) return;
    element.textContent = message;
    element.style.color = color;
  };

  const showImagePreview = (src) => {
    if (!imagePreview || !imagePreviewImg) return;
    if (!src) {
      imagePreview.classList.add("is-hidden");
      imagePreviewImg.removeAttribute("src");
      return;
    }

    imagePreviewImg.src = src;
    imagePreview.classList.remove("is-hidden");
  };

  const showVideoPreview = (src) => {
    if (!videoPreview || !videoPreviewEl) return;
    if (!src) {
      videoPreview.classList.add("is-hidden");
      videoPreviewEl.removeAttribute("src");
      videoPreviewEl.load();
      return;
    }

    videoPreviewEl.src = src;
    videoPreview.classList.remove("is-hidden");
    videoPreviewEl.load();
  };

  const setImageFileName = (name = "") => {
    if (!imageFileName) return;
    imageFileName.textContent = name || "Chưa chọn ảnh";
    imageFileName.classList.toggle("has-file", Boolean(name));
  };

  const setVideoFileName = (name = "") => {
    if (!videoFileName) return;
    videoFileName.textContent = name || "Chưa chọn video";
    videoFileName.classList.toggle("has-file", Boolean(name));
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Khong doc duoc file anh."));
      reader.readAsDataURL(file);
    });

  const loadImageElement = (src) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Khong xu ly duoc file anh."));
      image.src = src;
    });

  const fileToOptimizedImageDataUrl = async (file) => {
    if (!file) return "";
    if (!file.type.startsWith("image/")) {
      throw new Error("File duoc chon khong phai anh.");
    }

    const source = await readFileAsDataUrl(file);
    const image = await loadImageElement(source);
    const maxWidth = 1600;
    const scale = image.width > maxWidth ? maxWidth / image.width : 1;
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return source;

    context.drawImage(image, 0, 0, width, height);

    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const quality = outputType === "image/png" ? undefined : 0.86;
    return canvas.toDataURL(outputType, quality);
  };

  const fileToVideoDataUrl = async (file) => {
    if (!file) return "";
    if (!file.type.startsWith("video/")) {
      throw new Error("File duoc chon khong phai video.");
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error("Video qua lon. Hay chon file duoi 20MB.");
    }
    return readFileAsDataUrl(file);
  };

  const setLoggedInState = async () => {
    loginSection?.classList.add("is-hidden");
    adminDashboard?.classList.remove("is-hidden");
    await loadPosts();
  };

  const setLoggedOutState = () => {
    adminDashboard?.classList.add("is-hidden");
    loginSection?.classList.remove("is-hidden");
  };

  const formatPostDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN");
  };

  const renderPosts = () => {
    if (!adminPostsContainer) return;
    adminPostsContainer.innerHTML = "";

    if (posts.length === 0) {
      adminPostsContainer.innerHTML = "<p style='color: var(--muted);'>Chưa có bài viết nào.</p>";
      return;
    }

    posts.forEach((post) => {
      const item = document.createElement("div");
      item.className = "admin-post-item";
      item.style.cssText =
        "display:flex;justify-content:space-between;align-items:center;gap:16px;padding:15px;border:1px solid var(--line);border-radius:15px;margin-bottom:10px;background:var(--surface-strong);";
      item.innerHTML = `
        <div>
          <h4 style="margin:0">${post.title || "Không có tiêu đề"}</h4>
          <span style="font-size:12px; color:var(--muted)">${post.category || "Thông báo"} • ${formatPostDate(post.published_at || post.created_at || post.date)}</span>
          ${post.image || post.video_url ? `<p style="margin-top:6px;font-size:12px;color:var(--muted);">${post.video_url ? "Có video" : "Có ảnh"}</p>` : ""}
        </div>
        <button type="button" class="btn-danger" style="padding:5px 12px;border-radius:8px;cursor:pointer;" data-id="${post.id}">Xóa</button>
      `;
      adminPostsContainer.appendChild(item);
    });

    adminPostsContainer.querySelectorAll(".btn-danger").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-id");
        if (!id) return;
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

        setStatus(postStatus, "Đang xóa bài viết...");
        try {
          await deletePostById(id);
          posts = posts.filter((post) => post.id !== id);
          renderPosts();
          setStatus(postStatus, "Đã xóa bài viết.", "var(--primary)");
        } catch (error) {
          setStatus(postStatus, error.message, "#dc3545");
        }
      });
    });
  };

  const loadPosts = async () => {
    setStatus(postStatus, "Đang tải bài viết...");
    try {
      posts = await listPosts();
      renderPosts();
      setStatus(postStatus, "");
    } catch (error) {
      setStatus(postStatus, error.message, "#dc3545");
    }
  };

  if (!isSupabaseConfigured()) {
    setLoggedOutState();
    configNotice.hidden = false;
    setStatus(loginStatus, "Chưa cấu hình Supabase. Mở assets/js/site-config.js rồi điền SUPABASE_URL và SUPABASE_ANON_KEY.", "#dc3545");
    return;
  }

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("adminUsername")?.value.trim() || "";
    const password = document.getElementById("adminPassword")?.value || "";

    setStatus(loginStatus, "Đang đăng nhập...");

    try {
      await signInAdmin(email, password);
      setStatus(loginStatus, "Đăng nhập thành công.", "var(--primary)");
      await setLoggedInState();
    } catch (error) {
      setStatus(loginStatus, error.message, "#dc3545");
    }
  });

  imageFileInput?.addEventListener("change", async () => {
    const file = imageFileInput.files?.[0];
    if (!file) {
      setImageFileName("");
      showImagePreview("");
      return;
    }

    try {
      const previewDataUrl = await fileToOptimizedImageDataUrl(file);
      setImageFileName(file.name);
      showImagePreview(previewDataUrl);
      setStatus(postStatus, "");
    } catch (error) {
      imageFileInput.value = "";
      setImageFileName("");
      showImagePreview("");
      setStatus(postStatus, error.message, "#dc3545");
    }
  });

  videoFileInput?.addEventListener("change", async () => {
    const file = videoFileInput.files?.[0];
    if (!file) {
      setVideoFileName("");
      showVideoPreview("");
      return;
    }

    try {
      const previewDataUrl = await fileToVideoDataUrl(file);
      setVideoFileName(file.name);
      showVideoPreview(previewDataUrl);
      setStatus(postStatus, "");
    } catch (error) {
      videoFileInput.value = "";
      setVideoFileName("");
      showVideoPreview("");
      setStatus(postStatus, error.message, "#dc3545");
    }
  });

  postForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("postTitle")?.value.trim() || "";
    const category = document.getElementById("postCategory")?.value.trim() || "Thông báo";
    const imageFile = imageFileInput?.files?.[0] || null;
    const videoFile = videoFileInput?.files?.[0] || null;
    let image = "";
    let videoUrl = "";
    const summary = document.getElementById("postSummary")?.value.trim() || "";
    const content = document.getElementById("postContent")?.value.trim() || "";

    if (imageFile) {
      setStatus(postStatus, "Dang xu ly anh tu may...");
      try {
        image = await fileToOptimizedImageDataUrl(imageFile);
      } catch (error) {
        setStatus(postStatus, error.message, "#dc3545");
        return;
      }
    }

    if (videoFile) {
      setStatus(postStatus, "Dang xu ly video tu may...");
      try {
        videoUrl = await fileToVideoDataUrl(videoFile);
      } catch (error) {
        setStatus(postStatus, error.message, "#dc3545");
        return;
      }
    }

    if (!image && !videoUrl) {
      setStatus(postStatus, "Nhập ít nhất 1 media: ảnh hoặc video.", "#dc3545");
      return;
    }

    setStatus(postStatus, "Đang lưu bài viết...");

    try {
      const createdPost = await createPost({ title, category, image, video_url: videoUrl, summary, content });
      posts.unshift(createdPost);
      renderPosts();
      postForm.reset();
      const categoryInput = document.getElementById("postCategory");
      if (categoryInput) categoryInput.value = "Thông báo";
      setImageFileName("");
      setVideoFileName("");
      showImagePreview("");
      showVideoPreview("");
      setStatus(postStatus, "Đã lưu bài viết thành công.", "var(--primary)");
    } catch (error) {
      setStatus(postStatus, error.message, "#dc3545");
    }
  });

  logoutButton?.addEventListener("click", async () => {
    try {
      await signOutAdmin();
    } finally {
      setLoggedOutState();
      setStatus(loginStatus, "Đã đăng xuất.", "var(--primary)");
    }
  });

  try {
    const session = await getAdminSession();
    if (session) {
      await setLoggedInState();
    } else {
      setLoggedOutState();
    }
  } catch (error) {
    setLoggedOutState();
    setStatus(loginStatus, error.message, "#dc3545");
  }
});
