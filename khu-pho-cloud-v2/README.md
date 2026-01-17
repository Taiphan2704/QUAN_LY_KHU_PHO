# 🏘️ Quản Lý Khu Phố Thông Minh

Hệ thống quản lý khu phố thông minh - Khu phố 25 Long Trường

## Tính năng

- 🏠 Quản lý hộ dân
- 👥 Quản lý nhân khẩu
- 📢 Thông báo khu phố
- 📊 Thống kê dân số
- 🤖 Trợ lý AI (Gemini)
- 👔 Phân quyền người dùng

## Tài khoản mặc định

| Vai trò | Tên đăng nhập | Mật khẩu |
|---------|---------------|----------|
| Admin | admin | admin123 |
| Trưởng KP | truongkp | chief123 |
| Công an | congan | police123 |
| Thành viên | thanhvien | member123 |

## Cài đặt

```bash
npm install
npm start
```

## Deploy lên Render

1. Tạo repo GitHub và upload code
2. Vào render.com → New Web Service
3. Connect GitHub repo
4. Cấu hình:
   - Build Command: `yarn install`
   - Start Command: `node server.js`
5. Thêm Environment Variables:
   - `JWT_SECRET`: khóa bí mật JWT
   - `GEMINI_API_KEY`: API key Google Gemini

## Công nghệ

- Node.js + Express
- JSON Database
- Google Gemini AI
- Chart.js
