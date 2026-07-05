package com.raggi.clinicnotector.controller;

import com.raggi.clinicnotector.domain.model.Chord;
import com.raggi.clinicnotector.domain.repository.ChordRepository;
import com.raggi.clinicnotector.dto.ChordDTO;
import com.raggi.clinicnotector.dto.ChordFretPositionDTO;
import com.raggi.clinicnotector.mapper.ChordMapper;
import com.raggi.clinicnotector.service.ChordAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/chords")
@RequiredArgsConstructor
public class ChordController {

    private final ChordRepository chordRepository;
    private final ChordMapper chordMapper;
    private final ChordAnalysisService chordAnalysisService;

    @GetMapping
    public ResponseEntity<List<ChordDTO>> getAllChords() {
        List<ChordDTO> chords = chordRepository.findAll().stream()
                .map(chordMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(chords);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChordDTO> getChordById(@PathVariable Long id) {
        return chordRepository.findById(id)
                .map(chordMapper::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<ChordDTO> getChordByName(@PathVariable String name) {
        return chordRepository.findByName(name)
                .map(chordMapper::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ChordDTO> createChord(@RequestBody ChordDTO chordDTO) {
        if (chordRepository.existsByName(chordDTO.getName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        Chord chord = chordMapper.toEntity(chordDTO);
        Chord savedChord = chordRepository.save(chord);
        return ResponseEntity.status(HttpStatus.CREATED).body(chordMapper.toDTO(savedChord));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChordDTO> updateChord(@PathVariable Long id, @RequestBody ChordDTO chordDTO) {
        return chordRepository.findById(id)
                .map(existingChord -> {
                    existingChord.setName(chordDTO.getName());
                    existingChord.setRootNote(chordDTO.getRootNote());
                    existingChord.setChordType(chordDTO.getChordType());

                    // Update fret positions
                    existingChord.getFretPositions().clear();
                    if (chordDTO.getFretPositions() != null) {
                        Chord updatedChord = chordMapper.toEntity(chordDTO);
                        updatedChord.getFretPositions().forEach(pos -> {
                            pos.setChord(existingChord);
                            existingChord.getFretPositions().add(pos);
                        });
                    }

                    Chord savedChord = chordRepository.save(existingChord);
                    return ResponseEntity.ok(chordMapper.toDTO(savedChord));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChord(@PathVariable Long id) {
        if (!chordRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        chordRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Analyze fret positions and calculate chord name.
     * POST body: { "fretPositions": [...] }
     * Response: { "name": "Cmaj7", "rootNote": "C", "chordType": "maj7" }
     */
    @PostMapping("/analyze")
    public ResponseEntity<ChordAnalysisResponse> analyzeChord(@RequestBody ChordAnalysisRequest request) {
        if (request.getFretPositions() == null || request.getFretPositions().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String chordName = chordAnalysisService.calculateChordName(request.getFretPositions());
        String rootNote = chordAnalysisService.extractRootNote(chordName);
        String chordType = chordAnalysisService.extractChordType(chordName);

        ChordAnalysisResponse response = new ChordAnalysisResponse(chordName, rootNote, chordType);
        return ResponseEntity.ok(response);
    }

    // DTOs for analyze endpoint
    public static class ChordAnalysisRequest {
        private List<ChordFretPositionDTO> fretPositions;

        public ChordAnalysisRequest() {}

        public List<ChordFretPositionDTO> getFretPositions() {
            return fretPositions;
        }

        public void setFretPositions(List<ChordFretPositionDTO> fretPositions) {
            this.fretPositions = fretPositions;
        }
    }

    public static class ChordAnalysisResponse {
        private String name;
        private String rootNote;
        private String chordType;

        public ChordAnalysisResponse(String name, String rootNote, String chordType) {
            this.name = name;
            this.rootNote = rootNote;
            this.chordType = chordType;
        }

        public String getName() {
            return name;
        }

        public String getRootNote() {
            return rootNote;
        }

        public String getChordType() {
            return chordType;
        }
    }
}
