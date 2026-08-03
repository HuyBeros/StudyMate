package com.huyberos.studymate.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.ai.GeminiClient;
import com.huyberos.studymate.dto.request.QuizAttemptRequest;
import com.huyberos.studymate.dto.response.MindmapResponse;
import com.huyberos.studymate.dto.response.QuizAttemptResponse;
import com.huyberos.studymate.dto.response.QuizResponse;
import com.huyberos.studymate.entity.*;
import com.huyberos.studymate.entity.enums.CorrectOption;
import com.huyberos.studymate.entity.enums.SourceType;
import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.*;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiService {

    private final GeminiClient geminiClient;
    private final NoteRepository noteRepository;
    private final DocumentRepository documentRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final MindmapRepository mindmapRepository;
    private final SecurityUtil securityUtil;
    private final ObjectMapper objectMapper;

    // ── Summarize ──────────────────────────────────────────

    @Transactional
    public String summarizeNote(Long noteId) {
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + noteId));

        if (note.getContent() == null || note.getContent().isBlank()) {
            throw new BadRequestException("Note content is empty");
        }

        String prompt = """
                Bạn là một trợ lý học tập AI xuất sắc. Hãy tóm tắt nội dung bài học sau thành các ý chính ngắn gọn, súc tích bằng tiếng Việt.
                Dùng bullet points (-), tô đậm các khái niệm quan trọng bằng markdown (**khái niệm**).

                Tiêu đề: %s
                Nội dung:
                %s
                """.formatted(note.getTitle(), note.getContent());

        String summary = geminiClient.generateContent(prompt, false);
        note.setAiSummary(summary);
        noteRepository.save(note);
        return summary;
    }

    @Transactional(readOnly = true)
    public String summarizeDocument(Long documentId) {
        Long userId = securityUtil.getCurrentUserId();
        Document doc = documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        if (doc.getExtractedText() == null || doc.getExtractedText().isBlank()) {
            throw new BadRequestException("Document text is empty or could not be extracted");
        }

        String prompt = """
                Bạn là một trợ lý học tập AI xuất sắc. Hãy tóm tắt tài liệu học tập sau thành các ý chính súc tích bằng tiếng Việt.
                Phân chia theo các mục rõ ràng, highlight từ khóa quan trọng.

                Tên tài liệu: %s
                Nội dung:
                %s
                """.formatted(doc.getFileName(), truncateContent(doc.getExtractedText(), 15000));

        return geminiClient.generateContent(prompt, false);
    }

    // ── Quiz Generation ────────────────────────────────────

    @Transactional
    public QuizResponse generateQuizFromNote(Long noteId, int numberOfQuestions) {
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + noteId));

        return generateQuiz(SourceType.NOTE, note.getId(), note.getTitle(), note.getContent(), numberOfQuestions);
    }

    @Transactional
    public QuizResponse generateQuizFromDocument(Long documentId, int numberOfQuestions) {
        Long userId = securityUtil.getCurrentUserId();
        Document doc = documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        return generateQuiz(SourceType.DOCUMENT, doc.getId(), doc.getFileName(), doc.getExtractedText(), numberOfQuestions);
    }

    private QuizResponse generateQuiz(SourceType sourceType, Long sourceId, String title, String content, int count) {
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Content is empty, cannot generate quiz");
        }

        int numQ = count > 0 ? Math.min(count, 20) : 5;

        String prompt = """
                Bạn là chuyên gia ra đề thi. Hãy tạo bộ %d câu hỏi trắc nghiệm tiếng Việt từ nội dung sau.
                Trả về DUY NHẤT một JSON Array chứa các object câu hỏi theo đúng cấu trúc sau:
                [
                  {
                    "questionText": "Nội dung câu hỏi?",
                    "optionA": "Đáp án A",
                    "optionB": "Đáp án B",
                    "optionC": "Đáp án C",
                    "optionD": "Đáp án D",
                    "correctOption": "A", // Chỉ chọn A, B, C, hoặc D
                    "explanation": "Giải thích ngắn gọn vì sao đáp án đúng"
                  }
                ]

                Nội dung tài liệu/bài học:
                %s
                """.formatted(numQ, truncateContent(content, 15000));

        String jsonResponse = geminiClient.generateContent(prompt, true);

        try {
            List<Map<String, String>> rawQuestions = objectMapper.readValue(jsonResponse, new TypeReference<>() {});

            Quiz quiz = Quiz.builder()
                    .sourceType(sourceType)
                    .sourceId(sourceId)
                    .title("Trắc nghiệm: " + title)
                    .build();

            Quiz savedQuiz = quizRepository.save(quiz);

            List<QuizQuestion> questionEntities = new ArrayList<>();
            for (Map<String, String> qMap : rawQuestions) {
                CorrectOption correctOpt = parseCorrectOption(qMap.get("correctOption"));

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

        } catch (Exception e) {
            log.error("Failed to parse quiz JSON from Gemini: {}", jsonResponse, e);
            throw new BadRequestException("AI generated invalid quiz structure. Please try again.");
        }
    }

    // ── Mindmap Generation ──────────────────────────────────

    @Transactional
    public MindmapResponse generateMindmapFromNote(Long noteId) {
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + noteId));

        return generateMindmap(SourceType.NOTE, note.getId(), note.getTitle(), note.getContent());
    }

    @Transactional
    public MindmapResponse generateMindmapFromDocument(Long documentId) {
        Long userId = securityUtil.getCurrentUserId();
        Document doc = documentRepository.findByIdAndUserId(documentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        return generateMindmap(SourceType.DOCUMENT, doc.getId(), doc.getFileName(), doc.getExtractedText());
    }

    private MindmapResponse generateMindmap(SourceType sourceType, Long sourceId, String title, String content) {
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Content is empty, cannot generate mindmap");
        }

        String prompt = """
                Hãy phân tích nội dung sau và chuyển thành cây Mindmap tiếng Việt theo định dạng JSON.
                JSON phải có cấu trúc cây lồng nhau như sau:
                {
                  "id": "root",
                  "label": "Tên chủ đề chính",
                  "children": [
                    {
                      "id": "node-1",
                      "label": "Nhánh 1",
                      "children": [
                        { "id": "node-1-1", "label": "Ý chi tiết 1.1" }
                      ]
                    }
                  ]
                }

                Nội dung tài liệu/bài học:
                %s
                """.formatted(truncateContent(content, 15000));

        String jsonResponse = geminiClient.generateContent(prompt, true);

        try {
            Map<String, Object> structure = objectMapper.readValue(jsonResponse, new TypeReference<>() {});

            Mindmap mindmap = Mindmap.builder()
                    .sourceType(sourceType)
                    .sourceId(sourceId)
                    .title("Mindmap: " + title)
                    .structure(structure)
                    .build();

            Mindmap saved = mindmapRepository.save(mindmap);
            return MindmapResponse.fromEntity(saved);

        } catch (Exception e) {
            log.error("Failed to parse mindmap JSON from Gemini: {}", jsonResponse, e);
            throw new BadRequestException("AI generated invalid mindmap structure. Please try again.");
        }
    }

    // ── Quiz Attempt & Scoring ──────────────────────────────

    @Transactional
    public QuizAttemptResponse attemptQuiz(Long quizId, QuizAttemptRequest request) {
        User currentUser = securityUtil.getCurrentUser();
        Quiz quiz = quizRepository.findByIdWithQuestions(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        Map<Long, CorrectOption> userAnswers = request.getAnswers() != null ? request.getAnswers() : Map.of();
        List<QuizQuestion> questions = quiz.getQuestions();

        int score = 0;
        List<QuizAttemptResponse.QuestionResultDetail> details = new ArrayList<>();

        for (QuizQuestion q : questions) {
            CorrectOption userChoice = userAnswers.get(q.getId());
            boolean isCorrect = userChoice != null && userChoice == q.getCorrectOption();
            if (isCorrect) {
                score++;
            }

            details.add(QuizAttemptResponse.QuestionResultDetail.builder()
                    .questionId(q.getId())
                    .questionText(q.getQuestionText())
                    .userOption(userChoice)
                    .correctOption(q.getCorrectOption())
                    .isCorrect(isCorrect)
                    .explanation(q.getExplanation())
                    .build());
        }

        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .user(currentUser)
                .score(score)
                .totalQuestions(questions.size())
                .build();

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        return QuizAttemptResponse.fromEntity(savedAttempt, details);
    }

    @Transactional(readOnly = true)
    public QuizResponse getQuizById(Long quizId) {
        Quiz quiz = quizRepository.findByIdWithQuestions(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + quizId));

        return QuizResponse.fromEntity(quiz, true);
    }

    @Transactional(readOnly = true)
    public MindmapResponse getMindmapById(Long mindmapId) {
        Mindmap mindmap = mindmapRepository.findById(mindmapId)
                .orElseThrow(() -> new ResourceNotFoundException("Mindmap not found: " + mindmapId));

        return MindmapResponse.fromEntity(mindmap);
    }

    // ── Helpers ────────────────────────────────────────────

    private String truncateContent(String text, int maxLength) {
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "\n...[Nội dung đã cắt bớt]";
    }

    private CorrectOption parseCorrectOption(String str) {
        if (str == null) return CorrectOption.A;
        String clean = str.trim().toUpperCase();
        try {
            return CorrectOption.valueOf(clean);
        } catch (IllegalArgumentException e) {
            return CorrectOption.A;
        }
    }
}
