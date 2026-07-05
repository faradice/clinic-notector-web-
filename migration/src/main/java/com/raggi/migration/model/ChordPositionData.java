package com.raggi.migration.model;

import lombok.Data;
import lombok.Builder;

/**
 * Temporary data holder for chord position migration.
 */
@Data
@Builder
public class ChordPositionData {
    private Integer lineNumber;
    private Integer wordNumber;
    private String chordName;
    private Integer charOffset;
}
