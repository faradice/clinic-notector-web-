package com.raggi.clinicnotector.service;

import com.raggi.clinicnotector.dto.ChordFretPositionDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Analyzes guitar chord fret positions and calculates chord names.
 * Ported from legacy Chord.java calculateName() algorithm.
 */
@Service
@Slf4j
public class ChordAnalysisService {

    // Standard guitar tuning (E A D G B E)
    private static final String[] STANDARD_TUNING = {"E", "A", "D", "G", "B", "E"};

    // All notes in chromatic scale (flat notation)
    private static final String[] ALL_NOTES = {
        "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"
    };

    // Chord interval numbers
    private static final String[] CHORD_NUMBERS = {
        "1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"
    };

    /**
     * Calculate chord name from fret positions.
     *
     * @param positions List of fret positions (string 1-6, fret 0-24)
     * @return Calculated chord name (e.g., "Cmaj7", "Am", "D7")
     */
    public String calculateChordName(List<ChordFretPositionDTO> positions) {
        if (positions == null || positions.isEmpty()) {
            return "";
        }

        // Convert fret positions to notes
        List<Note> notes = convertToNotes(positions);

        // Count unique notes
        int uniqueCount = countUniqueNotes(notes);

        if (uniqueCount < 1) {
            return "";
        } else if (uniqueCount < 3) {
            // Less than 3 unique notes - just return the base note
            Note baseNote = findBaseNote(notes);
            return baseNote != null ? baseNote.name : "";
        }

        // Calculate chord name using algorithm from Chord.java:178-224
        return analyzeChord(notes);
    }

    /**
     * Extract root note from chord name (e.g., "Cmaj7" -> "C", "C#m" -> "C#")
     */
    public String extractRootNote(String chordName) {
        if (chordName == null || chordName.isEmpty()) {
            return "C";
        }

        // Handle sharp/flat
        if (chordName.length() > 1 && (chordName.charAt(1) == '#' || chordName.charAt(1) == 'b')) {
            return chordName.substring(0, 2);
        }

        return chordName.substring(0, 1);
    }

    /**
     * Extract chord type from chord name (e.g., "Cmaj7" -> "maj7", "Am" -> "minor")
     */
    public String extractChordType(String chordName) {
        String rootNote = extractRootNote(chordName);
        String type = chordName.substring(rootNote.length());

        if (type.isEmpty() || type.equals("M")) {
            return "major";
        } else if (type.equals("m")) {
            return "minor";
        }

        return type;
    }

    // Internal helper classes and methods

    private static class Note {
        String name;
        int noteIndex;
        boolean empty;

        Note(String name, int noteIndex, boolean empty) {
            this.name = name;
            this.noteIndex = noteIndex;
            this.empty = empty;
        }
    }

    private List<Note> convertToNotes(List<ChordFretPositionDTO> positions) {
        List<Note> notes = new ArrayList<>();

        for (int string = 1; string <= 6; string++) {
            final int stringNum = string;
            Optional<ChordFretPositionDTO> posOpt = positions.stream()
                .filter(p -> p.getStringNumber().equals(stringNum))
                .findFirst();

            if (posOpt.isPresent()) {
                ChordFretPositionDTO pos = posOpt.get();
                if (pos.getFretNumber() >= 0) {
                    String noteName = calculateNoteName(string, pos.getFretNumber());
                    int noteIdx = getNoteIndex(noteName);
                    notes.add(new Note(noteName, noteIdx, false));
                } else {
                    notes.add(new Note("", -1, true)); // Muted string
                }
            } else {
                notes.add(new Note("", -1, true)); // String not defined
            }
        }

        return notes;
    }

    private String calculateNoteName(int string, int fret) {
        // Strings are numbered 1-6 (high E to low E)
        // Array is indexed 0-5 (low E to high E), so reverse
        int stringIndex = 6 - string;
        String openNote = STANDARD_TUNING[stringIndex];
        int openNoteIndex = getNoteIndex(openNote);
        int resultIndex = (openNoteIndex + fret) % 12;
        return ALL_NOTES[resultIndex];
    }

    private int getNoteIndex(String noteName) {
        for (int i = 0; i < ALL_NOTES.length; i++) {
            if (ALL_NOTES[i].equals(noteName)) {
                return i;
            }
        }
        return 0;
    }

    private int countUniqueNotes(List<Note> notes) {
        Set<String> uniqueNames = notes.stream()
            .filter(n -> !n.empty)
            .map(n -> n.name)
            .collect(Collectors.toSet());
        return uniqueNames.size();
    }

    private Note findBaseNote(List<Note> notes) {
        // Find the lowest (bass) note that isn't empty
        // In guitar, this is typically the lowest string that's played
        for (int i = notes.size() - 1; i >= 0; i--) {
            Note note = notes.get(i);
            if (!note.empty) {
                return note;
            }
        }
        return null;
    }

    private String analyzeChord(List<Note> notes) {
        Note base = findBaseNote(notes);
        if (base == null) {
            return "";
        }

        String name = base.name;

        // Calculate intervals from base note
        Map<String, Note> intervals = new HashMap<>();
        for (Note note : notes) {
            if (!note.empty) {
                String interval = calculateInterval(base, note);
                intervals.put(interval, note);
            }
        }

        // Apply chord detection rules (from Chord.java:188-221)

        // Diminished chords (b3, b5, no 3, no 5, no 7)
        if (intervals.containsKey("b3") && intervals.containsKey("b5") &&
            !intervals.containsKey("5") && !intervals.containsKey("3") && !intervals.containsKey("7")) {
            if (intervals.containsKey("6")) {
                return name + "dim7";
            } else if (intervals.containsKey("b7")) {
                return name + "m7b5";
            } else {
                return name + "dim";
            }
        }

        // Suspended chords
        if (intervals.containsKey("2") && !intervals.containsKey("b3") && !intervals.containsKey("3")) {
            return name + "sus2";
        }
        if (intervals.containsKey("4") && !intervals.containsKey("b3") && !intervals.containsKey("3")) {
            return name + "sus4";
        }

        // Major or minor base
        if (intervals.containsKey("b3")) {
            name = name + "m";
        }

        // Extensions and alterations
        if (intervals.containsKey("13")) {
            name = name + "13";
        } else if (intervals.containsKey("11")) {
            name = name + "11";
        } else if (intervals.containsKey("b9") && intervals.containsKey("b7")) {
            name = name + "7b9";
        } else if (intervals.containsKey("9")) {
            name = name + "9";
        } else if (intervals.containsKey("b7")) {
            name = name + "7";
        } else if (intervals.containsKey("7")) {
            name = name + "maj7";
        } else if (intervals.containsKey("6")) {
            name = name + "6";
        } else if (intervals.containsKey("b6")) {
            name = name + "b6";
        }

        return name;
    }

    private String calculateInterval(Note base, Note target) {
        if (target.empty) {
            return "";
        }

        int baseIndex = base.noteIndex;
        int targetIndex = target.noteIndex;

        // Handle octave wrapping
        if (baseIndex > targetIndex) {
            targetIndex += 12;
        }

        int semitones = (targetIndex - baseIndex) % 12;
        return CHORD_NUMBERS[semitones];
    }
}
