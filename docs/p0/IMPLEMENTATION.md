# P0 — Bước triển khai đầu tiên

Ngày: 04/11/2026. Nguồn lực: một người. Web React hiện tại + Flutter di động + Spring Boot/PostgreSQL.

P1 đã nối số liệu vào PostgreSQL và thay phép tính trên web. Test P1 dùng cụm PostgreSQL riêng. [Bàn giao P1](../p1/IMPLEMENTATION.md)

## Đã triển khai trong bước này

| Phần | Kết quả |
|---|---|
| Google | Server xác minh chữ ký RS256 qua JWKS cố định của Google; kiểm tra issuer, audience/azp, expiry, iat/nbf, sub, verified email; chỉ dùng claim đã xác minh |
| Định danh | Tra cứu bằng `GOOGLE + provider_id=sub`; không tự ghép tài khoản theo email |
| Liên kết | `POST /api/auth/google/link` yêu cầu phiên đang đăng nhập và Google token có cùng email; giữ nguyên user ID, dữ liệu và mật khẩu cũ |
| Web | GIS ID-token button thay access-token/userinfo flow; đọc client ID công khai từ server; bỏ Facebook đăng nhập bằng dữ liệu mẫu |
| HTTP security | Hồ sơ/me/link/logout-all không còn nằm trong wildcard public; CORS dùng URL cấu hình thực thay chuỗi `${app.frontend.url}` chưa resolve |
| Ownership | Truy vấn task theo subject phải xác nhận subject thuộc account hiện tại, kể cả có status filter |
| Số liệu | Chốt `study-metrics-v1`, bộ fixture JSON dùng chung và engine Java thuần có kiểm thử; chưa thay phép tính web trước khi có persistence/snapshot P1 |
| Thiết kế P1 | Bản schema SQL để review, hợp đồng sessions/metrics/sync và wireframe trạng thái; chưa chạy SQL trên DB |

## Cấu hình và cách dùng Google

Backend: `GOOGLE_CLIENT_ID` là web client ID cho Google Identity Services. `GOOGLE_CLIENT_IDS` là allowlist phân tách dấu phẩy; bao gồm web ID và Android ID nếu token có `azp` tương ứng. Giá trị mặc định web ID cũ được giữ để không đổi cấu hình Google Console hiện có. Khi chưa có allowlist hợp lệ, verifier không chấp nhận token.

Frontend đọc `/api/auth/google/config`; đây chỉ là client ID công khai, không có client secret. API base URL có thể đặt qua `VITE_API_BASE_URL`. Cần cấu hình authorized JavaScript origins trong Google Console cho origin thực tế. Google JWKS/GIS cần kết nối mạng; kiểm thử tự động dùng khóa RSA cục bộ, không gọi Google.

- Đăng nhập mới: `POST /api/auth/oauth2` với `{ "provider": "GOOGLE", "token": "ID_TOKEN" }`.
- LOCAL muốn thêm Google: đăng nhập bằng email/mật khẩu → Hồ sơ → Liên kết Google → chọn Google cùng email.
- Legacy GOOGLE có `provider_id` null: không tự ghép chỉ vì email trùng. Nếu còn phiên hợp lệ, dùng luồng liên kết. Nếu đã mất phiên và không có mật khẩu, cần quy trình khôi phục được xác minh; không tự điền `sub` từ email trong SQL.
- Tài khoản đã map sub vẫn đăng nhập đúng user ID nếu email Google đổi; P0 không tự đổi email hệ thống vì JWT/user lookup hiện phụ thuộc email. Việc cập nhật email cần luồng riêng.
- Schema hiện chỉ hỗ trợ một provider ID trên user. Luồng này dành cho Google; nhiều identity/provider, unlink/recovery hoàn chỉnh thuộc thiết kế identity mở rộng sau.
- API nhận JSON qua callback GIS và không đặt cookie phiên đăng nhập. Nếu chuyển sang GIS POST redirect hoặc refresh cookie ở P1, phải thêm CSRF tương ứng; không tái dùng ngoại lệ CSRF của bearer flow.

Nguồn: [Google ID-token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [Spring JWT decoding](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html).

## Kiểm thử

- `mvn -o "-Dtest=P0*Test" test`: kiểm tra JWT có chữ ký thật/khóa giả/issuer/audience/time; không auto-link; link giữ account; API được bảo vệ và CORS; task ownership; metric fixtures.
- Các test P0 dùng mocks hoặc MVC slice, không dùng PostgreSQL. **Không chạy toàn bộ integration suite trên DB mặc định**: cấu hình test hiện tại trỏ cùng tên DB `studymate`; cần DB test tách riêng trước khi bật suite rộng.
- `cd frontend; npm test`: các test metrics web hiện hành và request/token storage của luồng OAuth mới.
- `npm run build`: tạo bundle và đồng bộ static cho Spring Boot theo script hiện tại.
- Test Google thật cần tài khoản và cấu hình Console của người dùng; chưa coi việc test bằng JWT RSA cục bộ là đã hoàn tất đăng nhập end-to-end với Google.

Kết quả xác nhận của bước này: **41 test P0 backend đạt, 12 test frontend đạt**, frontend build thành công. Đã kiểm tra UI login/link thành công và lỗi credential/config bằng SDK giả ở 390×844, không tràn ngang; fixture nằm ở `frontend/tests/auth-preview.html`, không nằm trong bundle production. Cần khởi động lại backend để các endpoint/verifier mới có hiệu lực; chỉ tải lại trang trên backend cũ chưa đủ.

Khi triển khai ngoài môi trường phát triển, cần đối soát và thu hồi phiên/refresh token đã phát hành qua luồng OAuth email-only cũ. Sửa endpoint mới không tự làm mất hiệu lực các token đã cấp trước đó. Lập phương án liên kết/khôi phục cho account Google cũ trước khi thu hồi; không chạy SQL thay đổi danh tính hoặc xoay secret tự động trong bước này.

## Rà soát quyền còn phải hoàn tất trước gate R1

| Vấn đề | Hướng xử lý tiếp | Trạng thái |
|---|---|---|
| `/uploads/**` còn public/static | Thay bằng endpoint kiểm tra quyền hoặc signed URL ngắn hạn; đổi viewer/ảnh/attachment đồng thời và test account chéo | Chưa sửa trong P0 này |
| AI quiz/mindmap viewer và attempt | Kiểm tra quyền qua source document/note trước trả câu hỏi/đáp án hoặc ghi attempt | Cần audit và test đủ các entry point |
| Async jobs | Kiểm tra owner trong status/result; không để job ID thay thế quyền truy cập | Cần audit |
| Refresh-token reuse, revoke all | Thiết kế session theo thiết bị; xử lý concurrent refresh và reuse; hiện vẫn dùng cơ chế rotation cũ | P1/R1 |
| `OfflineFallbackProvider` và text extraction fallback | Loại dữ liệu mẫu khỏi đường production, trả trạng thái thật và queue/retry | Trước RAG; chưa sửa ở bước auth này |

Vì các mục trên còn mở, **chưa đánh dấu hoàn thành toàn bộ P0 hoặc nền tảng R1**. Bước đã xong là xác thực Google có kiểm chứng, chặn các đường truy cập đã sửa và bộ hợp đồng số liệu để tiếp tục P1. Chưa có sync engine hoặc ứng dụng Flutter hoạt động từ thay đổi này.
