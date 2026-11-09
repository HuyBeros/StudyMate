# Hợp đồng số liệu `study-metrics-v1`

P0, 04/11/2026. Bộ quy tắc và fixture tham chiếu để backend, web và Flutter dùng chung. Bản triển khai tham chiếu: `StudyMetricsCalculator.java`. **Chưa nối engine này vào màn hình đang chạy**: P1 cần lưu phiên/sự kiện và cung cấp snapshot server trước, rồi thay đồng loạt phép tính web cũ. Không chạy hai phiên bản chính sách như thể cùng một chỉ số.

## Quy tắc V1

- `asOf` là thời điểm UTC do server xác định; mọi phép tính trong một response dùng cùng thời điểm. Timezone là IANA ID của tài khoản, mặc định `Asia/Ho_Chi_Minh`. Không dùng timezone ngầm của JVM hoặc điện thoại.
- Ngày học hợp lệ khi có ít nhất một sự kiện hoàn thành nhiệm vụ chưa bị thu hồi, hoặc tổng thời gian tập trung thực tế trong ngày đạt **600 giây**. Nhiều phiên ngắn được cộng lại. Đây là chính sách V1 được chọn cho bước nền tảng; đổi ngưỡng phải tạo metrics version mới.
- Chỉ tính segment đã đóng của phiên `COMPLETED` hoặc `STOPPED`; không tính RUNNING/PAUSED/DISCARDED hoặc segment kết thúc sau `asOf`.
- Giờ tập trung vẫn ghi nhận phiên dưới 10 phút; tooltip phân biệt thời lượng thực tế với ngày đủ điều kiện streak. Không coi mỗi chấm heatmap là một ngày đã duy trì streak.
- Thời lượng tính bằng giây thực tế; hợp khoảng thời gian trùng trước khi cộng, kể cả hai thiết bị. Việc gán phần trùng cho từng môn cần đối soát trong P1; không cộng hai lần vào tổng toàn tài khoản.
- Chia interval qua nửa đêm theo ranh giới ngày của timezone; thời gian nghỉ không có segment nên không được tính. Ngày DST có thể dài 23/25 giờ.
- Streak đếm từ hôm nay nếu hôm nay hợp lệ; nếu chưa, đếm từ hôm qua. Nếu cả hai không hợp lệ thì bằng 0. Ngày được freeze và lượt SRS chưa có trong V1; không giả lập chúng.
- Tuần bắt đầu thứ Hai 00:00 theo timezone. `weekFocusSeconds` kết thúc tại `asOf`. Không lấy thời lượng lịch học dự kiến.
- Tiến độ = `round(100 × completedTasks / totalTasks)` với quy tắc nửa làm tròn lên. Không có nhiệm vụ → `progressPercent: null`; UI hiển thị chưa có mục tiêu, không hiển thị hoàn thành 0%.
- `TaskState` là snapshot hiện tại cho tiến độ; `Completion` là bằng chứng lịch sử độc lập. Xóa một nhiệm vụ không xóa hoạt động thực tế đã xảy ra. Hủy hoàn thành là sự kiện thu hồi tường minh, không tự suy đoán từ việc xóa.
- Cùng ID, cùng nội dung gửi lặp được khử trùng. Cùng ID nhưng khác nội dung là lỗi đầu vào cần giải quyết, không chọn bản cuối theo thứ tự đến.
- Giờ hiển thị lấy `focusSeconds / 3600`, làm tròn chỉ ở UI; không cộng các số giờ đã làm tròn. Bộ lọc môn/ngày phải ghi rõ; streak toàn tài khoản không thay theo bộ lọc biểu đồ.

## Đầu vào và đầu ra

`cases.json` có 18 ca chuẩn với expected value viết tường minh: không mục tiêu, pending, nhiệm vụ hoàn thành, grace hôm qua, đứt chuỗi, ngưỡng 599/600 giây, nhiều phiên, pause, retry, hai máy trùng giờ, nửa đêm, ranh giới tuần, dữ liệu tương lai, phiên đang chạy, xóa/thu hồi nhiệm vụ và DST.

Mỗi snapshot P1 phải thêm `syncRevision` cho toàn bộ dữ liệu đầu vào và trả:

```json
{
  "metricsVersion": "study-metrics-v1",
  "timezone": "Asia/Ho_Chi_Minh",
  "asOf": "2026-11-04T05:00:00Z",
  "syncRevision": 42,
  "streak": 1,
  "totalFocusSeconds": 1500,
  "weekFocusSeconds": 1500,
  "totalTasks": 0,
  "completedTasks": 0,
  "progressPercent": null,
  "days": [{"date": "2026-11-04", "focusSeconds": 1500, "completedTasks": 0, "qualifies": true}]
}
```

## Chuyển dữ liệu hiện tại

1. Xác định timezone thực tế khi các `LocalDateTime` cũ được ghi; không tự gắn UTC.
2. Nhập localStorage đúng account; session ID cũ là khóa khử trùng. Server ACK rồi mới đánh dấu đã chuyển.
3. Phiên cũ chỉ có thời điểm kết thúc và số phút, không có segment: giữ provenance `LEGACY_DURATION`; không dựng thời điểm bắt đầu giả để áp dụng hợp interval. P1 phải có chính sách nhập/đối soát riêng và thể hiện nguồn dữ liệu.
4. Với nhiệm vụ cũ DONE có `completedAt`, tạo sự kiện import định danh ổn định một lần. Thiếu timestamp thì chỉ đưa vào tiến độ hiện tại, không tạo ngày học quá khứ.
5. Không thay lịch sử theo timezone mới mà không có hành động rõ ràng. Timezone lịch sử và thời điểm hiệu lực phải được lưu trước khi hỗ trợ thay timezone.

## Kiểm tra

`mvn -o -Dtest=P0MetricsContractTest test` không cần DB hoặc mạng. Dart/JS ở P1/P3 phải đọc chính tệp fixture này, không sao chép expected values vào một bộ khác dễ lệch.
