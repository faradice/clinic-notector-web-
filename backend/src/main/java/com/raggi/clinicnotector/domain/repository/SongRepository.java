package com.raggi.clinicnotector.domain.repository;

import com.raggi.clinicnotector.domain.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {
    Optional<Song> findByName(String name);
    boolean existsByName(String name);
}
