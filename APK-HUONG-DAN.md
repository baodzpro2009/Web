# Tạo APK cho Ví Riêng

## Build web app

```bash
npm run build:web
```

## Đồng bộ web app sang Android

```bash
npm run cap:sync
```

## Mở project Android

```bash
npm run cap:open
```

## Build APK debug

Trong Android Studio:

`Build > Build Bundle(s) / APK(s) > Build APK(s)`

Hoặc dùng terminal:

```bash
npm run android:debug
```

APK debug thường nằm ở:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Tạo APK release để gửi người khác cài

Trong Android Studio:

1. `Build > Generate Signed Bundle / APK`
2. Chọn `APK`
3. Nếu chưa có keystore:
   - bấm `Create new...`
   - lưu file `.jks` ở nơi an toàn
   - đặt `Key alias`, `Password`
4. Chọn build type `release`
5. Bấm `Finish`

APK release thường nằm ở:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## Gợi ý trước khi xuất bản

- Tên app Android hiện là `Ví Riêng`
- App Android lấy nội dung web từ thư mục `dist`, không dùng `server.js`
- Nếu muốn thay launcher icon cho đúng brand tài chính, mở:
  `app > res > New > Image Asset`
  rồi import icon mới của bạn

## Lưu ý

- Mỗi lần sửa `index.htm` hoặc `assets/*`, cần chạy lại:

```bash
npm run cap:sync
```

- Nếu build bằng terminal mà lỗi Java hoặc SDK, mở Android Studio để nó tự cấu hình môi trường dễ hơn
