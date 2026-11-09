# Hợp đồng P1/P2: phiên học, metrics và đồng bộ

Trạng thái: thiết kế review được, **chưa phải endpoint đã triển khai**. Các endpoint Google ở `IMPLEMENTATION.md` là phần đã có code. Mọi route dưới đây cần bearer token, response theo `ApiResponse<T>`; server lấy account từ security context. Entity DTO dùng public UUID, version, timestamp UTC ISO 8601; không dùng khóa sequence nội bộ làm ID tạo khi offline.

## Phiên học và mục tiêu

| Endpoint đề xuất | Hành vi |
|---|---|
| `POST /api/study/sessions` | Tạo phiên từ public ID + task public ID tùy chọn; server kiểm tra task/subject thuộc account; dùng Idempotency-Key |
| `POST /api/study/sessions/{id}/transitions` | START/PAUSE/RESUME/COMPLETE/STOP/DISCARD, baseVersion và mutation ID; đóng/mở segment tương ứng |
| `GET /api/study/sessions?from=&to=&subjectId=` | Đọc lịch sử đã xác nhận; pagination, timezone và bộ lọc rõ ràng |
| `GET /api/study/metrics?from=&to=&subjectId=` | Một snapshot nhất quán gồm `asOf`, `syncRevision`, `metricsVersion`; streak toàn tài khoản được ghi rõ, số liệu trong kỳ là phần riêng |
| `GET/PUT /api/study/preferences` | School/major, weeklyGoalSeconds, timezone và reminder local time; PUT có version |
| `POST /api/study/import/legacy` | Nhập localStorage một lần theo session public ID, provenance và timezone; trả ACK từng mục, không dựng segment giả |

Transition chỉ cho phép từ trạng thái hợp lệ. Client không gửi `userId` hoặc số phút để được cộng trực tiếp. Server xác minh segments/thời lượng hợp lý, clock skew và khoảng trùng; một session được COMPLETED hai lần trả kết quả cũ. Phiên STOPPED có thể lưu thời gian thật. PAUSED/RUNNING chưa vào số liệu đã chốt.

API metrics phải dùng engine đã qua fixture tại `contracts/metrics-v1`. Không đánh tráo tổng của phạm vi lọc với streak toàn account; không truyền `totalTasks=0` rồi ép percent thành 0. Hiển thị dữ liệu đang chờ sync là ước tính, không trộn vào snapshot đã xác nhận.

Timezone V1 được cố định sau khi có hoạt động. Yêu cầu đổi timezone khi đã có lịch sử trả 409 cho đến khi có quy trình hiệu lực/chuyển đổi lịch sử được thiết kế và kiểm thử; không âm thầm tính lại tất cả ngày học theo timezone mới.

## Push mutation

`POST /api/sync/push` nhận batch nhỏ, giới hạn kích thước và số mutation. Một mutation là một transaction nguyên tử; trả kết quả theo từng mutation. Client gửi phụ thuộc tạo-mới trước tham chiếu; mutation có phụ thuộc chưa ACK trả `DEPENDENCY_PENDING`, không tự tạo dữ liệu thiếu.

```json
{
  "deviceId": "29a762f2-82de-4e24-a185-f7068c4c146a",
  "mutations": [{
    "mutationId": "49f540af-c226-4c4a-b923-4383ad1968f0",
    "entityType": "TASK",
    "entityId": "8643c9f9-aae4-4bdf-a934-029fcb1a146a",
    "operation": "PATCH",
    "baseVersion": 4,
    "patch": {"status": "DONE"},
    "occurredAt": "2026-11-04T02:00:00Z"
  }]
}
```

```json
{
  "success": true,
  "data": {
    "results": [{
      "mutationId": "49f540af-c226-4c4a-b923-4383ad1968f0",
      "status": "ACK",
      "entityVersion": 5,
      "revision": 42
    }]
  }
}
```

