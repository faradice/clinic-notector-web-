package com.raggi.migration.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chord_fret_positions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChordFretPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chord_id", nullable = false)
    private Chord chord;

    @Column(name = "string_number", nullable = false)
    private Integer stringNumber;

    @Column(name = "fret_number", nullable = false)
    private Integer fretNumber;

    @Column(name = "finger")
    private Integer finger;

    @Column(name = "is_base")
    private Boolean isBase = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
