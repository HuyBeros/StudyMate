package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.request.ScheduleSlotRequest;
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
}
