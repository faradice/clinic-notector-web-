package com.raggi.migration.model;

import lombok.Data;
import lombok.Builder;

/**
 * Temporary data holder for fret position migration.
 */
@Data
@Builder
public class FretPositionData {
    private Integer stringNumber;
    private Integer fretNumber;
    private Integer finger;
    private Boolean isBase;
}
