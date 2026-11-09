param([string]$Username = 'demo_studymate')
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8080/api'
$headers = @{}
$password = 'StudyDemo7!' + [guid]::NewGuid().ToString('N').Substring(0, 10)

function Call-Api($method, $path, $payload = $null, $extraHeaders = @{}) {
    $arguments = @{ Method = $method; Uri = "$base$path"; Headers = $headers + $extraHeaders; TimeoutSec = 15 }
    if ($null -ne $payload) {
        $arguments.ContentType = 'application/json; charset=utf-8'
        $arguments.Body = [Text.Encoding]::UTF8.GetBytes(($payload | ConvertTo-Json -Depth 12 -Compress))
    }
    $response = Invoke-RestMethod @arguments
    if (!$response.success) { throw "Demo API failed ($method $path)" }
    return $response.data
}

# Register a fresh account. An existing username stops the script before any demo writes.
$account = Call-Api POST /auth/register @{ username = $Username; password = $password }
$headers.Authorization = 'Bearer ' + $account.accessToken
Write-Output "Demo account: $Username"
Write-Output "Demo password: $password"
$null = Call-Api PUT /auth/profile @{ fullName = 'Sinh viên Demo' }
$prefs = Call-Api GET /study/preferences
$null = Call-Api PUT /study/preferences @{
    school = 'Trường đại học Demo'; major = 'Công nghệ thông tin'; timezone = 'Asia/Ho_Chi_Minh'
    weeklyGoalSeconds = 28800; reminderEnabled = $true; reminderTime = '19:30'; version = $prefs.version
}

$quality = Call-Api POST /subjects @{ name = 'Đảm bảo chất lượng phần mềm'; classCode = '20261IT6085003'; type = 'SCHOOL'; color = '#2563EB' }
$data = Call-Api POST /subjects @{ name = 'Phân tích dữ liệu lớn'; classCode = '20261IT6077003'; type = 'SCHOOL'; color = '#0F766E' }
$english = Call-Api POST /subjects @{ name = 'Tiếng Anh Công nghệ thông tin 2'; classCode = '20261FL6344002'; type = 'LANGUAGE'; color = '#7C3AED' }
$project = Call-Api POST /subjects @{ name = 'Đồ án cá nhân (demo)'; type = 'SELF_STUDY'; color = '#B45309' }

function Add-Slot($subject, $date, $shift, $periods, $room, $teacher, $online = $false, $start = $null, $end = $null, $recurring = $false) {
    $dayNames = @('CHU_NHAT','THU_2','THU_3','THU_4','THU_5','THU_6','THU_7')
    return Call-Api POST /schedule/manual @{
        subjectId = $subject.id; dayOfWeek = $dayNames[[int]$date.DayOfWeek]
        date = if (!$recurring) { $date.ToString('yyyy-MM-dd') }; shift = $shift
        periods = $periods; room = $room; teacherName = $teacher; isOnline = $online
        startTime = $start; endTime = $end; isRecurring = $recurring
    }
}

# The screenshot has period numbers and locations but no clock times.
$null = Add-Slot $quality ([datetime]'2026-10-26') CHIEU '7,8,9' '321 - A7 - Cơ sở 1 - Khu A' 'Nguyễn Đức Lưu'
$null = Add-Slot $english ([datetime]'2026-10-26') TOI '13,14' 'Khu A_PH Online 34 - Khu A_Online - Cơ sở 1 - Khu A' 'Phạm Mai Khánh' $true
$null = Add-Slot $data ([datetime]'2026-10-27') CHIEU '7,8,9' '307 - A9 - Cơ sở 1 - Khu A' 'Đỗ Mạnh Quang'
$null = Add-Slot $english ([datetime]'2026-10-29') TOI '13,14' 'Khu A_PH Online 25 - Khu A_Online - Cơ sở 1 - Khu A' 'Phạm Mai Khánh' $true

