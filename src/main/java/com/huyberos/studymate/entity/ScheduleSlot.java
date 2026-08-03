package com.huyberos.studymate.entity;

import com.huyberos.studymate.entity.enums.DayOfWeek;
import com.huyberos.studymate.entity.enums.ShiftType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "schedule_slot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "schedule_slot_seq")
    @SequenceGenerator(name = "schedule_slot_seq", sequenceName = "schedule_slot_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, columnDefinition = "day_of_week")
    private DayOfWeek dayOfWeek;

    @Column(name = "date")
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "shift", nullable = false, columnDefinition = "shift_type")
    private ShiftType shift;

    @Column(name = "periods", length = 50)
    private String periods;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "is_online", nullable = false)
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "is_recurring", nullable = false)
    @Builder.Default
    private Boolean isRecurring = false;

    @Column(name = "teacher_name", length = 255)
    private String teacherName;

    @Column(name = "teacher_phone", length = 20)
    private String teacherPhone;

    @Column(name = "department", length = 255)
    private String department;

    @Column(name = "room", length = 100)
    private String room;

    // ── Relations ──────────────────────────────────────────
    @OneToMany(mappedBy = "scheduleSlot", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Note> notes = new ArrayList<>();

    @OneToMany(mappedBy = "scheduleSlot", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Document> documents = new ArrayList<>();
}
