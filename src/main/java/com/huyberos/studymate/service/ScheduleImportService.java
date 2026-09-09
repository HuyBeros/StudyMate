package com.huyberos.studymate.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.ai.AiRouter;
import com.huyberos.studymate.dto.request.ConflictCheckRequest;
import com.huyberos.studymate.dto.request.ImportConfirmRequest;
import com.huyberos.studymate.dto.response.ConflictCheckResponse;
import com.huyberos.studymate.dto.response.ScheduleImportPreviewResponse;
import com.huyberos.studymate.entity.ScheduleSlot;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.entity.enums.ShiftType;
import com.huyberos.studymate.entity.enums.SubjectType;
import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.repository.ScheduleSlotRepository;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduleImportService {

    private final AiRouter aiRouter;
    private final ScheduleSlotRepository scheduleSlotRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final SecurityUtil securityUtil;
    private final ObjectMapper objectMapper;

    private static final List<String> PRESET_COLORS = List.of(
            "#2563EB", "#0284C7", "#D97706", "#16A34A", "#9333EA", "#DC2626", "#0D9488"
    );

    @Transactional
    public List<ScheduleImportPreviewResponse> previewScheduleImage(MultipartFile file) {
        Long userId = securityUtil.getCurrentUserId();

        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        String prompt = """
                Hãy phân tích hình ảnh thời khóa biểu (TKB) này và trích xuất tất cả các tiết học thành định dạng JSON.
                Cấu trúc JSON đầu ra bắt buộc là một danh sách các đối tượng với các trường sau:
                [
                  {
                    "subjectName": "Tên môn học (Ví dụ: Giải tích 1, Vật lý đại cương)",
                    "classCode": "Mã lớp/môn học (Ví dụ: INT1332, MATH101)",
                    "dayOfWeek": "Thứ trong tuần, chọn một trong các giá trị: THU_2, THU_3, THU_4, THU_5, THU_6, THU_7, CHU_NHAT",
                    "shift": "Ca học, chọn một trong: MORNING (nếu bắt đầu trước 12:00), AFTERNOON (nếu bắt đầu từ 12:00 đến 18:00), EVENING (sau 18:00)",
                    "periods": "Các tiết học (Ví dụ: 1-3, 4-6, hoặc rỗng)",
                    "startTime": "Giờ bắt đầu dạng HH:mm:ss (Ví dụ: 08:00:00, 14:00:00)",
                    "endTime": "Giờ kết thúc dạng HH:mm:ss (Ví dụ: 10:30:00, 16:30:00)",
                    "room": "Phòng học (Ví dụ: A2-301, B1-102)",
                    "teacherName": "Tên giảng viên (nếu có)"
                  }
                ]
                Chú ý:
                1. Trả về JSON hợp lệ. Không bọc trong dấu markdown ```json.
                2. Phân tích thật kỹ để không bỏ sót bất kỳ tiết học nào trên ảnh.
                """;

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new BadRequestException("Không thể đọc dữ liệu file tải lên");
        }

        String rawJson;
        try {
            log.info("Attempting to parse schedule image using AI Router...");
            rawJson = aiRouter.generateContentWithImage(prompt, file.getContentType(), bytes, true);
        } catch (Exception e) {
            log.error("All AI engines failed to parse schedule image", e);
            throw new BadRequestException("AI không thể nhận diện ảnh thời khóa biểu: " + e.getMessage());
        }

        try {
            // Xử lý loại bỏ markdown code block nếu vẫn trả về
            if (rawJson.startsWith("```json")) {
                rawJson = rawJson.substring(7);
            }
            if (rawJson.endsWith("```")) {
                rawJson = rawJson.substring(0, rawJson.length() - 3);
            }
            rawJson = rawJson.trim();

            List<Map<String, Object>> parsedSlots = objectMapper.readValue(rawJson, new TypeReference<>() {});
            List<ScheduleImportPreviewResponse> previews = new ArrayList<>();

            // Fetch existing subjects and slots for mapping & conflict checking
            List<Subject> userSubjects = subjectRepository.findByUserIdOrderByCreatedAtDesc(userId);
            List<ScheduleSlot> existingSlots = scheduleSlotRepository.findAllByUserId(userId);

            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm[:ss]");

            for (Map<String, Object> map : parsedSlots) {
                String subjectName = (String) map.get("subjectName");
                String classCode = (String) map.get("classCode");
                String dayOfWeekStr = (String) map.get("dayOfWeek");
                String shiftStr = (String) map.get("shift");
                String periods = (String) map.get("periods");
                String startTimeStr = (String) map.get("startTime");
                String endTimeStr = (String) map.get("endTime");
                String room = (String) map.get("room");
                String teacherName = (String) map.get("teacherName");

                DayOfWeek dayOfWeek = null;
                try {
                    if (dayOfWeekStr != null) {
                        // Map "CHUNHAT" to "CHU_NHAT" if returned by AI
                        if (dayOfWeekStr.equalsIgnoreCase("CHUNHAT")) {
                            dayOfWeek = DayOfWeek.CHU_NHAT;
                        } else {
                            dayOfWeek = DayOfWeek.valueOf(dayOfWeekStr);
                        }
                    }
                } catch (Exception ignored) {}

                ShiftType shift = ShiftType.SANG;
                if (shiftStr != null) {
                    if (shiftStr.equalsIgnoreCase("MORNING") || shiftStr.equalsIgnoreCase("SANG")) {
                        shift = ShiftType.SANG;
                    } else if (shiftStr.equalsIgnoreCase("AFTERNOON") || shiftStr.equalsIgnoreCase("CHIEU")) {
                        shift = ShiftType.CHIEU;
                    } else if (shiftStr.equalsIgnoreCase("EVENING") || shiftStr.equalsIgnoreCase("TOI")) {
                        shift = ShiftType.TOI;
                    } else {
                        try {
                            shift = ShiftType.valueOf(shiftStr.toUpperCase());
                        } catch (Exception ignored) {}
                    }
                }

                LocalTime startTime = null;
                if (startTimeStr != null) {
                    try {
                        startTime = LocalTime.parse(startTimeStr, timeFormatter);
                    } catch (Exception ignored) {}
                }

                LocalTime endTime = null;
                if (endTimeStr != null) {
                    try {
                        endTime = LocalTime.parse(endTimeStr, timeFormatter);
                    } catch (Exception ignored) {}
                }

                // Match subject
                Long matchedSubjectId = null;
                if (subjectName != null) {
                    String finalSubjectName = subjectName;
                    String finalClassCode = classCode;
                    matchedSubjectId = userSubjects.stream()
                            .filter(s -> s.getName().equalsIgnoreCase(finalSubjectName) ||
                                    (finalClassCode != null && s.getClassCode() != null && s.getClassCode().equalsIgnoreCase(finalClassCode)))
                            .map(Subject::getId)
                            .findFirst()
                            .orElse(null);
                }

                // Check conflict
                boolean hasConflict = false;
                String conflictMessage = null;

                if (dayOfWeek != null && startTime != null && endTime != null) {
                    for (ScheduleSlot existing : existingSlots) {
                        if (existing.getIsRecurring() && existing.getDayOfWeek() == dayOfWeek) {
                            if (startTime.isBefore(existing.getEndTime()) && endTime.isAfter(existing.getStartTime())) {
                                hasConflict = true;
                                conflictMessage = "Trùng giờ với lịch học môn: " + existing.getSubject().getName() +
                                        " (" + existing.getStartTime() + " - " + existing.getEndTime() + ")";
                                break;
                            }
                        }
                    }
                }

                previews.add(ScheduleImportPreviewResponse.builder()
                        .subjectName(subjectName)
                        .classCode(classCode)
                        .dayOfWeek(dayOfWeek)
                        .shift(shift)
                        .periods(periods)
                        .startTime(startTime)
                        .endTime(endTime)
                        .room(room)
                        .teacherName(teacherName)
                        .matchedSubjectId(matchedSubjectId)
                        .hasConflict(hasConflict)
                        .conflictMessage(conflictMessage)
                        .build());
            }

            return previews;

        } catch (Exception e) {
            log.error("Failed to parse schedule image using Gemini AI", e);
            throw new BadRequestException("Không thể nhận diện hình ảnh thời khóa biểu: " + e.getMessage());
        }
    }

    @Transactional
    public void confirmImport(ImportConfirmRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (request.getSlots() == null || request.getSlots().isEmpty()) {
            return;
        }

        List<Subject> userSubjects = subjectRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Random random = new Random();

        for (ImportConfirmRequest.ImportedSlotDto dto : request.getSlots()) {
            if (dto.getSubjectName() == null || dto.getSubjectName().isBlank()) {
                continue;
            }

            // Find or create subject
            Subject subject = null;
            if (dto.getMatchedSubjectId() != null) {
                subject = subjectRepository.findByIdAndUserId(dto.getMatchedSubjectId(), userId).orElse(null);
            }

            if (subject == null) {
                // Check if existing name matches in user subjects
                subject = userSubjects.stream()
                        .filter(s -> s.getName().equalsIgnoreCase(dto.getSubjectName()))
                        .findFirst()
                        .orElse(null);
            }

            if (subject == null) {
                // Create new subject
                String color = PRESET_COLORS.get(random.nextInt(PRESET_COLORS.size()));
                subject = Subject.builder()
                        .user(user)
                        .name(dto.getSubjectName())
                        .classCode(dto.getClassCode())
                        .color(color)
                        .type(SubjectType.SCHOOL)
                        .build();
                subject = subjectRepository.save(subject);
                userSubjects.add(subject); // Add to local list to avoid duplicates
            }

            // Save ScheduleSlot
            ScheduleSlot slot = ScheduleSlot.builder()
                    .subject(subject)
                    .dayOfWeek(dto.getDayOfWeek())
                    .date(dto.getDate())
                    .shift(dto.getShift() != null ? dto.getShift() : ShiftType.SANG)
                    .periods(dto.getPeriods())
                    .startTime(dto.getStartTime())
                    .endTime(dto.getEndTime())
                    .isOnline(dto.getIsOnline() != null ? dto.getIsOnline() : false)
                    .isRecurring(dto.getIsRecurring() != null ? dto.getIsRecurring() : true)
                    .teacherName(dto.getTeacherName())
                    .room(dto.getRoom())
                    .build();

            scheduleSlotRepository.save(slot);
        }
    }

    @Transactional(readOnly = true)
    public ConflictCheckResponse checkConflict(ConflictCheckRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        List<ScheduleSlot> existingSlots = scheduleSlotRepository.findAllByUserId(userId);

        DayOfWeek day = request.getDayOfWeek();
        if (day == null && request.getDate() != null) {
            day = ScheduleSlotService.mapJavaDayOfWeekToEnum(request.getDate().getDayOfWeek());
        }
        LocalTime start = request.getStartTime();
        LocalTime end = request.getEndTime();

        if (day == null || start == null || end == null) {
            return ConflictCheckResponse.builder()
                    .hasConflict(false)
                    .conflictType("NONE")
                    .message("Dữ liệu vào không đầy đủ để kiểm tra")
                    .build();
        }

        for (ScheduleSlot existing : existingSlots) {
            // Skip checking the same slot when updating
            if (request.getId() != null && existing.getId().equals(request.getId())) {
                continue;
            }

            if (existing.getIsRecurring() && existing.getDayOfWeek() == day) {
                // Overlap check
                if (start.isBefore(existing.getEndTime()) && end.isAfter(existing.getStartTime())) {
                    return ConflictCheckResponse.builder()
                            .hasConflict(true)
                            .conflictType("HARD_CONFLICT")
                            .message("Xung đột thời gian với lịch học môn: " + existing.getSubject().getName() +
                                    " (" + existing.getStartTime() + " - " + existing.getEndTime() + ")")
                            .build();
                }

                // Soft warning check (less than 15 mins gap)
                long startDiff = Math.abs(java.time.Duration.between(end, existing.getStartTime()).toMinutes());
                long endDiff = Math.abs(java.time.Duration.between(start, existing.getEndTime()).toMinutes());
                if (startDiff < 15 || endDiff < 15) {
                    return ConflictCheckResponse.builder()
                            .hasConflict(true)
                            .conflictType("SOFT_WARNING")
                            .message("Lịch học rất sát với tiết học môn: " + existing.getSubject().getName() +
                                    " (cách khoảng " + Math.min(startDiff, endDiff) + " phút)")
                            .build();
                }
            }
        }

        return ConflictCheckResponse.builder()
                .hasConflict(false)
                .conflictType("NONE")
                .message("Không phát hiện xung đột lịch trình")
                .build();
    }
}
