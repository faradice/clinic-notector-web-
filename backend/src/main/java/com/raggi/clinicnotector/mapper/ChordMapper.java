package com.raggi.clinicnotector.mapper;

import com.raggi.clinicnotector.domain.model.Chord;
import com.raggi.clinicnotector.domain.model.ChordFretPosition;
import com.raggi.clinicnotector.dto.ChordDTO;
import com.raggi.clinicnotector.dto.ChordFretPositionDTO;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class ChordMapper {

    public ChordDTO toDTO(Chord chord) {
        if (chord == null) {
            return null;
        }

        return ChordDTO.builder()
                .id(chord.getId())
                .name(chord.getName())
                .rootNote(chord.getRootNote())
                .chordType(chord.getChordType())
                .fretPositions(chord.getFretPositions().stream()
                        .map(this::toFretPositionDTO)
                        .collect(Collectors.toList()))
                .createdAt(chord.getCreatedAt())
                .updatedAt(chord.getUpdatedAt())
                .build();
    }

    public Chord toEntity(ChordDTO dto) {
        if (dto == null) {
            return null;
        }

        Chord chord = Chord.builder()
                .id(dto.getId())
                .name(dto.getName())
                .rootNote(dto.getRootNote())
                .chordType(dto.getChordType())
                .build();

        if (dto.getFretPositions() != null) {
            dto.getFretPositions().forEach(posDto -> {
                ChordFretPosition position = toFretPositionEntity(posDto);
                position.setChord(chord);
                chord.getFretPositions().add(position);
            });
        }

        return chord;
    }

    private ChordFretPositionDTO toFretPositionDTO(ChordFretPosition position) {
        return ChordFretPositionDTO.builder()
                .id(position.getId())
                .stringNumber(position.getStringNumber())
                .fretNumber(position.getFretNumber())
                .finger(position.getFinger())
                .isBase(position.getIsBase())
                .build();
    }

    private ChordFretPosition toFretPositionEntity(ChordFretPositionDTO dto) {
        return ChordFretPosition.builder()
                .id(dto.getId())
                .stringNumber(dto.getStringNumber())
                .fretNumber(dto.getFretNumber())
                .finger(dto.getFinger())
                .isBase(dto.getIsBase())
                .build();
    }
}
