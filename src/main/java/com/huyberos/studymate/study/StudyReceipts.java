package com.huyberos.studymate.study;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.exception.ConflictException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Component @RequiredArgsConstructor
public class StudyReceipts {
    private final StudyMutationReceiptRepository receipts;
    private final ObjectMapper mapper;
    private final Clock clock;

    public String hash(Object payload) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(mapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8))); }
        catch (Exception error) { throw new IllegalStateException("Cannot encode study mutation", error); }
    }

    public <T> Optional<T> replay(User user, UUID mutationId, String operation, Object payload, Class<T> type) {
        return receipts.findByUserIdAndMutationId(user.getId(), mutationId).map(receipt -> {
            if (!receipt.getOperation().equals(operation) || !receipt.getRequestHash().equals(hash(payload)))
                throw new ConflictException("Khóa gửi lại đã được dùng cho một thao tác khác.");
            try { return mapper.readValue(receipt.getResponseJson(), type); }
            catch (Exception error) { throw new IllegalStateException("Cannot read study receipt", error); }
        });
    }

    public <T> T remember(User user, UUID mutationId, String operation, Object payload, T response) {
        var receipt = new StudyMutationReceipt(); receipt.setUser(user); receipt.setMutationId(mutationId);
        receipt.setOperation(operation); receipt.setRequestHash(hash(payload)); receipt.setCreatedAt(clock.instant());
        try { receipt.setResponseJson(mapper.writeValueAsString(response)); }
        catch (Exception error) { throw new IllegalStateException("Cannot encode study receipt", error); }
        receipts.save(receipt); return response;
    }
}
