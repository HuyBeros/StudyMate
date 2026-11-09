# P1 API — study-metrics-v1

Mọi endpoint dưới `/api/study` cần bearer JWT. Thành công: `{success:true,data:...,timestamp:...}`. Dữ liệu sai 400, thiếu xác thực 401, không thuộc tài khoản/không tồn tại 404, xung đột phiên bản/key/trạng thái 409. Client chỉ dùng `data` sau `success:true`; không dùng phép tính local thay snapshot lỗi.

| Endpoint | Nội dung |
|---|---|
| `GET /overview?from=2026-11-02&to=2026-11-04&subjectId=12` | `{preferences, metrics, activeSession}` cùng một snapshot |
| `GET /metrics` | Chỉ metrics; cùng tham số lọc với overview |
| `GET /preferences` | Preferences hiện tại và `version` |
| `PUT /preferences` | Lưu đầy đủ preferences + version đang sửa |
| `POST /sessions` | Tạo và bắt đầu phiên; cần UUID `Idempotency-Key` |
| `POST /sessions/{publicId}/transitions` | Chuyển trạng thái; cần UUID `Idempotency-Key` |
| `GET /sessions/active` | Phiên RUNNING/PAUSED hoặc `null` |
| `GET /sessions?offset=0&limit=50` | `{items,offset,limit,hasMore}`, limit 1–100; lọc from/to/subjectId tùy chọn |
| `POST /import/legacy` | Nhập tối đa 100 phiên/batch, cần UUID `Idempotency-Key` |

`from/to` mặc định từ thứ Hai tuần này đến hôm nay theo múi giờ tài khoản, bao gồm hai đầu, tối đa 366 ngày, không cho đến ngày tương lai. Session list lọc theo ngày kết thúc, hoặc ngày bắt đầu nếu chưa kết thúc. Tham số ngày dùng ISO `YYYY-MM-DD`. Instant dùng ISO UTC; giây là đơn vị chuẩn.

Tạo phiên (client phải giữ nguyên payload/key cho tới ACK):

```json
{"publicId":"7f76fafc-9878-4fd7-93f2-9fc443a612e1","deviceId":"754eb9bd-dc17-4459-9697-c0680541e00b","taskId":null,"subjectId":null,"targetSeconds":1500}
```

`taskId` là **UUID `TaskResponse.publicId`**, không phải `TaskResponse.id` dạng số. Nếu có task thì server suy ra môn; subjectId khác môn task bị từ chối. targetSeconds 60–14400. Server không nhận thời gian bắt đầu/thời lượng thực do client tự khai cho phiên TRACKED.

Chuyển trạng thái:

```json
{"action":"PAUSE","baseVersion":0}
```

Action: PAUSE, RESUME, COMPLETE, STOP, DISCARD. Response session gồm `publicId,deviceId,taskPublicId,taskId,taskTitle,subjectId,subjectName,status,targetSeconds,focusSeconds,remainingSeconds,deadline,startedAt,endedAt,version,provenance,serverNow`. `taskId` response là ID số cũ; `taskPublicId` là UUID. `deadline` chỉ có ở RUNNING. Web tính đếm ngược từ deadline/serverNow và thời gian monotonic kể từ nhận snapshot, không tin đồng hồ ngày giờ của client. Receipt replay có thể trả `serverNow` cũ: sau ACK phải tải overview mới để điều khiển phiên tiếp.

Lưu preferences:

```json
{"school":"Trường đại học","major":"Công nghệ thông tin","timezone":"Asia/Ho_Chi_Minh","weeklyGoalSeconds":21600,"reminderEnabled":true,"reminderTime":"19:00","version":0}
```

school/major tối đa 160 ký tự; mục tiêu 1800–604800 giây. Timezone IANA hợp lệ; P1 chỉ đổi khi chưa có task/lịch sử. Nhắc học là giờ địa phương HH:mm. Preferences response thêm `legacyImportedAt`. 409 giữ bản nháp, tải bản server để đối chiếu; không tự thay version rồi gửi lại ghi đè.

Metrics: `metricsVersion, timezone, asOf, syncRevision, streak, totalFocusSeconds, weekFocusSeconds, previousWeekFocusSeconds, legacyFocusSeconds, progress, today, days, period`.

- `progress/today`: `{totalTasks,completedTasks,progressPercent}`; progressPercent = null khi total=0. progress toàn tài khoản chỉ gồm task chưa xóa. today gồm task có hạn hôm nay, task chưa có hạn chưa xong và task không có hạn hoàn thành hôm nay.
- `days`: `{date,focusSeconds,completedTasks,qualifies}` từ lịch sử thực, không tạo chấm cho ngày chưa hoạt động. Khoảng TRACKED đã xác nhận được hợp nhất để tránh cộng chồng thời gian, chia theo nửa đêm tài khoản. LEGACY_DURATION cộng vào ngày hoàn tất và được báo riêng tổng thời lượng cũ.
- `period`: `{from,to,subjectId,focusSeconds,weekFocusSeconds,previousWeekFocusSeconds,progress,taskStatus,subjects,days}`. Task trong kỳ chọn theo ngày tạo canonical; completion heatmap chọn theo ngày event nên task được tạo ngoài kỳ vẫn có thể tạo hoạt động trong kỳ. Số giờ tuần trong period áp dụng môn đã chọn, không bị cắt bởi khoảng ngày custom. Các trường streak/tổng bên ngoài period luôn toàn tài khoản.
- `syncRevision` là revision snapshot study tăng khi có ghi liên quan. Chưa phải sync cursor có change log/tombstone của P2, không dùng để suy ra danh sách thay đổi.

Legacy import:

```json
{"deviceId":"754eb9bd-dc17-4459-9697-c0680541e00b","sessions":[{"publicId":"ed494b7e-43cf-4415-b1e8-10f5d7ba2078","subjectId":null,"completedAt":"2026-11-03T02:00:00Z","durationSeconds":1500}],"preferences":null}
```

durationSeconds 1–14400, completedAt không tương lai. preferences tùy chọn cùng cấu trúc SavePreferences; chỉ được nhập khi chưa có import và chưa có explicit save, không thay timezone tài khoản. Subject không còn thuộc account được bỏ gắn môn, không liên kết nhầm chủ sở hữu. Response `{acknowledged:[UUID],preferencesImported:boolean,syncRevision:number}`. Cùng publicId + cùng nội dung không tạo thêm giờ, nội dung khác 409 và rollback cả batch. Chỉ đánh dấu những ID đã ACK, giữ nguyên dữ liệu cũ để đối soát. Số liệu legacy là lịch sử do người dùng nhập, không được dùng như bằng chứng chống gian lận/xếp hạng.
