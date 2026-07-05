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
public class ChordDTO {
    private Long id;
    private String name;
    private String rootNote;
    private String chordType;
    private List<ChordFretPositionDTO> fretPositions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
