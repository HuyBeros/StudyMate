package com.huyberos.studymate.controller;

import com.huyberos.studymate.dto.request.NoteRequest;
import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.dto.response.NoteImageResponse;
import com.huyberos.studymate.dto.response.NoteResponse;
import com.huyberos.studymate.entity.enums.ImportanceLevel;
import com.huyberos.studymate.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    /**
     * GET /api/notes
     * Filters: ?subjectId=1 & ?importanceLevel=IMPORTANT & ?search=kw
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<NoteResponse>>> getAllNotes(
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) ImportanceLevel importanceLevel,
            @RequestParam(required = false) String search) {
        List<NoteResponse> notes = noteService.getAllNotes(subjectId, importanceLevel, search);
        return ResponseEntity.ok(ApiResponse.ok(notes));
    }

    /**
     * GET /api/notes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteResponse>> getNoteById(@PathVariable Long id) {
        NoteResponse note = noteService.getNoteById(id);
        return ResponseEntity.ok(ApiResponse.ok(note));
    }

    /**
     * POST /api/notes
     */
    @PostMapping
    public ResponseEntity<ApiResponse<NoteResponse>> createNote(
            @Valid @RequestBody NoteRequest request) {
        NoteResponse created = noteService.createNote(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Note created successfully", created));
    }

    /**
     * PUT /api/notes/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<NoteResponse>> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request) {
        NoteResponse updated = noteService.updateNote(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Note updated successfully", updated));
    }

    /**
     * POST /api/notes/{id}/images — Upload ảnh vào ghi chú
     */
    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<NoteImageResponse>> addImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "position", required = false) Integer position) {
        NoteImageResponse image = noteService.addImageToNote(id, file, position);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Image uploaded to note", image));
    }

    /**
     * DELETE /api/notes/{id}/images/{imageId}
     */
    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {
        noteService.deleteImageFromNote(id, imageId);
        return ResponseEntity.ok(ApiResponse.ok("Image deleted from note", null));
    }

    /**
     * DELETE /api/notes/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(@PathVariable Long id) {
        noteService.deleteNote(id);
        return ResponseEntity.ok(ApiResponse.ok("Note deleted successfully", null));
    }
}
