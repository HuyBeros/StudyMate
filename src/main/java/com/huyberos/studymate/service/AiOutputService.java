package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.request.MindmapSaveRequest;
import com.huyberos.studymate.dto.request.QuizSaveRequest;
import com.huyberos.studymate.dto.request.SummarySaveRequest;
import com.huyberos.studymate.dto.response.MindmapResponse;
import com.huyberos.studymate.dto.response.QuizResponse;
import com.huyberos.studymate.entity.*;
import com.huyberos.studymate.entity.enums.CorrectOption;
import com.huyberos.studymate.entity.enums.SourceType;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.*;
import com.huyberos.studymate.util.AiTextUtil;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiOutputService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final MindmapRepository mindmapRepository;
    private final SummaryRepository summaryRepository;
    private final DocumentRepository documentRepository;
    private final NoteRepository noteRepository;
    private final SubjectRepository subjectRepository;
    private final SecurityUtil securityUtil;

    void requireOwnedSource(SourceType type, Long sourceId, Long userId) {
        boolean owned = sourceId != null && (
                (type == SourceType.DOCUMENT && documentRepository.findByIdAndUserId(sourceId, userId).isPresent())
                || (type == SourceType.NOTE && noteRepository.findByIdAndUserId(sourceId, userId).isPresent()));
        if (!owned) throw new ResourceNotFoundException("Không tìm thấy nguồn nội dung ôn tập.");
    }

    @Transactional
    public QuizResponse saveQuiz(QuizSaveRequest request) {
        requireOwnedSource(request.getSourceType(), request.getSourceId(), securityUtil.getCurrentUserId());
        Quiz quiz = Quiz.builder()
                .sourceType(request.getSourceType())
                .sourceId(request.getSourceId())
                .title(request.getTitle())
                .build();
        Quiz savedQuiz = quizRepository.save(quiz);

        List<QuizQuestion> questionEntities = new ArrayList<>();
        for (Map<String, String> qMap : request.getQuestions()) {
            CorrectOption correctOpt = AiTextUtil.parseCorrectOption(qMap.get("correctOption"));
            QuizQuestion q = QuizQuestion.builder()
                    .quiz(savedQuiz)
                    .questionText(qMap.get("questionText"))
                    .optionA(qMap.get("optionA"))
                    .optionB(qMap.get("optionB"))
                    .optionC(qMap.get("optionC"))
                    .optionD(qMap.get("optionD"))
                    .correctOption(correctOpt)
                    .explanation(qMap.get("explanation"))
                    .build();
            questionEntities.add(q);
        }
        quizQuestionRepository.saveAll(questionEntities);
        savedQuiz.setQuestions(questionEntities);

        return QuizResponse.fromEntity(savedQuiz, true);
    }

    @Transactional
    public MindmapResponse saveMindmap(MindmapSaveRequest request) {
        requireOwnedSource(request.getSourceType(), request.getSourceId(), securityUtil.getCurrentUserId());
        Mindmap mindmap = Mindmap.builder()
                .sourceType(request.getSourceType())
                .sourceId(request.getSourceId())
                .title(request.getTitle())
                .structure(request.getStructure())
                .build();
        Mindmap saved = mindmapRepository.save(mindmap);
        return MindmapResponse.fromEntity(saved);
    }

    @Transactional
    public Summary saveSummary(SummarySaveRequest request) {
        requireOwnedSource(request.getSourceType(), request.getSourceId(), securityUtil.getCurrentUserId());
        Summary summary = Summary.builder()
                .sourceType(request.getSourceType())
                .sourceId(request.getSourceId())
                .title(request.getTitle())
                .content(request.getSummary())
                .build();
        return summaryRepository.save(summary);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAllAiOutputsForSubject(Long subjectId) {
        if (!subjectRepository.existsByIdAndUserId(subjectId, securityUtil.getCurrentUserId())) {
            throw new ResourceNotFoundException("Không tìm thấy môn học.");
        }
        List<Long> docIds = documentRepository.findBySubjectIdOrderByUploadDateDesc(subjectId).stream().map(Document::getId).toList();
        List<Long> noteIds = noteRepository.findBySubjectIdOrderByUpdatedAtDesc(subjectId).stream().map(Note::getId).toList();

        // Fetch Quizzes
        List<Quiz> quizzes = new ArrayList<>();
        if (!docIds.isEmpty()) {
            quizzes.addAll(quizRepository.findAll().stream()
                    .filter(q -> q.getSourceType() == SourceType.DOCUMENT && docIds.contains(q.getSourceId()))
                    .collect(Collectors.toList()));
        }
        if (!noteIds.isEmpty()) {
            quizzes.addAll(quizRepository.findAll().stream()
                    .filter(q -> q.getSourceType() == SourceType.NOTE && noteIds.contains(q.getSourceId()))
                    .collect(Collectors.toList()));
        }

        // Fetch Mindmaps
        List<Mindmap> mindmaps = new ArrayList<>();
        if (!docIds.isEmpty()) {
            mindmaps.addAll(mindmapRepository.findAll().stream()
                    .filter(m -> m.getSourceType() == SourceType.DOCUMENT && docIds.contains(m.getSourceId()))
                    .collect(Collectors.toList()));
        }
        if (!noteIds.isEmpty()) {
            mindmaps.addAll(mindmapRepository.findAll().stream()
                    .filter(m -> m.getSourceType() == SourceType.NOTE && noteIds.contains(m.getSourceId()))
                    .collect(Collectors.toList()));
        }

        // Fetch Summaries
        List<Summary> summaries = new ArrayList<>();
        if (!docIds.isEmpty()) {
            summaries.addAll(summaryRepository.findAll().stream()
                    .filter(s -> s.getSourceType() == SourceType.DOCUMENT && docIds.contains(s.getSourceId()))
                    .collect(Collectors.toList()));
        }
        if (!noteIds.isEmpty()) {
            summaries.addAll(summaryRepository.findAll().stream()
                    .filter(s -> s.getSourceType() == SourceType.NOTE && noteIds.contains(s.getSourceId()))
                    .collect(Collectors.toList()));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("quizzes", quizzes.stream().map(q -> QuizResponse.fromEntity(q, false)).collect(Collectors.toList()));
        result.put("mindmaps", mindmaps.stream().map(MindmapResponse::fromEntity).collect(Collectors.toList()));
        result.put("summaries", summaries);

        return result;
    }
}
