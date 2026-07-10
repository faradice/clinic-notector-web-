# Deploying Tóneyra to Render (permanent, always‑on hosting)

This gives you a **stable public URL** that runs 24/7 without your laptop — the
right setup for the pilot. It uses [Render](https://render.com), which reads the
`render.yaml` blueprint in this repo and creates everything for you.

Everything here is prepared. You need a Render account (I can't create one for you).

---

## What gets created
- **toneyra-db** — managed PostgreSQL (the app's database)
- **toneyra-api** — the Spring Boot backend (Docker); runs the Flyway migrations
  automatically on first boot, so the tables are created for you
- **toneyra-web** — the React/Vite frontend, built and served as a static site (HTTPS,
  so the microphone tools work)

## Steps

1. **Make sure the repo is pushed to GitHub** (it is: `faradice/clinic-notector-web-`).

2. **Create a Render account** at <https://render.com> — sign up with GitHub (free).

3. **New → Blueprint.** Connect this GitHub repo. Render detects `render.yaml` and
   lists the three resources above. Click **Apply**.

4. **Wait for the first deploy.** The backend Docker image takes ~5–8 min to build
   the first time; the frontend ~2 min; the database provisions in parallel.

5. **Check the URLs Render assigned.** In the dashboard you'll see two service URLs,
   ideally:
   - Frontend: `https://toneyra-web.onrender.com`
   - Backend:  `https://toneyra-api.onrender.com`

   If those exact names were taken, Render appends a suffix (e.g.
   `toneyra-web-xxxx.onrender.com`). **If so, fix two values:**
   - **toneyra-web → Environment →** `VITE_API_BASE_URL` = `https://<your-backend-url>/api`
   - **toneyra-api → Environment →** `CORS_ALLOWED_ORIGINS` = `https://<your-frontend-url>`

   Then redeploy both (Manual Deploy → Deploy latest commit). If the names came out
   as expected, no change is needed.

6. **Open the frontend URL.** That's your permanent Tóneyra. Send it to schools; it
   works from any device, always on. HTTPS is on, so the Tuner / Chord Detector /
   ear‑training all work.

---

## Good to know

- **The cloud database starts empty.** It's separate from the demo data on your
  laptop. Add chords / generate boards fresh in the cloud instance (or ask me to add
  a seed of common chords).
- **Free tier caveats** (fine for testing the setup, not for a live pilot):
  - Free web services **spin down after ~15 min idle** and take ~50s to wake — a bad
    first impression for someone you send the link to cold.
  - Free Postgres is **time‑limited**.
  - **For the pilot:** upgrade `toneyra-api` and `toneyra-db` to the cheapest paid
    tier (~$7/mo each) — always‑on, no cold starts, persistent data.
- **Custom domain** (e.g. `toneyra.is`) can be added later under the frontend
  service → Settings → Custom Domains.
- **Updates deploy themselves:** every push to `main` triggers a redeploy.

## If the blueprint needs tweaking
If Render flags anything in `render.yaml`, you can create the same three resources
by hand (New → PostgreSQL; New → Web Service from `backend/Dockerfile`; New → Static
Site from `frontend`, build `npm ci && npm run build`, publish `dist`) using the same
environment variables listed above. Ping me and I'll adjust the blueprint.
