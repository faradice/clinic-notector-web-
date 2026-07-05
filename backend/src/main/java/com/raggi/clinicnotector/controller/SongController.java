package com.raggi.clinicnotector.controller;

import com.raggi.clinicnotector.domain.model.Song;
import com.raggi.clinicnotector.domain.repository.SongRepository;
import com.raggi.clinicnotector.dto.SongDTO;
import com.raggi.clinicnotector.mapper.SongMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/songs")
@RequiredArgsConstructor
public class SongController {

    private final SongRepository songRepository;
    private final SongMapper songMapper;

    @GetMapping
    public ResponseEntity<List<SongDTO>> getAllSongs() {
        List<SongDTO> songs = songRepository.findAll().stream()
                .map(songMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(songs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SongDTO> getSongById(@PathVariable Long id) {
        return songRepository.findById(id)
                .map(songMapper::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<SongDTO> getSongByName(@PathVariable String name) {
        return songRepository.findByName(name)
                .map(songMapper::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SongDTO> createSong(@RequestBody SongDTO songDTO) {
        if (songRepository.existsByName(songDTO.getName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        Song song = songMapper.toEntity(songDTO);
        Song savedSong = songRepository.save(song);
        return ResponseEntity.status(HttpStatus.CREATED).body(songMapper.toDTO(savedSong));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SongDTO> updateSong(@PathVariable Long id, @RequestBody SongDTO songDTO) {
        return songRepository.findById(id)
                .map(existingSong -> {
                    existingSong.setName(songDTO.getName());
                    existingSong.setLyrics(songDTO.getLyrics());
                    existingSong.setBpm(songDTO.getBpm());
                    existingSong.setBackgroundColor(songDTO.getBackgroundColor());
                    existingSong.setTextColor(songDTO.getTextColor());
                    existingSong.setFontName(songDTO.getFontName());
                    existingSong.setFontSize(songDTO.getFontSize());
                    existingSong.setFontBold(songDTO.getFontBold());
                    existingSong.setFontItalic(songDTO.getFontItalic());

                    // Update chord positions
                    existingSong.getChordPositions().clear();
                    if (songDTO.getChordPositions() != null) {
                        Song updatedSong = songMapper.toEntity(songDTO);
                        updatedSong.getChordPositions().forEach(pos -> {
                            pos.setSong(existingSong);
                            existingSong.getChordPositions().add(pos);
                        });
                    }

                    Song savedSong = songRepository.save(existingSong);
                    return ResponseEntity.ok(songMapper.toDTO(savedSong));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSong(@PathVariable Long id) {
        if (!songRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        songRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
