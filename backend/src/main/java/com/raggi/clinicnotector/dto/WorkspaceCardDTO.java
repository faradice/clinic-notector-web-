package com.raggi.clinicnotector.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceCardDTO {
    private Long id;
    private Long chordId;
    private String chordName; // For display purposes
    private Integer positionX;
    private Integer positionY;
    private Integer beats; // How long the chord lasts, in beats (default 1)
}
