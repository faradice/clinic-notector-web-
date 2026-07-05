package com.raggi.clinicnotector.domain.repository;

import com.raggi.clinicnotector.domain.model.GameScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameScoreRepository extends JpaRepository<GameScore, Long> {
    List<GameScore> findTop10ByOrderByScoreDescPlayedAtDesc();
    List<GameScore> findByPlayerNameOrderByPlayedAtDesc(String playerName);
}
