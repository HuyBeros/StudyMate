# P1 — Dữ liệu học tập chuẩn trên server

Triển khai từ 04/11/2026, cập nhật DB local ngày 05/11/2026. Tiếp nối [P0](../p0/IMPLEMENTATION.md). Web dùng React và backend dùng Spring Boot/PostgreSQL. Client Flutter sẽ dùng cùng API trong P3.

## Phạm vi đã triển khai

- `GET /api/study/overview` trả preferences, metrics và phiên đang chạy trong cùng một snapshot có `asOf`, `metricsVersion`, `syncRevision`, múi giờ tài khoản. Bảng điều khiển, Thống kê và Hồ sơ cùng đọc snapshot này; web chỉ đổi đơn vị giây sang giờ.
- PostgreSQL lưu phiên, từng đoạn tập trung, completion event, mục tiêu/thông tin học tập và biên nhận mutation. Mỗi tài khoản chỉ có một phiên RUNNING/PAUSED. Phiên gắn với UUID công khai của nhiệm vụ và tự nhận môn tương ứng; cũng hỗ trợ học tự do.
- Trạng thái RUNNING → PAUSED → RUNNING → COMPLETED/STOPPED/DISCARDED. Thời gian do server ghi, loại phần tạm dừng, giới hạn bằng thời lượng mục tiêu. Mốc đoạn học có độ chính xác giây để đồng hồ và phép gộp khoảng không cộng lệch phần lẻ. Hoàn tất sớm bị từ chối; “Dừng và lưu” giữ phần đã học, “Hủy” loại khỏi số liệu.
- Mutation phiên có `Idempotency-Key`; gửi lại cùng key/payload trả lại cùng kết quả đã commit. Khác payload với cùng key bị 409. Web lưu một lệnh chưa xác nhận theo tài khoản để gửi lại sau lỗi mạng/đăng nhập lại; xóa sau ACK hoặc lỗi từ chối chắc chắn. Cần cho phép browser storage trước khi bắt đầu.
- `baseVersion` của phiên và `version` preferences ngăn ghi đè thay đổi từ thiết bị khác. Web giữ bản nháp khi xung đột và cho tải bản mới một cách chủ động.
- Task DONE tạo completion event; DONE lặp lại không tạo thêm event, mở lại sẽ revoke event. Xóa task hoặc môn không xóa lịch sử học đã ghi nhận. Session giữ tên task/môn tại thời điểm tạo, không dùng FK cascade cho snapshot lịch sử.
- Dữ liệu cũ được nhập từ Hồ sơ, từng batch tối đa 100 phiên, UUID ổn định và kiểm tra trùng nội dung. Nhãn `LEGACY_DURATION` chỉ có thời điểm hoàn tất + thời lượng, không bịa đoạn bắt đầu/kết thúc. Chỉ đánh dấu phía client sau ACK, giữ nguyên bản gốc và báo bản ghi lỗi; không ghi đè mục tiêu đã sửa trên server.
- Thống kê lọc ngày/môn trên server. Bộ lọc không đổi streak toàn tài khoản. Không có nhiệm vụ thì phần trăm tiến độ là `null`. Heatmap dùng ngày thật từ server, phân biệt hoạt động ngắn với ngày đủ ngưỡng 10 phút.

Số liệu đang chạy chưa được cộng cho tới khi phiên kết thúc. Nếu đóng app lâu, thời gian vẫn bị chặn ở mục tiêu ban đầu; xác nhận muộn không dời giờ học sang ngày xác nhận. Một ngày vào chuỗi khi có completion event còn hiệu lực hoặc ít nhất 600 giây tập trung; giữ chuỗi của hôm qua đến hết hôm nay. Lịch dự kiến, hạn nộp và đăng nhập không tạo hoạt động.

Web tải lại sau mutation, khi quay lại app và mỗi 30 giây. **Chưa có SSE/realtime sync, offline CRUD/outbox đầy đủ, Flutter, push, sao lưu tự động hoặc giao diện xuất dữ liệu**; các phần đó thuộc P2–P4. Nhắc học hiện chỉ hoạt động khi web mở. Không coi P1 là hoàn tất gate R1.

## Migration và đưa vào sử dụng

Migration thực thi: [`migration_003_study_foundation.sql`](../../src/main/resources/db/migration_003_study_foundation.sql). File schema trong P0 chỉ là thiết kế tham khảo; không chạy song song hai bản.

1. Dừng các bản backend cũ đang ghi DB và tạo bản sao lưu có thể phục hồi ở nơi lưu trữ riêng.
2. Xác định múi giờ mà các cột `task.created_at/completed_at` dạng LocalDateTime đã sử dụng. Ví dụ dưới dùng `Asia/Ho_Chi_Minh`; nếu dữ liệu cũ ghi UTC thì phải thay bằng UTC. Không suy đoán từ múi giờ máy PostgreSQL hiện tại.
3. Với kết nối `psql` đã trỏ đúng DB cần nâng cấp, chạy trong cùng kết nối:

   ```powershell
   psql -v ON_ERROR_STOP=1 -c "SET studymate.legacy_timezone='Asia/Ho_Chi_Minh'" -f src/main/resources/db/migration_003_study_foundation.sql
   psql -v ON_ERROR_STOP=1 -f src/main/resources/db/migration_004_username_login.sql
   ```

   `psql` dùng PGHOST/PGPORT/PGDATABASE/PGUSER hoặc service file của môi trường; `DB_URL` dạng JDBC không phải tham số URI của psql. Không truyền mật khẩu vào lịch sử dòng lệnh.

