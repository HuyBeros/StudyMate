# Đưa StudyMate lên Render

Chạy một **Web Service (Docker)** cho React, Spring Boot và phòng học WebSocket. Tạo một **Render Postgres** cùng vùng với Web Service. Dockerfile build giao diện với API tại `/api` trên cùng domain. Render cấp địa chỉ HTTPS và hỗ trợ WebSocket. [Web Service](https://render.com/docs/web-services) · [Docker](https://render.com/docs/docker) · [WebSocket](https://render.com/docs/websocket)

## Khởi tạo database

Tạo một database trống trên Render. Dùng thông tin kết nối **External** trong mục **Connect** để chạy `psql` từ máy của bạn. Trong PowerShell, chạy ở thư mục gốc dự án và thay ba giá trị mẫu. `-W` yêu cầu nhập mật khẩu khi kết nối. [Kết nối Render Postgres](https://render.com/docs/postgresql-creating-connecting)

```powershell
$env:PGSSLMODE = 'require'
$initArgs = @(
    '-X', '-W', '-v', 'ON_ERROR_STOP=1',
    '-h', '<external-host>', '-U', '<user>', '-d', '<database>',
    '-f', 'src/test/resources/db/p1-legacy-schema.sql',
    '-c', "SET search_path TO public; SET studymate.legacy_timezone = 'Asia/Ho_Chi_Minh'",
    '-f', 'src/main/resources/db/migration_003_study_foundation.sql',
    '-f', 'src/main/resources/db/migration_004_username_login.sql',
    '-f', 'src/main/resources/db/migration_005_study_rooms.sql'
)
psql @initArgs
```

Lệnh này chạy **một lần trên database trống**. File đầu tạo cấu trúc bảng ban đầu, các file tiếp theo cập nhật bảng học tập, đăng nhập và phòng học. Spring Boot kiểm tra cấu trúc khi khởi động. Sau khi khởi tạo, có thể giới hạn truy cập từ bên ngoài trong phần **Access Control** của database.

## Tạo Web Service

1. Commit mã nguồn cần triển khai và push nhánh đó lên GitHub. Giữ `.env`, bản sao lưu database và thư mục `uploads` ở ngoài Git.
2. Trong Render, chọn **New → Web Service**, chọn repo và nhánh, rồi chọn **Docker**. Dùng thư mục gốc dự án và Dockerfile mặc định. Đặt Web Service cùng vùng với database.
3. Trong **Environment**, khai báo các biến dưới đây. Đặt **Health Check Path** là `/`. Render cấp `PORT` cho Spring Boot. [Cấu hình Web Service](https://render.com/docs/web-services)

| Biến | Giá trị |
| --- | --- |
| `DB_URL` | `jdbc:postgresql://<internal-host>:5432/<database>?stringtype=unspecified` |
| `DB_USERNAME` | Username của Render Postgres |
| `DB_PASSWORD` | Mật khẩu Render Postgres |
| `JWT_SECRET` | Chuỗi ngẫu nhiên riêng cho môi trường online, ít nhất 32 byte |
| `FRONTEND_URL` | Origin HTTPS chính xác của web, ví dụ `https://studymate-demo.onrender.com`, không có dấu `/` cuối |
| `GOOGLE_CLIENT_ID` | Web client ID nếu dùng đăng nhập Google |
| `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY` | Khóa của nhà cung cấp bạn dùng cho các chức năng AI |
| `UPLOAD_DIR` | `/var/data/uploads` khi gắn ổ đĩa tại `/var/data` |

Nếu dùng Google, thêm đúng origin HTTPS ở **Authorized JavaScript origins** của Web client. Khi đổi tên miền, cập nhật cả mục này và `FRONTEND_URL` để kết nối phòng học dùng đúng origin. [Cấu hình Sign in with Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)

Sau khi deploy, kiểm tra đăng ký, đăng nhập, mở phòng bằng hai tài khoản và tải lên một PDF mẫu. Nếu bật Google, thử nút đăng nhập trên địa chỉ HTTPS thật.

## Chọn dữ liệu và nơi lưu tệp

- **Demo ngắn hạn** có thể dùng gói miễn phí. Render Postgres Free hết hạn sau 30 ngày. Web Service Free có thể ngủ khi rảnh. Tệp tải lên trên Web Service Free sẽ mất sau khi triển khai lại hoặc khởi động lại. [Giới hạn gói Free](https://render.com/docs/free)
- **Dùng lâu dài** có thể chọn Postgres trả phí và gắn Persistent Disk cho Web Service. Thiết lập mount path `/var/data` và `UPLOAD_DIR=/var/data/uploads` để giữ file PDF, ảnh ghi chú và ảnh đại diện. Giữ một instance vì kết nối WebSocket và vé vào phòng hiện được giữ trong bộ nhớ của instance. [Persistent Disk](https://render.com/docs/disks)

Database trống khởi đầu với tài khoản và số liệu mới. Để demo biểu đồ, tạo tài khoản mẫu riêng trên môi trường online với mật khẩu mới. Hiện đường dẫn `/uploads/**` cho phép truy cập trực tiếp theo URL. Dùng tài liệu mẫu cho bản demo công khai và bổ sung kiểm tra quyền tải xuống trước khi lưu tài liệu riêng tư.
