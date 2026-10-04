package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.request.MemoRequest;
import com.huyberos.studymate.dto.response.MemoResponse;
import com.huyberos.studymate.entity.Memo;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.Task;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.MemoRepository;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.repository.TaskRepository;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MemoService {

    private final MemoRepository memoRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final SubjectRepository subjectRepository;
    private final SecurityUtil securityUtil;

    @Transactional(readOnly = true)
    public List<MemoResponse> getMemos(LocalDate date, Long taskId, Long subjectId) {
        Long userId = securityUtil.getCurrentUserId();
        List<Memo> memos;

        if (taskId != null) {
            memos = memoRepository.findByUserIdAndTaskIdOrderByCreatedAtDesc(userId, taskId);
        } else if (subjectId != null) {
            memos = memoRepository.findByUserIdAndSubjectIdOrderByCreatedAtDesc(userId, subjectId);
        } else if (date != null) {
            memos = memoRepository.findByUserIdAndDateOrderByCreatedAtDesc(userId, date);
        } else {
            // Default to today's memos if nothing specified, or just return empty. 
            // We'll return today's memos.
            memos = memoRepository.findByUserIdAndDateOrderByCreatedAtDesc(userId, LocalDate.now());
        }

        return memos.stream().map(MemoResponse::fromEntity).toList();
    }

    @Transactional
    public MemoResponse createMemo(MemoRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Memo memo = Memo.builder()
                .user(user)
                .content(request.getContent())
                .date(request.getDate())
                .build();

        if (request.getTaskId() != null) {
            Task task = taskRepository.findById(request.getTaskId())
                    .filter(t -> t.getSubject().getUser().getId().equals(userId))
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
            memo.setTask(task);
            // Optionally auto-set subject and date based on task
            memo.setSubject(task.getSubject());
            if (memo.getDate() == null && task.getDueAt() != null) {
                memo.setDate(task.getDueAt().toLocalDate());
            }
        }

        if (request.getSubjectId() != null && memo.getSubject() == null) {
            Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
            memo.setSubject(subject);
        }

        Memo saved = memoRepository.save(memo);
        return MemoResponse.fromEntity(saved);
    }

    @Transactional
    public MemoResponse updateMemo(Long id, MemoRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        Memo memo = memoRepository.findById(id)
                .filter(m -> m.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Memo not found"));

        memo.setContent(request.getContent());
        
        if (request.getDate() != null) {
            memo.setDate(request.getDate());
        }

        Memo updated = memoRepository.save(memo);
        return MemoResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteMemo(Long id) {
        Long userId = securityUtil.getCurrentUserId();
        Memo memo = memoRepository.findById(id)
                .filter(m -> m.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Memo not found"));

        memoRepository.delete(memo);
    }
}
