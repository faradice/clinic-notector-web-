package com.raggi.clinicnotector.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "song_chord_positions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SongChordPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "song_id", nullable = false)
    private Song song;

    @Column(name = "line_number", nullable = false)
    private Integer lineNumber;

    @Column(name = "word_number", nullable = false)
    private Integer wordNumber;

    @Column(name = "chord_name", nullable = false, length = 50)
    private String chordName;

    @Column(name = "char_offset", nullable = false)
    private Integer charOffset = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
