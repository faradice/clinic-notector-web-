package com.raggi.migration.model;

import lombok.Data;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

/**
 * Temporary data holder for chord migration.
 */
@Data
@Builder
public class ChordData {
    private String name;
    private String rootNote;
    private String chordType;

    @Builder.Default
    private List<FretPositionData> fretPositions = new ArrayList<>();
}