Khử trùng theo `(userId, mutationId)` và payload hash chuẩn hóa. Cùng mutation ID nhưng payload khác trả lỗi `MUTATION_ID_REUSED`, không trả ACK cũ cho thao tác khác. `occurredAt` không thay thứ tự commit; phải có giới hạn/đối soát timestamp bất thường trước khi tính streak/XP.

## Xung đột

- Mutation PATCH trực tiếp có version cũ trả HTTP 409 cùng currentVersion, server snapshot và các trường xung đột.
- Với batch, HTTP 200 chỉ có nghĩa đã xử lý envelope; từng result có thể là ACK/CONFLICT/REJECTED/DEPENDENCY_PENDING. Envelope lỗi là 400/401/413/429 theo nguyên nhân.
- Hai trường độc lập chỉ tự merge nếu server có base values/field revision chứng minh không cùng bị sửa; P1 ban đầu có thể trả conflict toàn entity để ưu tiên không mất dữ liệu.
- Client giữ bản nháp và original mutation; người dùng giải quyết bằng mutation ID mới với baseVersion mới. Không sửa mutation đã ACK.
- Xóa là tombstone có version. Sửa vào tombstone không tự hồi sinh; khôi phục thành record mới có liên kết provenance.
- Trạng thái DONE/TODO xung đột không dựa vào giờ thiết bị để chọn người thắng. Ghi chú chưa dùng CRDT, có phương án giữ cả hai bản.

## Pull và cursor

`GET /api/sync/pull?cursor=OPAQUE&limit=100` trả changes theo revision đã commit, nextCursor, hasMore và snapshot upper bound. Cursor ký hoặc opaque, gắn user và protocol version; không được dùng cursor của account khác.

Client ghi changes và cursor cùng transaction local, rồi mới công nhận trang đó đã nhận. Client phải drain hết hasMore dù revision mới tiếp tục xuất hiện. Snapshot ban đầu có upper-bound revision nhất quán; sau snapshot tiếp tục pull từ mốc đó.

Cursor hết hạn/tombstone đã dọn: HTTP 410 với yêu cầu full resync. **Giữ nguyên local outbox** trong quá trình resync, rebase sau snapshot rồi xử lý conflict. Không xóa các thay đổi chưa ACK.

SSE/push chỉ báo revision mới, không phải nguồn dữ liệu duy nhất. Mở app/reconnect luôn pull để phục hồi các sự kiện đã lỡ. Không chuyển số revision từ SSE thẳng thành cursor đã xử lý.

## Kịch bản nghiệm thu hợp đồng

1. Retry một task mutation 10 lần: một task, một completion event và một revision được chấp nhận.
2. A/B cùng sửa version 4: lần đầu ACK version 5; lần sau CONFLICT, vẫn giữ bản sửa offline.
3. Đóng app sau khi lưu local nhưng trước POST: outbox còn nguyên sau restart.
4. Server commit, client mất mạng trước ACK: gửi lại nhận kết quả cũ, không cộng lại giờ/streak.
5. Client nhận pull nhưng local transaction thất bại: cursor không nhảy qua trang chưa được ghi.
6. Hai server transaction kết thúc ngược thứ tự: cursor không bỏ sót change chưa commit.
7. Một nơi xóa, nơi khác sửa: nhận tombstone/conflict; không tự sống lại record.
8. Token hết hạn: dừng gửi, xác thực lại; không chuyển outbox sang account mới.
9. Account khác gửi entity ID, mutation ID hoặc cursor đã biết: không đọc được dữ liệu hay trạng thái mutation của chủ cũ.
10. Phiên offline trùng interval trên hai máy: tổng thời gian toàn account lấy union, phân bổ môn được đối soát.

## Thứ tự áp dụng P1

Review schema → DB migration trên môi trường test riêng → session persistence/transitions → metrics snapshot → migration localStorage → thay đồng loạt ba màn hình web. Sau đó mới thêm sync protocol/outbox ở P2 và Flutter P3. Chỉ công bố “một nguồn dữ liệu đã đồng bộ” khi gate hai client hội tụ đã đạt.
