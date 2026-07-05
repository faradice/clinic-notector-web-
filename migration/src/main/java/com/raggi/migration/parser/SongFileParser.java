package com.raggi.migration.parser;

import com.raggi.migration.model.ChordPositionData;
import com.raggi.migration.model.SongData;
import com.raggi.migration.util.ColorParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

/**
 * Parses song files from the legacy format:
 * - .txt file: lyrics
 * - .properties file: metadata (BPM, colors, font)
 * - .chords file: chord positions
 */
@Component
@Slf4j
public class SongFileParser {

    private static final String ENCODING = "ISO-8859-1";

    public SongData parseSong(Path songDirectory) throws IOException {
        String songName = songDirectory.getFileName().toString();
        log.info("Parsing song: {}", songName);

        SongData.SongDataBuilder builder = SongData.builder()
            .name(songName)
            .bpm(120); // default

        // Parse lyrics from .txt file
        Path txtFile = songDirectory.resolve(songName + ".txt");
        if (Files.exists(txtFile)) {
            builder.lyrics(readLyrics(txtFile));
        }

        // Parse metadata from .properties file
        Path propertiesFile = songDirectory.resolve(songName + ".properties");
        if (Files.exists(propertiesFile)) {
            parseProperties(propertiesFile, builder);
        }

        SongData songData = builder.build();

        // Parse chord positions from .chords file
        Path chordsFile = songDirectory.resolve(songName + ".chords");
        if (Files.exists(chordsFile)) {
            songData.setChordPositions(parseChordPositions(chordsFile));
        }

        return songData;
    }

    private String readLyrics(Path txtFile) throws IOException {
        StringBuilder lyrics = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(txtFile.toFile()), ENCODING))) {
            String line;
            while ((line = reader.readLine()) != null) {
                lyrics.append(line).append("\n");
            }
        }
        return lyrics.toString().trim();
    }

    private void parseProperties(Path propertiesFile, SongData.SongDataBuilder builder) throws IOException {
        Properties props = new Properties();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(propertiesFile.toFile()), ENCODING))) {
            props.load(reader);
        }

        // Parse BPM
        String bpmStr = props.getProperty("BPM");
        if (bpmStr != null) {
            try {
                builder.bpm(Integer.parseInt(bpmStr));
            } catch (NumberFormatException e) {
                log.warn("Invalid BPM value: {}", bpmStr);
            }
        }

        // Parse colors
        String bgColor = props.getProperty("BackGround");
        if (bgColor != null) {
            builder.backgroundColor(ColorParser.parseToHex(bgColor));
        }

        String fgColor = props.getProperty("ForeGround");
        if (fgColor != null) {
            builder.textColor(ColorParser.parseToHex(fgColor));
        }

        // Parse font properties
        String fontName = props.getProperty("Font");
        if (fontName != null) {
            builder.fontName(fontName);
        }

        String fontSize = props.getProperty("FontSize");
        if (fontSize != null) {
            try {
                builder.fontSize(Integer.parseInt(fontSize));
            } catch (NumberFormatException e) {
                log.warn("Invalid font size: {}", fontSize);
            }
        }

        String fontBold = props.getProperty("FontBold");
        if (fontBold != null) {
            builder.fontBold(Boolean.parseBoolean(fontBold));
        }

        String fontItalic = props.getProperty("FontItalic");
        if (fontItalic != null) {
            builder.fontItalic(Boolean.parseBoolean(fontItalic));
        }
    }

    private List<ChordPositionData> parseChordPositions(Path chordsFile) throws IOException {
        List<ChordPositionData> positions = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(chordsFile.toFile()), ENCODING))) {
            String line;
            int lineNumber = 0;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) {
                    lineNumber++;
                    continue;
                }

                // Format: "chordName lineNum wordNum offset"
                // or: "chordName lineNum wordNum"
                String[] parts = line.split("\\s+");
                if (parts.length >= 3) {
                    try {
                        ChordPositionData position = ChordPositionData.builder()
                            .chordName(parts[0])
                            .lineNumber(Integer.parseInt(parts[1]))
                            .wordNumber(Integer.parseInt(parts[2]))
                            .charOffset(parts.length > 3 ? Integer.parseInt(parts[3]) : 0)
                            .build();
                        positions.add(position);
                    } catch (NumberFormatException e) {
                        log.warn("Invalid chord position format: {}", line);
                    }
                }
                lineNumber++;
            }
        }

        return positions;
    }
}
