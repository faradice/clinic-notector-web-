package com.raggi.clinicnotector.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_scores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_name", length = 100)
    private String playerName;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "total_notes", nullable = false)
    private Integer totalNotes;

    @Column(name = "correct_notes", nullable = false)
    private Integer correctNotes;

    @Column(nullable = false)
    private Integer bpm;

    @Column(nullable = false)
    private Integer repetitions;

    @Column(name = "played_at", nullable = false)
    private LocalDateTime playedAt;

    @PrePersist
    protected void onCreate() {
        playedAt = LocalDateTime.now();
    }
}
