package com.raggi.clinicnotector.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChordFretPositionDTO {
    private Long id;
    private Integer stringNumber;
    private Integer fretNumber;
    private Integer finger;
    private Boolean isBase;
}
