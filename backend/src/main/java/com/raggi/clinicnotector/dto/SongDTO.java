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
public class SongDTO {
    private Long id;
    private String name;
    private String lyrics;
    private Integer bpm;
    private String backgroundColor;
    private String textColor;
    private String fontName;
    private Integer fontSize;
    private Boolean fontBold;
    private Boolean fontItalic;
    private List<SongChordPositionDTO> chordPositions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
