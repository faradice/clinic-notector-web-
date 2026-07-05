package com.raggi.migration.domain.repository;

import com.raggi.migration.domain.model.Chord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChordRepository extends JpaRepository<Chord, Long> {
    Optional<Chord> findByName(String name);
    boolean existsByName(String name);
}
