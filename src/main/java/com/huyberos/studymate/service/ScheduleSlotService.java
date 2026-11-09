package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.request.ConflictCheckRequest;
import com.huyberos.studymate.dto.request.ScheduleSlotRequest;
import com.huyberos.studymate.dto.response.ConflictCheckResponse;
import com.huyberos.studymate.dto.response.ScheduleSlotResponse;
import com.huyberos.studymate.entity.ScheduleSlot;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.ScheduleSlotRepository;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleSlotService {

    private final ScheduleSlotRepository scheduleSlotRepository;
    private final SubjectRepository subjectRepository;
    private final SecurityUtil securityUtil;

    @Transactional(readOnly = true)
    public List<ScheduleSlotResponse> getAllSlots() {
        Long userId = securityUtil.getCurrentUserId();
        return scheduleSlotRepository.findAllByUserId(userId).stream()
                .map(ScheduleSlotResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduleSlotResponse> getSlotsBySubject(Long subjectId) {
        Long userId = securityUtil.getCurrentUserId();
        // Verify subject belongs to user
        subjectRepository.findByIdAndUserId(subjectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));

        return scheduleSlotRepository.findBySubjectId(subjectId).stream()
                .map(ScheduleSlotResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduleSlotResponse> getSlotsByDayOfWeek(DayOfWeek day) {
        Long userId = securityUtil.getCurrentUserId();
        return scheduleSlotRepository.findByUserIdAndDayOfWeek(userId, day).stream()
                .map(ScheduleSlotResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ScheduleSlotResponse> getTodaySlots() {
        Long userId = securityUtil.getCurrentUserId();
        LocalDate today = LocalDate.now();
        DayOfWeek dayOfWeek = mapJavaDayOfWeekToEnum(today.getDayOfWeek());

        return scheduleSlotRepository.findTodaySlots(userId, dayOfWeek, today).stream()
                .map(ScheduleSlotResponse::fromEntity)
                .toList();
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

    @Transactional
    public ScheduleSlotResponse createSlot(ScheduleSlotRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + request.getSubjectId()));

        ScheduleSlot slot = ScheduleSlot.builder()
                .subject(subject)
                .dayOfWeek(request.getDayOfWeek())
                .date(request.getDate())
                .shift(request.getShift())
                .periods(request.getPeriods())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isOnline(request.getIsOnline() != null ? request.getIsOnline() : false)
                .isRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : true)
                .teacherName(request.getTeacherName())
                .teacherPhone(request.getTeacherPhone())
                .department(request.getDepartment())
                .room(request.getRoom())
                .build();

        ScheduleSlot saved = scheduleSlotRepository.save(slot);
        return ScheduleSlotResponse.fromEntity(saved);
    }

    @Transactional
    public ScheduleSlotResponse updateSlot(Long id, ScheduleSlotRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        ScheduleSlot slot = scheduleSlotRepository.findById(id)
                .filter(s -> s.getSubject().getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Schedule slot not found: " + id));

        if (!slot.getSubject().getId().equals(request.getSubjectId())) {
            Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + request.getSubjectId()));
            slot.setSubject(subject);
        }

        slot.setDayOfWeek(request.getDayOfWeek());
        slot.setDate(request.getDate());
        slot.setShift(request.getShift());
        slot.setPeriods(request.getPeriods());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setIsOnline(request.getIsOnline() != null ? request.getIsOnline() : false);
        slot.setIsRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : true);
        slot.setTeacherName(request.getTeacherName());
        slot.setTeacherPhone(request.getTeacherPhone());
        slot.setDepartment(request.getDepartment());
        slot.setRoom(request.getRoom());

        ScheduleSlot updated = scheduleSlotRepository.save(slot);
        return ScheduleSlotResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteSlot(Long id) {
        Long userId = securityUtil.getCurrentUserId();
        ScheduleSlot slot = scheduleSlotRepository.findById(id)
                .filter(s -> s.getSubject().getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Schedule slot not found: " + id));

        scheduleSlotRepository.delete(slot);
    }

    // Helper map java.time.DayOfWeek sang custom DayOfWeek enum
    public static DayOfWeek mapJavaDayOfWeekToEnum(java.time.DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> DayOfWeek.THU_2;
            case TUESDAY -> DayOfWeek.THU_3;
            case WEDNESDAY -> DayOfWeek.THU_4;
            case THURSDAY -> DayOfWeek.THU_5;
            case FRIDAY -> DayOfWeek.THU_6;
            case SATURDAY -> DayOfWeek.THU_7;
            case SUNDAY -> DayOfWeek.CHU_NHAT;
        };
    }

    /**
     * Xuất toàn bộ thời khóa biểu của người dùng sang file định dạng chuẩn RFC 5545 iCalendar (.ics)
     * Tương thích với Google Calendar, Apple Calendar, Microsoft Outlook.
     */
    @Transactional(readOnly = true)
    public String exportCalendarIcs() {
        Long userId = securityUtil.getCurrentUserId();
        List<ScheduleSlot> slots = scheduleSlotRepository.findAllByUserId(userId);

        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//StudyMate//Study Schedule//VI\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:PUBLISH\r\n");
        sb.append("X-WR-CALNAME:StudyMate - Thời khóa biểu\r\n");
        sb.append("X-WR-TIMEZONE:Asia/Ho_Chi_Minh\r\n");

        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        java.time.format.DateTimeFormatter dateFormatter = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd");
        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("HHmmss");

        for (ScheduleSlot slot : slots) {
            String subjectName = slot.getSubject() != null ? slot.getSubject().getName() : "Môn học";
            int dayOffset = switch (slot.getDayOfWeek()) {
                case THU_2 -> 0;
                case THU_3 -> 1;
                case THU_4 -> 2;
                case THU_5 -> 3;
                case THU_6 -> 4;
                case THU_7 -> 5;
                case CHU_NHAT -> 6;
            };

            LocalDate eventDate = slot.getDate() != null ? slot.getDate() : monday.plusDays(dayOffset);
            java.time.LocalTime start = slot.getStartTime() != null ? slot.getStartTime() : java.time.LocalTime.of(8, 0);
            java.time.LocalTime end = slot.getEndTime() != null ? slot.getEndTime() : start.plusMinutes(90);

            String dtStart = eventDate.format(dateFormatter) + "T" + start.format(timeFormatter);
            String dtEnd = eventDate.format(dateFormatter) + "T" + end.format(timeFormatter);

            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:studymate-slot-").append(slot.getId()).append("@studymate.local\r\n");
            sb.append("DTSTAMP:").append(today.format(dateFormatter)).append("T000000Z\r\n");
            sb.append("DTSTART;TZID=Asia/Ho_Chi_Minh:").append(dtStart).append("\r\n");
            sb.append("DTEND;TZID=Asia/Ho_Chi_Minh:").append(dtEnd).append("\r\n");

            if (Boolean.TRUE.equals(slot.getIsRecurring())) {
                String byDay = switch (slot.getDayOfWeek()) {
                    case THU_2 -> "MO";
                    case THU_3 -> "TU";
                    case THU_4 -> "WE";
                    case THU_5 -> "TH";
                    case THU_6 -> "FR";
                    case THU_7 -> "SA";
                    case CHU_NHAT -> "SU";
                };
                sb.append("RRULE:FREQ=WEEKLY;BYDAY=").append(byDay).append("\r\n");
            }

            sb.append("SUMMARY:").append(subjectName.replace(",", "\\,")).append("\r\n");
            if (slot.getRoom() != null && !slot.getRoom().isBlank()) {
                sb.append("LOCATION:").append(slot.getRoom().replace(",", "\\,")).append("\r\n");
            }
            StringBuilder desc = new StringBuilder();
            if (slot.getTeacherName() != null && !slot.getTeacherName().isBlank()) {
                desc.append("Giảng viên: ").append(slot.getTeacherName()).append("\\n");
            }
            if (slot.getDepartment() != null && !slot.getDepartment().isBlank()) {
                desc.append("Khoa/Bộ môn: ").append(slot.getDepartment()).append("\\n");
            }
            if (!desc.isEmpty()) {
                sb.append("DESCRIPTION:").append(desc).append("\r\n");
            }
            sb.append("STATUS:CONFIRMED\r\n");
            sb.append("END:VEVENT\r\n");
        }

        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }
}