$today = [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([datetimeoffset]::UtcNow, 'SE Asia Standard Time').Date
$demoSlot = Add-Slot $quality $today TOI '13,14' '321 - A7 - Cơ sở 1 - Khu A' 'Giảng viên demo' $false '19:00:00' '20:30:00'
$null = Add-Slot $data ($today.AddDays(1)) SANG '1,2' '307 - A9 - Cơ sở 1 - Khu A' 'Giảng viên demo' $false '09:00:00' '10:30:00'
$null = Add-Slot $english ($today.AddDays(1)) TOI '13,14' 'Phòng trực tuyến demo' 'Giảng viên demo' $true '19:30:00' '20:45:00'
$sunday = [datetime]'2026-11-01'
$null = Add-Slot $project $sunday SANG $null $null 'Nhóm demo' $false '10:00:00' '11:00:00' $true

$taskSpecs = @(
    @{ subject = $quality; title = 'Nộp bảng ca kiểm thử'; day = 0; hour = 23; status = 'TODO'; priority = 'HIGH' }
    @{ subject = $english; title = 'Ôn từ vựng kiểm thử phần mềm'; day = 0; hour = 18; status = 'DOING'; priority = 'MEDIUM' }
    @{ subject = $data; title = 'Chuẩn bị dữ liệu cho bài thực hành'; day = 1; hour = 8; status = 'TODO'; priority = 'HIGH' }
    @{ subject = $project; title = 'Vẽ sơ đồ chức năng'; day = 2; hour = 20; status = 'DOING'; priority = 'MEDIUM' }
    @{ subject = $quality; title = 'Bổ sung kết quả kiểm thử hồi quy'; day = -2; hour = 17; status = 'TODO'; priority = 'HIGH' }
    @{ subject = $data; title = 'Hoàn thành làm sạch dữ liệu mẫu'; day = -1; hour = 19; status = 'DONE'; priority = 'LOW' }
    @{ subject = $english; title = 'Hoàn thành bài đọc Unit 1'; day = 0; hour = 15; status = 'DONE'; priority = 'LOW' }
)
$taskList = foreach ($spec in $taskSpecs) {
    Call-Api POST /tasks @{
        subjectId = $spec.subject.id; title = $spec.title; status = $spec.status; priority = $spec.priority
        dueAt = $today.AddDays($spec.day).AddHours($spec.hour).ToString('yyyy-MM-ddTHH:mm:ss')
        description = 'Nhiệm vụ mẫu để kiểm thử StudyMate.'
    }
}
$null = Call-Api POST /tasks @{ subjectId = $project.id; title = 'Ghi lại ý tưởng cho buổi họp nhóm'; status = 'TODO'; priority = 'LOW' }

$note = Call-Api POST /notes @{
    subjectId = $quality.id; scheduleSlotId = $demoSlot.id; title = 'Ghi chú demo: kiểm thử hồi quy'
    content = 'Kiểm thử hồi quy giúp phát hiện chức năng cũ bị lỗi sau khi thay đổi mã nguồn.'
    importanceLevel = 'NORMAL'
}
$null = Call-Api POST /notes @{ subjectId = $data.id; title = 'Ghi chú demo: làm sạch dữ liệu'; content = 'Kiểm tra giá trị thiếu, bản ghi trùng và kiểu dữ liệu trước khi phân tích.' }
$null = Call-Api POST /memos @{ taskId = $taskList[0].id; subjectId = $quality.id; date = $today.ToString('yyyy-MM-dd'); content = 'Demo: rà lại kết quả mong đợi trước khi nộp.' }
$source = @{ sourceType = 'NOTE'; sourceId = $note.id }
$null = Call-Api POST /ai-outputs/summary/save ($source + @{
    title = 'Tóm tắt demo'; summary = 'Chạy lại các ca liên quan để phát hiện lỗi phát sinh sau thay đổi.'
})
$null = Call-Api POST /ai-outputs/mindmap/save ($source + @{
    title = 'Sơ đồ demo'; structure = @{ title = 'Kiểm thử hồi quy'; nodes = @(@{ title = 'Mục tiêu'; children = @('Bảo vệ chức năng hiện có') }) }
})
$quiz = Call-Api POST /ai-outputs/quiz/save ($source + @{
    title = 'Trắc nghiệm demo'; questions = @(@{
        questionText = 'Kiểm thử hồi quy nhằm phát hiện điều gì?'
        optionA = 'Lỗi ở chức năng đã có'; optionB = 'Màu giao diện'; optionC = 'Dung lượng RAM'; optionD = 'Ngày phát hành'
        correctOption = 'A'; explanation = 'Thay đổi mới có thể gây lỗi ở chức năng cũ.'
    })
})
$answers = @{ ([string]$quiz.questions[0].id) = 'A' }
$null = Call-Api POST "/quizzes/$($quiz.id)/attempt" @{ answers = $answers }

$historySubjects = @($quality, $data, $english, $quality, $project, $data)
$history = for ($i = 0; $i -lt $historySubjects.Count; $i++) {
    @{ publicId = [guid]::NewGuid(); subjectId = $historySubjects[$i].id; durationSeconds = 1500 + $i * 300
       completedAt = [datetime]::UtcNow.AddDays(-$i).AddHours(-3).ToString('o') }
}
$null = Call-Api POST /study/import/legacy @{ deviceId = [guid]::NewGuid(); sessions = @($history) } @{ 'Idempotency-Key' = [string][guid]::NewGuid() }
$overview = Call-Api GET /study/overview
$subjects = @(Call-Api GET /subjects)
$schedule = @(Call-Api GET /schedule)
$tasks = @(Call-Api GET /tasks)
$null = Call-Api POST /auth/logout @{ refreshToken = $account.refreshToken }
Write-Output "Seeded $($subjects.Count) subjects, $($schedule.Count) schedule slots and $($tasks.Count) tasks."
Write-Output "Study history: $($overview.metrics.totalFocusSeconds) seconds. No files uploaded."
