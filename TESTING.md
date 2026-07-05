# Testing Guide

## Quick Test Options

### Option 1: Development Mode (Recommended for Testing)

**1. Start Database Only**
```bash
cd ~/clinic-notector-web
./deploy.sh dev
```

**2. Start Backend** (in new terminal)
```bash
cd ~/clinic-notector-web/backend
./gradlew bootRun
```
Wait for: `Started ClinicNotectorApplication in X seconds`

**3. Start Frontend** (in new terminal)
```bash
cd ~/clinic-notector-web/frontend
npm install  # first time only
npm run dev
```

**4. Open Browser**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api

---

### Option 2: Full Production Stack (Docker)

**Requires Docker Desktop to be running!**

```bash
cd ~/clinic-notector-web
./deploy.sh prod
```

Wait 30-60 seconds, then visit:
- **Frontend:** http://localhost
- **Backend:** http://localhost:8080/api
- **Health Check:** http://localhost:8080/api/actuator/health

---

## Testing Each Application

### 1. Chord Editor (Simplest - Start Here!)

**What to test:**
1. Click on fretboard to add notes
2. Double-click to cycle finger numbers (1→2→3→4)
3. Watch chord name auto-calculate (e.g., "A Major")
4. Click "Play Chord" - should hear guitar sound
5. Try "Undo" and "Redo"
6. Save chord to library

**Expected behavior:**
- SVG fretboard shows 6 strings × 12 frets
- Chord name updates immediately
- Tone.js plays notes

**Debug if broken:**
```bash
# Check backend logs
cd ~/clinic-notector-web/backend
./gradlew bootRun

# Check browser console (F12)
# Should see API calls to /api/chords/analyze
```

---

### 2. Player (Test Auto-Scroll)

**What to test:**
1. Click "Open" dropdown - should see migrated songs
2. Select a song (e.g., "Test1" or "saga2")
3. Adjust BPM (try 60, 120)
4. Click "Play" - lyrics should auto-scroll
5. Toggle metronome - should hear clicks
6. Test "Pause" and "Restart"

**Expected behavior:**
- Lyrics display with chords above words
- Smooth scrolling (no drift)
- Metronome in sync with scroll

**Test auto-scroll accuracy:**
```javascript
// In browser console (F12)
// Should scroll 1px per BPM milliseconds
// At 60 BPM = 1px per 60ms
```

---

### 3. Composer (Test Drag-Drop)

**What to test:**
1. Click "Load Chord Library"
2. Drag chords onto canvas
3. Move cards around
4. Multi-select: Ctrl+Click multiple cards
5. Right-click for context menu
6. Save workspace

**Expected behavior:**
- Smooth drag-drop
- Positions persist after refresh
- Can delete selected cards

**Debug drag-drop:**
```bash
# Check browser console
# Should see @dnd-kit events
# API calls to PATCH /api/workspaces/{id}/cards/batch
```

---

### 4. Notector Game (Test Pitch Detection)

**Requires microphone permission!**

**What to test:**
1. Click "Allow" when browser asks for microphone
2. Set BPM: 60, Repeats: 3
3. Click "Start Game"
4. Sing/play notes as they appear on staff
5. Watch score counter

**Expected behavior:**
- Microphone captures audio
- Pitch detection shows current note
- Target note highlighted on staff
- Correct matches increase score

**Debug pitch detection:**
```javascript
// Browser console should show:
// "Detected: C4 (261.63 Hz)"
// "Target: D4 (293.66 Hz)"
```

**If pitch detection not working:**
- Check microphone permissions in browser settings
- Try humming louder (needs clear pitch)
- Frequency range: 165-800 Hz

---

## API Testing (Without Frontend)

### Test Backend Directly

**1. Health Check**
```bash
curl http://localhost:8080/api/actuator/health
```
Expected: `{"status":"UP"}`

**2. List Songs**
```bash
curl http://localhost:8080/api/songs
```
Expected: JSON array of songs

