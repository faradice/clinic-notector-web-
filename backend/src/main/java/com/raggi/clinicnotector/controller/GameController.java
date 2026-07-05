package com.raggi.clinicnotector.controller;

import com.raggi.clinicnotector.domain.model.GameScore;
import com.raggi.clinicnotector.domain.repository.GameScoreRepository;
import com.raggi.clinicnotector.dto.GameScoreDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/game")
@RequiredArgsConstructor
public class GameController {

    private final GameScoreRepository gameScoreRepository;

    @GetMapping("/scores")
    public ResponseEntity<List<GameScoreDTO>> getAllScores() {
        List<GameScoreDTO> scores = gameScoreRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(scores);
    }

    @GetMapping("/scores/top")
    public ResponseEntity<List<GameScoreDTO>> getTopScores() {
        List<GameScoreDTO> scores = gameScoreRepository.findTop10ByOrderByScoreDescPlayedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(scores);
    }

    @GetMapping("/scores/player/{playerName}")
    public ResponseEntity<List<GameScoreDTO>> getPlayerScores(@PathVariable String playerName) {
        List<GameScoreDTO> scores = gameScoreRepository.findByPlayerNameOrderByPlayedAtDesc(playerName).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(scores);
    }

    @PostMapping("/scores")
    public ResponseEntity<GameScoreDTO> saveScore(@RequestBody GameScoreDTO scoreDTO) {
        GameScore score = toEntity(scoreDTO);
        GameScore savedScore = gameScoreRepository.save(score);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(savedScore));
    }

    @DeleteMapping("/scores/{id}")
    public ResponseEntity<Void> deleteScore(@PathVariable Long id) {
        if (!gameScoreRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        gameScoreRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private GameScoreDTO toDTO(GameScore score) {
        return GameScoreDTO.builder()
                .id(score.getId())
                .playerName(score.getPlayerName())
                .score(score.getScore())
                .totalNotes(score.getTotalNotes())
                .correctNotes(score.getCorrectNotes())
                .bpm(score.getBpm())
                .repetitions(score.getRepetitions())
                .playedAt(score.getPlayedAt())
                .build();
    }

    private GameScore toEntity(GameScoreDTO dto) {
        return GameScore.builder()
                .id(dto.getId())
                .playerName(dto.getPlayerName())
                .score(dto.getScore())
                .totalNotes(dto.getTotalNotes())
                .correctNotes(dto.getCorrectNotes())
                .bpm(dto.getBpm())
                .repetitions(dto.getRepetitions())
                .build();
    }
}
