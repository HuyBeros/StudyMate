package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.request.TaskRequest;
import com.huyberos.studymate.dto.response.TaskResponse;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.Task;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.TaskStatus;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.repository.TaskRepository;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final SecurityUtil securityUtil;
    private final com.huyberos.studymate.study.StudyTaskEvents studyEvents;
    private final java.time.Clock clock;

    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasks(TaskStatus status, Long subjectId) {
        Long userId = securityUtil.getCurrentUserId();
        List<Task> tasks;

        if (subjectId != null) {
            subjectRepository.findByIdAndUserId(subjectId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));
        }

        if (subjectId != null && status != null) {
            tasks = taskRepository.findBySubjectIdAndStatus(subjectId, status);
        } else if (subjectId != null) {
            tasks = taskRepository.findBySubjectId(subjectId);
        } else if (status != null) {
            tasks = taskRepository.findByUserIdAndStatus(userId, status);
        } else {
            tasks = taskRepository.findAllByUserId(userId);
        }

        return tasks.stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        Long userId = securityUtil.getCurrentUserId();
        Task task = taskRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(userId) && !t.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        return TaskResponse.fromEntity(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTodayPendingTasks() {
        Long userId = securityUtil.getCurrentUserId();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);

        return taskRepository.findTodayPendingTasks(userId, startOfDay, endOfDay).stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        User user = studyEvents.lockAccount();
        Long userId = user.getId();

        Subject subject = null;
        if (request.getSubjectId() != null) {
            subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + request.getSubjectId()));
        }

        Task task = Task.builder()
                .createdAtInstant(clock.instant())
                .user(user)
                .subject(subject)
                .title(request.getTitle())
                .description(request.getDescription())
                .dueAt(request.getDueAt())
                .priority(request.getPriority() != null ? request.getPriority() : com.huyberos.studymate.entity.enums.TaskPriority.MEDIUM)
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .build();
                
        if (task.getStatus() == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        }

        Task saved = taskRepository.save(task);
        studyEvents.record(saved, null);
        return TaskResponse.fromEntity(saved);
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request) {
        User currentUser = studyEvents.lockAccount();
        Long userId = currentUser.getId();
        Task task = taskRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(userId) && !t.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        TaskStatus previousStatus = task.getStatus();

        if (request.getSubjectId() != null) {
            if (task.getSubject() == null || !task.getSubject().getId().equals(request.getSubjectId())) {
                Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + request.getSubjectId()));
                task.setSubject(subject);
            }
        } else {
            task.setSubject(null);
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDueAt(request.getDueAt());
        
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        
        if (request.getStatus() != null) {
            if (task.getStatus() != TaskStatus.DONE && request.getStatus() == TaskStatus.DONE) {
                task.setCompletedAt(LocalDateTime.now());
            } else if (request.getStatus() != TaskStatus.DONE) {
                task.setCompletedAt(null);
            }
            task.setStatus(request.getStatus());
        }

        Task updated = taskRepository.save(task);
        studyEvents.record(updated, previousStatus);
        return TaskResponse.fromEntity(updated);
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, TaskStatus status) {
        User currentUser = studyEvents.lockAccount();
        Long userId = currentUser.getId();
        Task task = taskRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(userId) && !t.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        TaskStatus previousStatus = task.getStatus();

        if (task.getStatus() != TaskStatus.DONE && status == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (status != TaskStatus.DONE) {
            task.setCompletedAt(null);
        }
        task.setStatus(status);
        Task updated = taskRepository.save(task);
        studyEvents.record(updated, previousStatus);
        return TaskResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteTask(Long id) {
        User currentUser = studyEvents.lockAccount();
        Long userId = currentUser.getId();
        Task task = taskRepository.findById(id)
                .filter(t -> t.getUser().getId().equals(userId) && !t.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setDeleted(true);
        taskRepository.save(task);
        studyEvents.deleted(currentUser);
    }
}
