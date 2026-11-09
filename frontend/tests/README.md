# Kiểm tra giao diện và dữ liệu học tập

`npm test` chạy kiểm thử OAuth, avatar, lịch sử định dạng số liệu cũ và client P1. Các ca P1 xác nhận lệnh gửi lại giữ nguyên UUID/payload, cách ly tài khoản, chỉ nhập phiên cũ đã được ACK và khôi phục đồng hồ từ mốc server.

`npm run dev` rồi mở `/tests/preview.html` để xem giao diện với dữ liệu giả. Trang này chặn `/api/` và chỉ cho đọc. `/tests/auth-preview.html` mô phỏng Google SDK, hỗ trợ `?mode=link`, `?failure=config` và `?mode=link&failure=credential`.

Kiểm thử web với PostgreSQL dùng `/tests/p1-live.html` hoặc `/tests/p1-mobile.html`. Trước khi mở, chạy backend trên cổng 8091, trỏ datasource đến `127.0.0.1:55438/studymate_p1_test`, rồi đặt `VITE_API_BASE_URL=http://localhost:8091/api` cho Vite. Đăng ký tài khoản fixture trên backend 8091 để thử đăng nhập. Harness tách token và dữ liệu trình duyệt khỏi ứng dụng chính. [Cách chuẩn bị DB thử nghiệm](../../docs/p1/IMPLEMENTATION.md)

Ứng dụng chính do Spring Boot phục vụ ở `http://127.0.0.1:8080/`. Các trang kiểm thử chỉ chạy trong Vite dev và không có trong bundle production.
