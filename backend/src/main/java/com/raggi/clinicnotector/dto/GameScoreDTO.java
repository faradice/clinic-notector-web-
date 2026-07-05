package com.raggi.clinicnotector.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameScoreDTO {
    private Long id;
    private String playerName;
    private Integer score;
    private Integer totalNotes;
    private Integer correctNotes;
    private Integer bpm;
    private Integer repetitions;
    private LocalDateTime playedAt;
}
