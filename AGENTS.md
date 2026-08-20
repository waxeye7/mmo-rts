# AGENTS.md

## Cursor Cloud specific instructions

This is an MMO-RTS browser game. It has two runnable services plus a MongoDB database:

- **Backend** — Node.js/Express/Socket.IO API and hourly game loop (`server/index.js`). Entry scripts: `npm run dev` (nodemon, hot reload) or `npm start`. Reads config from env (and `dotenv`/`.env` if present).
- **Frontend** — Vue 3 SPA served by Vue CLI (`npm run serve`, port `8088` per `vue.config.js`). Lint via `npm run lint`.
- **MongoDB** — game state store. Not a project dependency; installed at the OS level (MongoDB 8.0, `mongod`).

### Database (MongoDB)

`mongod` is installed but there is no systemd in this VM, so start it manually and leave it running:

```
mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017
```

The data dir `/data/db` is created during setup. The backend defaults to `mongodb://127.0.0.1:27017/mmo-rts`.

### Backend

`server/index.js` requires `AUTH_SECRET_KEY` (used to sign/verify JWTs — login/signup crash without it). Useful env vars: `MONGODB_URI`, `PORT` (default `3000`), `HOST` (default `0.0.0.0`), `CLIENT_ORIGIN` (CORS allow-origin; default `http://localhost:8080` in dev). Start it with explicit env, e.g.:

```
AUTH_SECRET_KEY=dev-local-secret CLIENT_ORIGIN=http://localhost:8088 PORT=3000 npm run dev
```

Non-obvious gotchas:
- Do NOT create a repo-root `.env` with a `PORT` key: Vue CLI also loads `.env`, so `PORT` there hijacks the frontend dev-server port (it silently shifts to `3001`) and can break CORS origin matching. Pass backend env inline (as above) or use a shell/`.env` that the frontend does not read.
- Turns are processed by an hourly cron (`0 * * * *`); there is no per-second tick, so game-loop effects appear on the hour, not immediately.

### Frontend

By default `vue.config.js` proxies `/auth`, `/users`, `/public`, `/socket.io` to the live production server `https://mmo.marlyman123.com` (so the SPA can run standalone). To run a fully local full stack against the local backend instead, bypass the proxy by pointing the client at the backend and matching CORS:

```
VUE_APP_API_URL=http://localhost:3000 npm run serve   # backend started with CLIENT_ORIGIN=http://localhost:8088
```

Then open `http://localhost:8088` (use `localhost`, not `127.0.0.1`, so the browser `Origin` matches `CLIENT_ORIGIN`). The client reads `process.env.VUE_APP_API_URL` (empty = same-origin + proxy).

### Lint / Test / Build

- Lint: `npm run lint`. NOTE: `src/getDirectionToCell.js` has 3 pre-existing `no-unused-vars` errors (empty stub); unrelated to environment setup.
- Build (production): `npm run build`.
- Automated tests: `tests/public-state.test.js` is currently NOT runnable — it `require("./helpers")` but `tests/helpers.js` has never been committed to the repo (confirmed via git history). This is a repo gap, not an environment issue; the test needs that helper module before it can run with `node tests/public-state.test.js`.

### Hello-world sanity check (no browser)

```
curl -s -X POST http://127.0.0.1:3000/auth/signup -H 'Content-Type: application/json' -H 'Origin: http://localhost:8088' \
  -d '{"username":"u1","password":"p1","identifier":{"backgroundColor":"#123","shape":"circle","fillColor":"#abc"}}'
curl -s http://127.0.0.1:3000/public/state   # board + players + nextTick
```
