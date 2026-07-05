package com.raggi.migration.parser;

import com.raggi.migration.model.ChordData;
import com.raggi.migration.model.FretPositionData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Parses chord definition files (.chord format).
 * Format:
 * Line 1: Chord name
 * Lines 2-7: Fret positions for strings 1-6 (either "x" or "fret finger")
 */
@Component
@Slf4j
public class ChordLibraryParser {

    private static final String ENCODING = "ISO-8859-1";
    private static final int NUM_STRINGS = 6;

    public ChordData parseChord(Path chordFile) throws IOException {
        String fileName = chordFile.getFileName().toString();
        String chordName = fileName.replace(".chord", "");

        log.debug("Parsing chord: {}", chordName);

        List<String> lines = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(chordFile.toFile()), ENCODING))) {
            String line;
            while ((line = reader.readLine()) != null) {
                lines.add(line.trim());
            }
        }

        if (lines.isEmpty()) {
            throw new IOException("Empty chord file: " + chordFile);
        }

        // First line is the chord name
        String name = lines.get(0);
        if (name.isEmpty()) {
            name = chordName; // fallback to filename
        }

        ChordData.ChordDataBuilder builder = ChordData.builder()
            .name(name)
            .rootNote(extractRootNote(name))
            .chordType(extractChordType(name));

        List<FretPositionData> fretPositions = new ArrayList<>();

        // Parse string positions (lines 2-7, strings 1-6)
        for (int stringNum = 1; stringNum <= NUM_STRINGS && stringNum < lines.size(); stringNum++) {
            String positionLine = lines.get(stringNum);

            if (positionLine.equalsIgnoreCase("x") || positionLine.isEmpty()) {
                // Muted string - skip
                continue;
            }

            String[] parts = positionLine.split("\\s+");
            if (parts.length >= 2) {
                try {
                    int fret = Integer.parseInt(parts[0]);
                    int finger = Integer.parseInt(parts[1]);

                    FretPositionData position = FretPositionData.builder()
                        .stringNumber(stringNum)
                        .fretNumber(fret)
                        .finger(finger)
                        .isBase(fret == 0 || isLowestFrettedNote(fret, stringNum, lines))
                        .build();

                    fretPositions.add(position);
                } catch (NumberFormatException e) {
                    log.warn("Invalid fret position in {}: {}", chordFile, positionLine);
                }
            }
        }

        builder.fretPositions(fretPositions);
        return builder.build();
    }

    private String extractRootNote(String chordName) {
        // Extract root note from chord name (e.g., "Cmaj7" -> "C", "C#m" -> "C#")
        if (chordName.length() < 1) {
            return "C";
        }

        // Handle sharp/flat
        if (chordName.length() > 1 && (chordName.charAt(1) == '#' || chordName.charAt(1) == 'b')) {
            return chordName.substring(0, 2);
        }

        return chordName.substring(0, 1);
    }

    private String extractChordType(String chordName) {
        String rootNote = extractRootNote(chordName);
        String type = chordName.substring(rootNote.length());

        // Normalize common chord types
        if (type.isEmpty() || type.equals("M")) {
            return "major";
        } else if (type.equals("m")) {
            return "minor";
        } else if (type.equals("7")) {
            return "7th";
        } else if (type.equals("maj7") || type.equals("M7")) {
            return "maj7";
        } else if (type.equals("m7")) {
            return "m7";
        } else if (type.equals("dim")) {
            return "dim";
        } else if (type.equals("dim7")) {
            return "dim7";
        } else if (type.equals("sus2")) {
            return "sus2";
        } else if (type.equals("sus4")) {
            return "sus4";
        }

        return type; // Return as-is for other types
    }

    private boolean isLowestFrettedNote(int fret, int stringNum, List<String> lines) {
        if (fret == 0) {
            return true; // Open strings are considered base
        }

        // Check if this is the lowest fretted position
        for (int i = stringNum + 1; i <= NUM_STRINGS && i < lines.size(); i++) {
            String line = lines.get(i);
            if (!line.equalsIgnoreCase("x") && !line.isEmpty()) {
                String[] parts = line.split("\\s+");
                if (parts.length >= 1) {
                    try {
                        int otherFret = Integer.parseInt(parts[0]);
                        if (otherFret > 0 && otherFret < fret) {
                            return false; // Found a lower fret
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }

        return true;
    }
}