4. Đặt `STUDY_LEGACY_TIMEZONE` cùng giá trị khi khởi động backend mới. Hibernate dùng `validate`, không tự tạo/sửa bảng. Chạy `cd frontend; npm run build` để đóng gói web và khởi động lại backend.
5. Đối chiếu số task, UUID mới, event backfill và các tài khoản mẫu. Vào Hồ sơ để nhập thời lượng/mục tiêu cũ còn lưu trên từng trình duyệt.

Migration là một transaction, từ chối khi chưa khai báo múi giờ và chạy lại không tạo thêm completion event, kể cả event đã revoke. Giữ nguyên timestamp/ID cũ, thêm `created_at_instant` để lọc kỳ không phụ thuộc múi giờ JVM; không tự tạo ngày hoàn thành cho DONE thiếu timestamp. Backfill bao gồm task đã xóa có bằng chứng hoàn thành. Cho phép task không gắn môn theo API hiện hữu. Khi đổi múi giờ trong Cài đặt, số liệu được nhóm theo ngày ở múi giờ mới; tổng thời lượng phiên không thay đổi.

Đã áp dụng migration cho DB local `localhost:5432/studymate` sau khi tạo và kiểm tra archive trong `.local-backups/`. Múi giờ đã dùng là `Asia/Ho_Chi_Minh`. Đối chiếu sau nâng cấp ghi nhận đủ 4 tài khoản, 4 bộ preferences và 0 nhiệm vụ như trước. Hibernate validate thành công và web trả HTTP 200 ở cổng 8080. Các môi trường khác cần chạy migration trước khi khởi động bản backend mới. Dùng bản sao lưu đã kiểm tra nếu cần khôi phục.

## Kiểm tra có thể chạy lại

PostgreSQL 16 được cài sẵn; script dùng thư mục `target/p1-postgres`, user fixture `studymate_p1`, chỉ listen `127.0.0.1:55438`. Không đọc `.env`, không sao chép bản ghi thật. Fixture legacy là schema-only, không chứa dữ liệu tài khoản. `application.properties` của test cũng đã chuyển khỏi DB ứng dụng.

```powershell
./scripts/setup-p1-test-db.ps1 -PgBin 'F:\postgresql\bin'
./scripts/test-p1-migration.ps1 -PgBin 'F:\postgresql\bin'
mvn -o '-Dtest=P0*Test,P1*Test' test
cd frontend
npm test
npm run lint
npm run build
```

Maven cần các dependency đã cache khi dùng `-o`; nếu chưa có cache, chạy tương tự bỏ `-o`. Không đổi datasource test sang DB thật để chạy test. Các test tích hợp khác của dự án chưa nằm trong lượt xác nhận P1.

Kiểm thử bao gồm giao dịch độc lập đồng thời: hai thiết bị tạo phiên, hai retry cùng key và hai chuyển trạng thái cùng version. Các ca khác kiểm tra quyền sở hữu, pause/resume, thời gian lẻ, DISCARD, chống COMPLETE sớm, completion undo/delete, lọc kỳ, preference conflict và legacy import. Script migration kiểm tra rollback khi thiếu timezone, dữ liệu thiếu timestamp/đã xóa, giữ timezone chính xác và chạy lại với event đã revoke.

Trình duyệt dùng `/tests/p1-live.html`, sessionStorage có namespace riêng để tránh token thật, API local cổng 8091 và tài khoản giả trên DB test. Đã kiểm tra tạo/hoàn thành task; khôi phục RUNNING/PAUSED sau reload; STOP; nhập phiên cũ giữ mục tiêu mới; hai cửa sổ sửa mục tiêu và giữ draft 409; lọc ngày vẫn giữ streak chung. Bố cục rộng 390 được kiểm tra trong iframe 390×844 cùng nguồn (viewport override của công cụ không áp dụng); không tràn ngang, không tương đương kiểm thử Android native. Fixture không vào bundle production.

## Giới hạn vận hành cần nhớ

- P1 tính trực tiếp từ lịch sử theo tài khoản dưới account lock để đảm bảo snapshot nhất quán; chưa có bảng tổng hợp/incremental projection, cần đo tải và tối ưu trong P2 khi lịch sử lớn.
- Các ID task/môn dạng số vẫn phục vụ API cũ; UUID task dùng cho phiên mới. CRUD task/môn hiện có chưa có sync version/outbox, dù task event và phiên đã được ghi trong transaction.
- Lịch sử của môn đã xóa vẫn nằm trong số liệu toàn tài khoản; bộ lọc chỉ nhận môn đang thuộc tài khoản. Legacy chỉ có thời lượng không thể xác minh khoảng chồng lấn với tracked intervals; trường `legacyFocusSeconds` công khai riêng phần này.
- Lệnh timer chưa xác nhận nằm trong browser storage theo tài khoản, không tự biến thành phiên offline. Không được xóa storage trong lúc đang chờ ACK nếu muốn giữ khả năng gửi lại cùng key.
- Bảo vệ file upload/AI fallback, thu hồi token OAuth cũ và các việc còn lại ở P0 vẫn cần xử lý trước phát hành R1; P1 không tự khắc phục các phần đó.
