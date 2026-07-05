package com.raggi.migration.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Converts java.awt.Color string representations to hex color codes.
 * Handles formats like: "java.awt.Color[r=245,g=245,b=245]"
 */
public class ColorParser {

    private static final Pattern COLOR_PATTERN =
        Pattern.compile(".*\\[r=(\\d+),g=(\\d+),b=(\\d+)\\].*");

    /**
     * Parse a Java Color string to hex format.
     *
     * @param colorString Input like "java.awt.Color[r=245,g=245,b=245]"
     * @return Hex color like "#F5F5F5" or null if parsing fails
     */
    public static String parseToHex(String colorString) {
        if (colorString == null || colorString.trim().isEmpty()) {
            return null;
        }

        Matcher matcher = COLOR_PATTERN.matcher(colorString);
        if (matcher.matches()) {
            int r = Integer.parseInt(matcher.group(1));
            int g = Integer.parseInt(matcher.group(2));
            int b = Integer.parseInt(matcher.group(3));

            return String.format("#%02X%02X%02X", r, g, b);
        }

        // If already in hex format, return as-is
        if (colorString.matches("#[0-9A-Fa-f]{6}")) {
            return colorString.toUpperCase();
        }

        return null;
    }

    /**
     * Parse RGB values to hex format.
     */
    public static String rgbToHex(int r, int g, int b) {
        return String.format("#%02X%02X%02X", r, g, b);
    }
}
