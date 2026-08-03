package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.response.DocumentResponse;
import com.huyberos.studymate.entity.Document;
import com.huyberos.studymate.entity.ScheduleSlot;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.enums.DocumentStatus;
import com.huyberos.studymate.entity.enums.FileType;
import com.huyberos.studymate.exception.BadRequestException;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.DocumentRepository;
import com.huyberos.studymate.repository.ScheduleSlotRepository;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final SubjectRepository subjectRepository;
    private final ScheduleSlotRepository scheduleSlotRepository;
    private final FileStorageService fileStorageService;
    private final TextExtractorService textExtractorService;
    private final SecurityUtil securityUtil;

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsBySubject(Long subjectId) {
        Long userId = securityUtil.getCurrentUserId();
        subjectRepository.findByIdAndUserId(subjectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));

        return documentRepository.findBySubjectIdOrderByUploadDateDesc(subjectId).stream()
                .map(doc -> DocumentResponse.fromEntity(doc, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(Long id) {
        Long userId = securityUtil.getCurrentUserId();
        Document doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));

        return DocumentResponse.fromEntity(doc, true);
    }

    @Transactional
    public DocumentResponse uploadDocument(Long subjectId, Long scheduleSlotId, MultipartFile file) {
        Long userId = securityUtil.getCurrentUserId();
        Subject subject = subjectRepository.findByIdAndUserId(subjectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + subjectId));

        String originalFilename = file.getOriginalFilename();
        FileType fileType = textExtractorService.determineFileType(originalFilename);

        if (fileType == null) {
            throw new BadRequestException("Unsupported file format. Only PDF, DOCX, PPTX allowed.");
        }

        ScheduleSlot scheduleSlot = null;
        if (scheduleSlotId != null) {
            scheduleSlot = scheduleSlotRepository.findById(scheduleSlotId).orElse(null);
        }

        // 1. Lưu file vật lý
        String fileUrl = fileStorageService.storeFile(file, "documents");

        // 2. Trích xuất text (PDFBox / POI)
        String extractedText = "";
        DocumentStatus status = DocumentStatus.EXTRACTED;
        try {
            extractedText = textExtractorService.extractText(file, fileType);
            if (extractedText.isBlank()) {
                status = DocumentStatus.UPLOADED;
            }
        } catch (Exception e) {
            log.warn("Could not extract text from document {}: {}", originalFilename, e.getMessage());
            status = DocumentStatus.FAILED;
        }

        // 3. Lưu vào DB
        Document document = Document.builder()
                .subject(subject)
                .scheduleSlot(scheduleSlot)
                .fileName(originalFilename)
                .fileType(fileType)
                .fileUrl(fileUrl)
                .extractedText(extractedText)
                .status(status)
                .build();

        Document saved = documentRepository.save(document);
        return DocumentResponse.fromEntity(saved, true);
    }

    @Transactional
    public void deleteDocument(Long id) {
        Long userId = securityUtil.getCurrentUserId();
        Document doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));

        documentRepository.delete(doc);
    }
}
