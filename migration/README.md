# Data Migration Tool

Standalone CLI tool to migrate legacy Clinic Notector Music data files to PostgreSQL.

## What It Does

Migrates 157+ data files from the Java Swing application:
- ✓ Song lyrics (.txt files) with ISO-8859-1 encoding
- ✓ Song metadata (.properties files) with BPM, colors, fonts
- ✓ Chord positions (.chords files)
- ✓ Chord library (.chord files) with fret positions
- ✓ Color conversion (java.awt.Color → hex)
- ✓ Deduplication (skips existing songs/chords)

## Prerequisites

1. PostgreSQL database running
2. Backend schema initialized (Flyway migrations applied)
3. Source files accessible at default path or custom path

## Usage

### Quick Start

```bash
cd migration
./gradlew bootRun
```

This will migrate files from the default location:
```
/Users/ragnarvaldimarsson/Clinic_Notector_Music/guitar
```

### Custom Source Directory

```bash
./gradlew bootRun --args="--SOURCE_DIR=/path/to/your/files"
```

### Configuration

Edit `src/main/resources/application.yml`:

```yaml
migration:
  source-directory: /Users/ragnarvaldimarsson/Clinic_Notector_Music/guitar
  encoding: ISO-8859-1
  skip-duplicates: true

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/clinic_notector
    username: clinic_user
    password: clinic_pass
```

## File Format

### Song Directory Structure
```
Test1/
├── Test1.txt           # Lyrics (ISO-8859-1 encoded)
├── Test1.properties    # Metadata (BPM, colors, fonts)
├── Test1.chords        # Chord positions (optional)
└── Test1.wav           # Audio (ignored)
```

### .txt (Lyrics)
```
Sigga sá hund. Hann var með lafandi tungu.
Ari vinur Siggu vildi klappa hundinum
```

### .properties (Metadata)
```properties
BPM=90
BackGround=java.awt.Color[r=0,g=0,b=0]
ForeGround=java.awt.Color[r=255,g=255,b=255]
Font=Arial
FontSize=14
```

### .chords (Chord Positions)
```
Am 0 2 1
D7 1 3 0
```
Format: `chordName lineNumber wordNumber charOffset`

### .chord (Chord Library)
```
Cmaj7
x
3 2
0
0
1 1
x
```
6 lines for 6 strings: either "x" (muted) or "fret finger"

## Output

Migration logs show progress:
```
Starting migration from: /Users/ragnarvaldimarsson/Clinic_Notector_Music/guitar
Migrating chord library...
Found 47 chord files
Migrated 10 chords...
Migrated 20 chords...
Chord library migration complete: 47 migrated, 0 skipped

Migrating songs...
Found 157 song directories
Migrated 10 songs...
Migrated 50 songs...
Song migration complete: 157 migrated, 0 skipped

Migration complete!
Total chords migrated: 47
Total songs in database: 157
```

## Verification

After migration, verify with SQL:
```sql
-- Check song count
SELECT COUNT(*) FROM songs;

-- Check songs with Icelandic characters
SELECT name, lyrics FROM songs WHERE lyrics LIKE '%á%' OR lyrics LIKE '%ð%';

-- Check chord library
SELECT COUNT(*) FROM chord_library;

-- Check a specific song
SELECT * FROM songs WHERE name = 'Test1';

-- Check chord positions for a song
SELECT s.name, scp.chord_name, scp.line_number, scp.word_number
FROM songs s
JOIN song_chord_positions scp ON s.id = scp.song_id
WHERE s.name = 'Test1';
```

## Troubleshooting

### Database Connection Failed
- Ensure PostgreSQL is running: `docker compose ps`
- Check credentials in application.yml
- Verify database exists: `clinic_notector`

### Encoding Issues (Icelandic Characters)
- All files are read with ISO-8859-1 encoding
- Verify source files contain: á, é, í, ó, ú, ý, þ, æ, ö, ð
- Check database uses UTF-8 encoding

### Duplicate Errors
- Set `skip-duplicates: true` in config
- Or manually clear database:
  ```sql
  TRUNCATE TABLE song_chord_positions CASCADE;
  TRUNCATE TABLE chord_fret_positions CASCADE;
  TRUNCATE TABLE songs CASCADE;
  TRUNCATE TABLE chord_library CASCADE;
  ```

### Source Directory Not Found
- Check path exists
- Use absolute path
- Verify permissions (read access required)

## Build JAR

To create standalone executable:
```bash
./gradlew bootJar
```

Run JAR:
```bash
java -jar build/libs/clinic-notector-migration.jar \
  --SOURCE_DIR=/path/to/files
```

## Testing Individual Files

To test parsing without database:
1. Add test cases in `src/test/java`
2. Run: `./gradlew test`

## Next Steps After Migration

1. Verify song count matches expectation (157)
2. Test special characters in frontend
3. Check chord library completeness
4. Proceed to Phase 3: ChordEditor implementation
