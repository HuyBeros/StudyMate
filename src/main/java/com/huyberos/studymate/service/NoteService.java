package com.huyberos.studymate.service;

import com.huyberos.studymate.dto.request.NoteRequest;
import com.huyberos.studymate.dto.response.NoteImageResponse;
import com.huyberos.studymate.dto.response.NoteResponse;
import com.huyberos.studymate.entity.Note;
import com.huyberos.studymate.entity.NoteImage;
import com.huyberos.studymate.entity.ScheduleSlot;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.enums.ImportanceLevel;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.NoteImageRepository;
import com.huyberos.studymate.repository.NoteRepository;
import com.huyberos.studymate.repository.ScheduleSlotRepository;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final NoteImageRepository noteImageRepository;
    private final SubjectRepository subjectRepository;
    private final ScheduleSlotRepository scheduleSlotRepository;
    private final FileStorageService fileStorageService;
    private final SecurityUtil securityUtil;

    @Transactional(readOnly = true)
    public List<NoteResponse> getAllNotes(Long subjectId, ImportanceLevel level, String search) {
        Long userId = securityUtil.getCurrentUserId();
        List<Note> notes;

        if (search != null && !search.isBlank()) {
            notes = noteRepository.searchByKeyword(userId, search.trim());
        } else if (subjectId != null && level != null) {
            notes = noteRepository.findBySubjectIdAndImportanceLevel(subjectId, level);
        } else if (subjectId != null) {
            notes = noteRepository.findBySubjectIdOrderByUpdatedAtDesc(subjectId);
        } else {
            notes = noteRepository.findAllByUserId(userId);
        }

        return notes.stream()
                .map(NoteResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public NoteResponse getNoteById(Long id) {
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        return NoteResponse.fromEntity(note);
    }

    @Transactional
    public NoteResponse createNote(NoteRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + request.getSubjectId()));

        ScheduleSlot scheduleSlot = null;
        if (request.getScheduleSlotId() != null) {
            scheduleSlot = scheduleSlotRepository.findById(request.getScheduleSlotId())
                    .orElse(null);
        }

        Note note = Note.builder()
                .subject(subject)
                .scheduleSlot(scheduleSlot)
                .title(request.getTitle())
                .content(request.getContent())
                .importanceLevel(request.getImportanceLevel() != null ? request.getImportanceLevel() : ImportanceLevel.NORMAL)
                .build();

        Note saved = noteRepository.save(note);
        return NoteResponse.fromEntity(saved);
    }

    @Transactional
    public NoteResponse updateNote(Long id, NoteRequest request) {
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        if (!note.getSubject().getId().equals(request.getSubjectId())) {
            Subject subject = subjectRepository.findByIdAndUserId(request.getSubjectId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + request.getSubjectId()));
            note.setSubject(subject);
        }

        if (request.getScheduleSlotId() != null) {
            ScheduleSlot slot = scheduleSlotRepository.findById(request.getScheduleSlotId()).orElse(null);
            note.setScheduleSlot(slot);
        } else {
            note.setScheduleSlot(null);
        }

        note.setTitle(request.getTitle());
        note.setContent(request.getContent());
        if (request.getImportanceLevel() != null) {
            note.setImportanceLevel(request.getImportanceLevel());
        }

        Note updated = noteRepository.save(note);
        return NoteResponse.fromEntity(updated);
    }

    @Transactional
    public NoteImageResponse addImageToNote(Long noteId, MultipartFile file, Integer position) {
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        String imageUrl = fileStorageService.storeFile(file, "notes");

        int pos = (position != null) ? position : note.getImages().size();

        NoteImage noteImage = NoteImage.builder()
                .note(note)
                .imageUrl(imageUrl)
                .position(pos)
                .build();

        NoteImage saved = noteImageRepository.save(noteImage);
        return NoteImageResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteImageFromNote(Long noteId, Long imageId) {
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + noteId));

        NoteImage image = noteImageRepository.findById(imageId)
                .filter(img -> img.getNote().getId().equals(note.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Image not found: " + imageId));

        noteImageRepository.delete(image);
    }

    @Transactional
    public void deleteNote(Long id) {
        Long userId = securityUtil.getCurrentUserId();
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        noteRepository.delete(note);
    }
}
