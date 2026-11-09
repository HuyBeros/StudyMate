package com.huyberos.studymate.assistant;

import com.huyberos.studymate.dto.response.ApiResponse;
import com.huyberos.studymate.util.SecurityUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class DailyAssistantController {
    public record Question(@NotBlank @Size(max = 500) String question) {}

    private final SecurityUtil security;
    private final DailyAssistantIntent intent;
    private final DailyAssistantData data;

    @PostMapping("/ask")
    public ApiResponse<DailyAssistantData.Reply> ask(@Valid @RequestBody Question question) {
        long userId = security.getCurrentUserId();
        var now = data.localNow(userId);
        var query = intent.resolve(question.question(), now.toLocalDate());
        return ApiResponse.ok(data.answer(userId, now, query));
    }
}
