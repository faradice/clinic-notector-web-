package com.raggi.clinicnotector.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "songs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String lyrics;

    @Column
    private Integer bpm = 120;

    @Column(name = "background_color", length = 7)
    private String backgroundColor;

    @Column(name = "text_color", length = 7)
    private String textColor;

    @Column(name = "font_name", length = 100)
    private String fontName;

    @Column(name = "font_size")
    private Integer fontSize = 14;

    @Column(name = "font_bold")
    private Boolean fontBold = false;

    @Column(name = "font_italic")
    private Boolean fontItalic = false;

    @OneToMany(mappedBy = "song", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SongChordPosition> chordPositions = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
