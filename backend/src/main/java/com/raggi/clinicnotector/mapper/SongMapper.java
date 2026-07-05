package com.raggi.clinicnotector.mapper;

import com.raggi.clinicnotector.domain.model.Song;
import com.raggi.clinicnotector.domain.model.SongChordPosition;
import com.raggi.clinicnotector.dto.SongChordPositionDTO;
import com.raggi.clinicnotector.dto.SongDTO;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class SongMapper {

    public SongDTO toDTO(Song song) {
        if (song == null) {
            return null;
        }

        return SongDTO.builder()
                .id(song.getId())
                .name(song.getName())
                .lyrics(song.getLyrics())
                .bpm(song.getBpm())
                .backgroundColor(song.getBackgroundColor())
                .textColor(song.getTextColor())
                .fontName(song.getFontName())
                .fontSize(song.getFontSize())
                .fontBold(song.getFontBold())
                .fontItalic(song.getFontItalic())
                .chordPositions(song.getChordPositions().stream()
                        .map(this::toChordPositionDTO)
                        .collect(Collectors.toList()))
                .createdAt(song.getCreatedAt())
                .updatedAt(song.getUpdatedAt())
                .build();
    }

    public Song toEntity(SongDTO dto) {
        if (dto == null) {
            return null;
        }

        Song song = Song.builder()
                .id(dto.getId())
                .name(dto.getName())
                .lyrics(dto.getLyrics())
                .bpm(dto.getBpm())
                .backgroundColor(dto.getBackgroundColor())
                .textColor(dto.getTextColor())
                .fontName(dto.getFontName())
                .fontSize(dto.getFontSize())
                .fontBold(dto.getFontBold())
                .fontItalic(dto.getFontItalic())
                .build();

        if (dto.getChordPositions() != null) {
            dto.getChordPositions().forEach(posDto -> {
                SongChordPosition position = toChordPositionEntity(posDto);
                position.setSong(song);
                song.getChordPositions().add(position);
            });
        }

        return song;
    }

    private SongChordPositionDTO toChordPositionDTO(SongChordPosition position) {
        return SongChordPositionDTO.builder()
                .id(position.getId())
                .lineNumber(position.getLineNumber())
                .wordNumber(position.getWordNumber())
                .chordName(position.getChordName())
                .charOffset(position.getCharOffset())
                .build();
    }

    private SongChordPosition toChordPositionEntity(SongChordPositionDTO dto) {
        return SongChordPosition.builder()
                .id(dto.getId())
                .lineNumber(dto.getLineNumber())
                .wordNumber(dto.getWordNumber())
                .chordName(dto.getChordName())
                .charOffset(dto.getCharOffset())
                .build();
    }
}
