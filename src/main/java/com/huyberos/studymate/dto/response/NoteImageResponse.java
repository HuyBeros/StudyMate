package com.huyberos.studymate.dto.response;

import com.huyberos.studymate.entity.NoteImage;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NoteImageResponse {

    private Long id;
    private String imageUrl;
    private Integer position;

    public static NoteImageResponse fromEntity(NoteImage image) {
        return NoteImageResponse.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .position(image.getPosition())
                .build();
    }
}
