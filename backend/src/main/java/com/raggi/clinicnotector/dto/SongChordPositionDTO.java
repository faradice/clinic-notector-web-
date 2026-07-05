package com.raggi.clinicnotector.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SongChordPositionDTO {
    private Long id;
    private Integer lineNumber;
    private Integer wordNumber;
    private String chordName;
    private Integer charOffset;
}
