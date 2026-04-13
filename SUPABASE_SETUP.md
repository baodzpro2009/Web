# Supabase Setup

## 1. Tạo project

- Tạo project mới trên Supabase.
- Vào `Project Settings > API`.
- Lấy `Project URL` và `anon public key`.
- Điền 2 giá trị đó vào [assets/js/site-config.js](/abs/path/c:/Users/CNS%20AN%20NGOC/Downloads/profile/assets/js/site-config.js:1).

## 2. Tạo bảng `posts`

Chạy SQL này trong `SQL Editor`:

```sql
create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text default '',
  content text default '',
  category text default 'Thông báo',
  image text default '',
  published_at timestamptz default now(),
  created_at timestamptz default now()
);
```

## 3. Bật RLS và policy

```sql
alter table public.posts enable row level security;

create policy "Posts are readable by everyone"
on public.posts
for select
to public
using (true);

create policy "Posts are insertable by authenticated users"
on public.posts
for insert
to authenticated
with check (true);

create policy "Posts are deletable by authenticated users"
on public.posts
for delete
to authenticated
using (true);
```

## 4. Tạo tài khoản admin

- Vào `Authentication > Users`.
- Tạo một user email/password.
- Dùng email/password đó để đăng nhập ở [pages/admin.htm](/abs/path/c:/Users/CNS%20AN%20NGOC/Downloads/profile/pages/admin.htm:1).

## 5. Deploy Netlify

- Deploy toàn bộ repo lên Netlify như site tĩnh.
- Không cần chạy `server.js` trên Netlify.
- Frontend sẽ đọc/ghi trực tiếp với Supabase.

## Ghi chú

- `anon key` có thể đặt trong frontend.
- Không đặt `service_role key` vào file JS frontend.
- `server.js` giờ chỉ còn hữu ích nếu bạn muốn chạy local theo kiểu cũ. Deploy Netlify thì không cần.
