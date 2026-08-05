package com.raggi.clinicnotector.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomBarDTO {
    private Long id;
    private String name;
    private List<String> notes;
    /** Node on the note-reading path this exercise belongs to; null = unassigned. */
    private String lessonId;
    private LocalDateTime createdAt;
}
