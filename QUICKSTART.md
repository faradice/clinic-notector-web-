# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✓ Java 17+ installed (`java -version`)
- ✓ Node.js 18+ installed (`node -v`)
- ✓ Docker Desktop running (`docker ps`)

## Step-by-Step Startup

### 1. Start the Database

```bash
cd ~/clinic-notector-web
docker compose up -d postgres
```

Verify it's running:
```bash
docker compose ps
# Should show clinic-notector-db as "running"
```

Wait for the database to be ready (about 10 seconds), then check health:
```bash
docker compose logs postgres | tail -20
# Should see "database system is ready to accept connections"
```

### 2. Start the Backend

Open a new terminal:
```bash
cd ~/clinic-notector-web/backend
./gradlew bootRun
```

Wait for Spring Boot to start. You should see:
```
Started ClinicNotectorApplication in X seconds
```

The backend is now running at http://localhost:8080

### 3. Test the Backend (Optional)

Open another terminal to test the API:
```bash
# Create a test song
curl -X POST http://localhost:8080/api/songs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Song",
    "lyrics": "This is a test\nWith multiple lines",
    "bpm": 120,
    "backgroundColor": "#FFFFFF",
    "textColor": "#000000"
  }'

# Get all songs
curl http://localhost:8080/api/songs | jq

# Get by name
curl http://localhost:8080/api/songs/name/Test%20Song | jq
```

### 4. Start the Frontend

Open a new terminal:
```bash
cd ~/clinic-notector-web/frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 5. Open in Browser

Navigate to http://localhost:5173

You should see:
- "Clinic Notector Music" heading
- "Load Songs" button
- Click the button to fetch songs from the backend

## Troubleshooting

### Docker Issues

If Docker won't start:
1. Open Docker Desktop application
2. Wait for it to fully start
3. Try `docker ps` again

### Port Already in Use

If port 8080 or 5173 is already in use:

**Backend (8080):**
Find and kill the process:
```bash
lsof -ti:8080 | xargs kill -9
```

**Frontend (5173):**
Vite will automatically try the next available port (5174, 5175, etc.)

### Database Connection Failed

If backend can't connect to database:
1. Check Docker is running: `docker compose ps`
2. Check database logs: `docker compose logs postgres`
3. Restart database: `docker compose restart postgres`
4. Wait 10 seconds and try backend again

### Gradle Build Failed

If you see Gradle errors:
```bash
cd backend
./gradlew clean build --refresh-dependencies
```

### Frontend Build Failed

If npm has issues:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Stopping Everything

To stop all services:

```bash
# Stop frontend (Ctrl+C in its terminal)
# Stop backend (Ctrl+C in its terminal)

# Stop and remove database
cd ~/clinic-notector-web
docker compose down

# To also remove database data:
docker compose down -v
```

## Development Workflow

1. **Backend changes:**
   - Edit Java files
   - Spring Boot DevTools will auto-reload
   - Or restart: Ctrl+C and `./gradlew bootRun`

2. **Frontend changes:**
   - Edit .tsx/.ts files
   - Vite HMR will instantly update browser
   - No restart needed

3. **Database schema changes:**
   - Create new migration: `V002__description.sql`
   - Place in `backend/src/main/resources/db/migration/`
   - Restart backend to apply

## What's Next?

After Phase 1 is running:
- ✅ You have a working full-stack application
- ✅ Database with proper schema
- ✅ REST API for songs
- ✅ React frontend with API integration

Next: **Phase 2 - Data Migration**
- Import your 157 existing song/chord files
- See IMPLEMENTATION_STATUS.md for details

## Need Help?

Check the main README.md for:
- Detailed API documentation
- Architecture overview
- Complete implementation plan
