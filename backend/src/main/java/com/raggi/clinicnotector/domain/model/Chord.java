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
@Table(name = "chord_library")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Chord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "root_note", nullable = false, length = 10)
    private String rootNote;

    @Column(name = "chord_type", length = 50)
    private String chordType;

    @OneToMany(mappedBy = "chord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChordFretPosition> fretPositions = new ArrayList<>();

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