**3. Analyze Chord**
```bash
curl -X POST http://localhost:8080/api/chords/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "positions": [
      {"string": 1, "fret": 0, "finger": 0, "isBase": true},
      {"string": 2, "fret": 2, "finger": 2, "isBase": false},
      {"string": 3, "fret": 2, "finger": 3, "isBase": false},
      {"string": 4, "fret": 2, "finger": 4, "isBase": false},
      {"string": 5, "fret": 0, "finger": 0, "isBase": false}
    ]
  }'
```
Expected: `{"chordName": "E Major"}`

**4. List Workspaces**
```bash
curl http://localhost:8080/api/workspaces
```

---

## Database Testing

### Check Migration Success

**1. Connect to Database**
```bash
# If using Docker
docker exec -it clinic-notector-db psql -U clinic_user -d clinic_notector

# If using local PostgreSQL
psql -U clinic_user -d clinic_notector
```

**2. Run Queries**
```sql
-- Count songs
SELECT COUNT(*) FROM songs;

-- List song names
SELECT id, name, bpm FROM songs LIMIT 10;

-- Count chords in library
SELECT COUNT(*) FROM chord_library;

-- See chord positions for a song
SELECT sp.line, sp.word, sp.chord_name, sp.offset
FROM song_chord_positions sp
JOIN songs s ON sp.song_id = s.id
WHERE s.name = 'Test1'
ORDER BY sp.line, sp.word;

-- Check Flyway migrations
SELECT * FROM flyway_schema_history;
```

**Expected Results:**
- Songs: 157+ rows (from migration)
- Chords: 100+ rows
- All Icelandic characters (Á, á, Ó, etc.) display correctly

---

## Performance Testing

### Test Auto-Scroll Drift

```bash
# Set BPM to 60, let run for 10 minutes
# Scroll should stay perfectly in sync
# No accumulated drift
```

### Test Drag Performance

```bash
# Add 50+ chord cards to composer
# Drag should remain smooth
# No lag
```

### Test Pitch Detection Latency

```bash
# Sing note, watch staff
# Should detect within 100-200ms
```

---

## Common Issues

### Backend Won't Start

```bash
# Check Java version
java -version  # Should be 17+

# Check PostgreSQL
docker ps | grep clinic-notector-db

# Check logs
cd backend
./gradlew bootRun --info
```

### Frontend Build Fails

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps

# Restart database
./deploy.sh stop
./deploy.sh dev
```

### Chord Detection Wrong

```bash
# Compare with Java version
# Check ChordAnalysisService.java
# Algorithm should match Chord.java:178-224
```

### Audio Not Working

- Check browser audio permissions
- Try different browser (Chrome recommended)
- Check system audio output
- Tone.js requires user interaction to start

---

## Automated Tests

### Run Backend Tests

```bash
cd ~/clinic-notector-web/backend
./gradlew test
```

### Run Frontend Tests (if added)

```bash
cd ~/clinic-notector-web/frontend
npm test
```

---

## Quick Smoke Test (5 Minutes)

```bash
# 1. Start dev environment
./deploy.sh dev
cd backend && ./gradlew bootRun &
cd ../frontend && npm run dev &

# 2. Wait 30 seconds

# 3. Test endpoints
curl http://localhost:8080/api/actuator/health
curl http://localhost:8080/api/songs | head

# 4. Open browser
open http://localhost:5173

# 5. Click through all 4 tabs
# - Chord Editor: Add note, see chord name
# - Player: Select song, click play
# - Composer: Drag a card
# - Notector: Allow mic, start game
```

If all 5 steps work → ✅ Application is healthy!

---

## Next Steps After Testing

1. **Everything works?** → Push to GitHub and deploy
2. **Found bugs?** → Check logs, fix issues
3. **Want to add features?** → See IMPLEMENTATION_STATUS.md for ideas
4. **Ready to deploy?** → See DEPLOYMENT.md

## Questions?

Check the documentation:
- **QUICKSTART.md** - Basic setup
- **DEPLOYMENT.md** - Production deployment
- **README.md** - Project overview
- **PHASE{2-6}_SUMMARY.md** - Detailed implementation notes
