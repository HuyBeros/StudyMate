package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.request.TaskRequest;
import com.huyberos.studymate.dto.response.TaskResponse;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.Task;
import com.huyberos.studymate.entity.enums.TaskStatus;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.repository.TaskRepository;
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
    private final SecurityUtil securityUtil;

    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasks(TaskStatus status, Long subjectId) {
        Long userId = securityUtil.getCurrentUserId();
        List<Task> tasks;

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
                .filter(t -> t.getSubject().getUser().getId().equals(userId))
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
        Long userId = securityUtil.getCurrentUserId();
        Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + request.getSubjectId()));

        Task task = Task.builder()
                .subject(subject)
                .title(request.getTitle())
                .description(request.getDescription())
                .deadline(request.getDeadline())
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .build();

        Task saved = taskRepository.save(task);
        return TaskResponse.fromEntity(saved);
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        Task task = taskRepository.findById(id)
                .filter(t -> t.getSubject().getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (!task.getSubject().getId().equals(request.getSubjectId())) {
            Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + request.getSubjectId()));
            task.setSubject(subject);
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDeadline(request.getDeadline());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        Task updated = taskRepository.save(task);
        return TaskResponse.fromEntity(updated);
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, TaskStatus status) {
        Long userId = securityUtil.getCurrentUserId();
        Task task = taskRepository.findById(id)
                .filter(t -> t.getSubject().getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setStatus(status);
        Task updated = taskRepository.save(task);
        return TaskResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteTask(Long id) {
        Long userId = securityUtil.getCurrentUserId();
        Task task = taskRepository.findById(id)
                .filter(t -> t.getSubject().getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        taskRepository.delete(task);
    }
}
