package com.raggi.migration.model;

import lombok.Data;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

/**
 * Temporary data holder for song migration.
 */
@Data
@Builder
public class SongData {
    private String name;
    private String lyrics;
    private Integer bpm;
    private String backgroundColor;
    private String textColor;
    private String fontName;
    private Integer fontSize;
    private Boolean fontBold;
    private Boolean fontItalic;

    @Builder.Default
    private List<ChordPositionData> chordPositions = new ArrayList<>();
}
