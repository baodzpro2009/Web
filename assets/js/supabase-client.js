import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SITE_CONFIG } from "./site-config.js";

const supabaseUrl = SITE_CONFIG.SUPABASE_URL?.trim() || "";
const supabaseAnonKey = SITE_CONFIG.SUPABASE_ANON_KEY?.trim() || "";
const configured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("YOUR_PROJECT") &&
  !supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY");

const supabase = configured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: SITE_CONFIG.STORAGE_KEY || "hoa-phu-school-site"
      }
    })
  : null;

const assertConfigured = () => {
  if (!supabase) {
    throw new Error("Chưa cấu hình Supabase.");
  }
};

const unwrap = ({ data, error }) => {
  if (error) throw new Error(error.message || "Yêu cầu Supabase thất bại.");
  return data;
};

const POST_COLUMNS_BASE = "id,title,summary,content,category,image,published_at,created_at";
const POST_COLUMNS_WITH_VIDEO = `${POST_COLUMNS_BASE},video_url`;

const hasMissingVideoColumnError = (error) => Boolean(error?.message) && error.message.includes("video_url");

const normalizePost = (post) => ({
  ...post,
  video_url: post?.video_url || ""
});

export const isSupabaseConfigured = () => configured;

export const getAdminSession = async () => {
  assertConfigured();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message || "Không đọc được phiên đăng nhập.");
  return data.session;
};

export const signInAdmin = async (email, password) => {
  assertConfigured();
  if (!email || !password) {
    throw new Error("Vui lòng nhập email và mật khẩu.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message || "Đăng nhập thất bại.");
  return data.session;
};

export const signOutAdmin = async () => {
  assertConfigured();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message || "Đăng xuất thất bại.");
};

export const listPosts = async () => {
  assertConfigured();
  const withVideo = await supabase
    .from("posts")
    .select(POST_COLUMNS_WITH_VIDEO)
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (!withVideo.error) {
    return (withVideo.data || []).map(normalizePost);
  }

  if (!hasMissingVideoColumnError(withVideo.error)) {
    throw new Error(withVideo.error.message || "KhÃ´ng táº£i Ä‘Æ°á»£c danh sÃ¡ch bÃ i viáº¿t.");
  }

  const fallback = await unwrap(
    await supabase
      .from("posts")
      .select(POST_COLUMNS_BASE)
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false })
  );

  return (fallback || []).map(normalizePost);
};

export const getPostById = async (id) => {
  assertConfigured();
  const withVideo = await supabase
    .from("posts")
    .select(POST_COLUMNS_WITH_VIDEO)
    .eq("id", id)
    .maybeSingle();

  if (!withVideo.error) {
    return withVideo.data ? normalizePost(withVideo.data) : withVideo.data;
  }

  if (!hasMissingVideoColumnError(withVideo.error)) {
    throw new Error(withVideo.error.message || "KhÃ´ng táº£i Ä‘Æ°á»£c chi tiáº¿t bÃ i viáº¿t.");
  }

  const fallback = await unwrap(
    await supabase
      .from("posts")
      .select(POST_COLUMNS_BASE)
      .eq("id", id)
      .maybeSingle()
  );

  return fallback ? normalizePost(fallback) : fallback;
};

export const createPost = async ({ title, summary, content, category, image = "", video_url = "" }) => {
  assertConfigured();
  if (!title) throw new Error("Tiêu đề không được để trống.");
  if (!image && !video_url) throw new Error("Hãy nhập ảnh hoặc video cho bài viết.");

  const payload = {
    title,
    summary,
    content,
    category,
    image,
    published_at: new Date().toISOString()
  };

  const withVideo = await supabase
    .from("posts")
    .insert({
      ...payload,
      video_url
    })
    .select(POST_COLUMNS_WITH_VIDEO)
    .single();

  if (!withVideo.error) {
    return normalizePost(withVideo.data);
  }

  if (!hasMissingVideoColumnError(withVideo.error)) {
    throw new Error(withVideo.error.message || "Tạo bài viết thất bại.");
  }

  if (video_url) {
    throw new Error("Bang posts cua Supabase chua co cot video_url. Chay SQL: alter table public.posts add column if not exists video_url text default '';");
  }

  const fallback = await unwrap(
    await supabase
      .from("posts")
      .insert(payload)
      .select(POST_COLUMNS_BASE)
      .single()
  );

  return normalizePost(fallback);
};

export const deletePostById = async (id) => {
  assertConfigured();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message || "Xóa bài viết thất bại.");
};
