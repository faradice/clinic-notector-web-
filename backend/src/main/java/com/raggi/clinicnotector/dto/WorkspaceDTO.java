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
public class WorkspaceDTO {
    private Long id;
    private String name;
    private String description;
    private List<WorkspaceCardDTO> cards;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
