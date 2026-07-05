package com.raggi.migration.service;

import com.raggi.migration.domain.model.*;
import com.raggi.migration.domain.repository.ChordRepository;
import com.raggi.migration.domain.repository.SongRepository;
import com.raggi.migration.model.ChordData;
import com.raggi.migration.model.SongData;
import com.raggi.migration.parser.ChordLibraryParser;
import com.raggi.migration.parser.SongFileParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class MigrationService {

    private final SongFileParser songFileParser;
    private final ChordLibraryParser chordLibraryParser;
    private final SongRepository songRepository;
    private final ChordRepository chordRepository;

    @Value("${migration.source-directory}")
    private String sourceDirectory;

    @Value("${migration.skip-duplicates}")
    private boolean skipDuplicates;

    private final Map<String, Chord> chordCache = new HashMap<>();

    @Transactional
    public void migrate() throws IOException {
        Path sourcePath = Paths.get(sourceDirectory);
        if (!Files.exists(sourcePath)) {
            throw new IOException("Source directory not found: " + sourceDirectory);
        }

        log.info("Starting migration from: {}", sourceDirectory);

        // Step 1: Migrate chord library
        migrateChordLibrary(sourcePath);

        // Step 2: Migrate songs
        migrateSongs(sourcePath);

        log.info("Migration complete!");
        log.info("Total chords migrated: {}", chordCache.size());
        log.info("Total songs in database: {}", songRepository.count());
    }

    private void migrateChordLibrary(Path sourcePath) throws IOException {
        log.info("Migrating chord library...");

        // Find all .chord files recursively
        try (Stream<Path> paths = Files.walk(sourcePath)) {
            List<Path> chordFiles = paths
                .filter(Files::isRegularFile)
                .filter(p -> p.toString().endsWith(".chord"))
                .toList();

            log.info("Found {} chord files", chordFiles.size());

            int migrated = 0;
            int skipped = 0;

            for (Path chordFile : chordFiles) {
                try {
                    ChordData chordData = chordLibraryParser.parseChord(chordFile);

                    // Check for duplicates
                    if (skipDuplicates && chordRepository.existsByName(chordData.getName())) {
                        log.debug("Skipping duplicate chord: {}", chordData.getName());
                        skipped++;
                        continue;
                    }

                    Chord chord = convertToChordEntity(chordData);
                    chord = chordRepository.save(chord);
                    chordCache.put(chord.getName(), chord);

                    migrated++;
                    if (migrated % 10 == 0) {
                        log.info("Migrated {} chords...", migrated);
                    }
                } catch (Exception e) {
                    log.error("Failed to migrate chord: {}", chordFile, e);
                }
            }

            log.info("Chord library migration complete: {} migrated, {} skipped", migrated, skipped);
        }
    }

    private void migrateSongs(Path sourcePath) throws IOException {
        log.info("Migrating songs...");

        // Find all song directories (directories containing .txt files)
        try (Stream<Path> paths = Files.walk(sourcePath)) {
            List<Path> songDirs = paths
                .filter(Files::isDirectory)
                .filter(this::isSongDirectory)
                .toList();

            log.info("Found {} song directories", songDirs.size());

            int migrated = 0;
            int skipped = 0;

            for (Path songDir : songDirs) {
                try {
                    SongData songData = songFileParser.parseSong(songDir);

                    // Check for duplicates
                    if (skipDuplicates && songRepository.existsByName(songData.getName())) {
                        log.debug("Skipping duplicate song: {}", songData.getName());
                        skipped++;
                        continue;
                    }

                    Song song = convertToSongEntity(songData);
                    songRepository.save(song);

                    migrated++;
                    if (migrated % 10 == 0) {
                        log.info("Migrated {} songs...", migrated);
                    }
                } catch (Exception e) {
                    log.error("Failed to migrate song: {}", songDir, e);
                }
            }

            log.info("Song migration complete: {} migrated, {} skipped", migrated, skipped);
        }
    }

    private boolean isSongDirectory(Path dir) {
        try (Stream<Path> files = Files.list(dir)) {
            return files.anyMatch(f -> f.toString().endsWith(".txt"));
        } catch (IOException e) {
            return false;
        }
    }

    private Chord convertToChordEntity(ChordData data) {
        Chord chord = Chord.builder()
            .name(data.getName())
            .rootNote(data.getRootNote())
            .chordType(data.getChordType())
            .build();

        data.getFretPositions().forEach(posData -> {
            ChordFretPosition position = ChordFretPosition.builder()
                .chord(chord)
                .stringNumber(posData.getStringNumber())
                .fretNumber(posData.getFretNumber())
                .finger(posData.getFinger())
                .isBase(posData.getIsBase())
                .build();
            chord.getFretPositions().add(position);
        });

        return chord;
    }

    private Song convertToSongEntity(SongData data) {
        Song song = Song.builder()
            .name(data.getName())
            .lyrics(data.getLyrics())
            .bpm(data.getBpm())
            .backgroundColor(data.getBackgroundColor())
            .textColor(data.getTextColor())
            .fontName(data.getFontName())
            .fontSize(data.getFontSize())
            .fontBold(data.getFontBold())
            .fontItalic(data.getFontItalic())
            .build();

        data.getChordPositions().forEach(posData -> {
            SongChordPosition position = SongChordPosition.builder()
                .song(song)
                .lineNumber(posData.getLineNumber())
                .wordNumber(posData.getWordNumber())
                .chordName(posData.getChordName())
                .charOffset(posData.getCharOffset())
                .build();
            song.getChordPositions().add(position);
        });

        return song;
    }
}
