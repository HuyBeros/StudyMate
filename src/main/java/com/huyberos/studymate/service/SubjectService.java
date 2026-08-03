package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.request.SubjectRequest;
import com.huyberos.studymate.dto.response.SubjectResponse;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.SubjectType;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final SecurityUtil securityUtil;

    @Transactional(readOnly = true)
    public List<SubjectResponse> getAllSubjects(SubjectType type) {
        Long userId = securityUtil.getCurrentUserId();
        List<Subject> subjects;
        if (type != null) {
            subjects = subjectRepository.findByUserIdAndType(userId, type);
        } else {
            subjects = subjectRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return subjects.stream()
                .map(SubjectResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubjectResponse getSubjectById(Long id) {
        Long userId = securityUtil.getCurrentUserId();
        Subject subject = subjectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));
        return SubjectResponse.fromEntity(subject);
    }

    @Transactional
    public SubjectResponse createSubject(SubjectRequest request) {
        User currentUser = securityUtil.getCurrentUser();

        Subject subject = Subject.builder()
                .user(currentUser)
                .name(request.getName())
                .color(request.getColor() != null ? request.getColor() : "#3B82F6")
                .type(request.getType() != null ? request.getType() : SubjectType.SCHOOL)
                .classCode(request.getClassCode())
                .build();

        Subject saved = subjectRepository.save(subject);
        return SubjectResponse.fromEntity(saved);
    }

    @Transactional
    public SubjectResponse updateSubject(Long id, SubjectRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        Subject subject = subjectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));

        subject.setName(request.getName());
        if (request.getColor() != null) {
            subject.setColor(request.getColor());
        }
        if (request.getType() != null) {
            subject.setType(request.getType());
        }
        subject.setClassCode(request.getClassCode());

        Subject updated = subjectRepository.save(subject);
        return SubjectResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteSubject(Long id) {
        Long userId = securityUtil.getCurrentUserId();
        Subject subject = subjectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));

        subjectRepository.delete(subject);
    }
}
