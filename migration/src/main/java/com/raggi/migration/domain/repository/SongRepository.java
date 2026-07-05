package com.raggi.migration.domain.repository;

import com.raggi.migration.domain.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {
    Optional<Song> findByName(String name);
    boolean existsByName(String name);
}
