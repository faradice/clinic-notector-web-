# Clinic Notector Music - Web Edition

A modern web-based music application suite converted from a 15-year-old Java Swing application. Features four main components for music education and composition.

## Components

1. **Player** - Song/lyrics viewer with chord annotations, auto-scrolling, and metronome
2. **Composer** - Workspace with draggable chord cards for composition
3. **ChordEditor** - Interactive guitar fretboard with automatic chord type detection
4. **Notector** - Pitch detection game using Web Audio API for ear training

## Technology Stack

### Backend
- Spring Boot 3.2 with Gradle
- PostgreSQL 15+ database
- JPA/Hibernate with Flyway migrations
- REST API with Jackson

### Frontend
- React 18 + TypeScript
- Vite build tool
- Zustand state management
- Tone.js (MIDI synthesis)
- Web Audio API (pitch detection)
- @dnd-kit/core (drag-drop)
- Tailwind CSS
- React Query (API integration)

## Project Structure

```
clinic-notector-web/
├── backend/          # Spring Boot application
├── frontend/         # React SPA
├── migration/        # One-time data migration CLI
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- Gradle (included via wrapper)

### Setup

1. **Start PostgreSQL database:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Start backend server:**
   ```bash
   cd backend
   ./gradlew bootRun
   ```
   Backend will run on http://localhost:8080

3. **Start frontend development server:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will run on http://localhost:5173

### Database

The application uses PostgreSQL with Flyway migrations. The schema includes:
- `songs` - Song metadata (name, lyrics, bpm, colors, fonts)
- `song_chord_positions` - Chord annotations on lyrics
- `chord_library` - Reusable chord definitions
- `chord_fret_positions` - Finger positions for chords
- `workspaces` - Composer workspaces
- `workspace_cards` - Cards in workspace
- `game_scores` - Notector game results
- `song_versions` - Backup history (JSONB)

Migrations run automatically on application startup.

### API Endpoints

Base URL: `http://localhost:8080/api`

#### Songs
- `GET /songs` - List all songs
- `GET /songs/{id}` - Get song by ID
- `GET /songs/name/{name}` - Get song by name
- `POST /songs` - Create new song
- `PUT /songs/{id}` - Update song
- `DELETE /songs/{id}` - Delete song

## Development

### Backend
```bash
cd backend
./gradlew build        # Build
./gradlew test         # Run tests
./gradlew bootRun      # Run application
```

### Frontend
```bash
cd frontend
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Lint code
```

## Phase 1 - Complete ✓

- [x] Monorepo structure
- [x] Spring Boot backend with Gradle
- [x] React frontend with Vite + TypeScript
- [x] Docker Compose with PostgreSQL
- [x] Flyway migration with database schema
- [x] Entity classes (Song, Chord, Workspace, etc.)
- [x] Repositories and mappers
- [x] SongController REST API
- [x] CORS configuration
- [x] Frontend API integration
- [x] Basic UI with Tailwind CSS

## Next Steps

- Phase 2: Data Migration CLI
- Phase 3: ChordEditor implementation
- Phase 4: Composer workspace
- Phase 5: Player with auto-scroll
- Phase 6: Notector pitch detection game

## License

Copyright © Ragnar Valdimarsson
