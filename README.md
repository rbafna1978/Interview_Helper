# Interview Coach AI

A full-stack practice environment for behavioral interview prep. The project pairs a polished Next.js web app with a FastAPI transcription/scoring service so candidates can record answers, receive AI feedback, and keep progress locally with optional email-based login.

## Apps

- **web/** – Next.js 15 front end with guest mode, in-browser recording, and attempt history powered by Prisma (SQLite) + NextAuth email OTP login.
- **transcriber/** – FastAPI service that wraps `faster-whisper` and a lightweight scoring engine used by the browser client.

## Features

- Modern landing page and dashboard tuned for interview drills.
- Local-first recorder with selectable audio formats and live playback.
- AI summaries, rubric scores, and trend comparisons for each attempt.
- Guest mode with browser storage plus local-first auth/OTP syncing.

## Getting Started

Clone the repo and install dependencies for both apps.

```bash
# root
npm install         # installs shared lint tooling (if any)

# web app
cd web
npm install

# transcriber API
cd ../transcriber
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Copy `web/.env.example` twice: once to `web/.env.local` (Next.js runtime) and once to `web/.env` (Prisma CLI only reads this file). Set at minimum:

- `NEXTAUTH_SECRET` – 32-byte random string.
- `DATABASE_URL` – defaults to `file:./dev.db` (SQLite).
- `NEXT_PUBLIC_TRANSCRIBE_URL` – FastAPI URL (default `http://127.0.0.1:8000`).
- Optional: `SEED_SECRET` if you want to protect the `/api/admin/seed` endpoint outside local dev.

> Prisma CLI commands (`prisma migrate`, `prisma generate`, etc.) read only from `.env`, so make sure `DATABASE_URL` is defined there even if you keep other secrets in `.env.local`.

```
NEXT_PUBLIC_TRANSCRIBE_URL=http://127.0.0.1:8000
```

For cross-origin calls in production, add your frontend domain to the transcriber service via the `ALLOWED_ORIGINS` environment variable (comma-separated). Defaults cover localhost only. Email OTP login prints codes to the console in development; wire up SMTP via the env vars when you’re ready to send real emails.

Apply database migrations + seed the question bank:

```bash
cd web
npx prisma migrate dev --name init
npm run db:seed
```

Run both services locally:

```bash
# In /web
npm run dev

# In /transcriber (with virtualenv activated)
uvicorn main:app --host 0.0.0.0 --port 8000
```

Visit http://localhost:3000 to practice. Use the `/auth` page to request a magic code (check the dev server console for the OTP) and sign in. Guest mode remains available if you skip auth. The dashboard shows a “Seed default questions” button if the DB is empty (dev only).

### Auth Smoke Test

1. Start the dev server (`npm run dev`) and watch the terminal.
2. Open http://localhost:3000/auth, enter your email, click “Email me a code”.
3. Copy the 6-digit code from the terminal log (`[OTP] user@example.com -> 123456 ...`).
4. Paste the code, click “Verify & sign in”. You should land on `/dashboard` with `useSession()` reporting your user.
5. (Optional) Click “Claim my guest history” to merge existing guest sessions via `/api/auth/claim-guest`.

## Transcriber API

Environment variables:

- `WHISPER_MODEL` (default `base`)
- `WHISPER_DEVICE` (default `cpu`)
- `WHISPER_COMPUTE_TYPE` (default `int8`)
- `ALLOWED_ORIGINS` – optional, comma-separated list of allowed browser origins (e.g. `https://your-app.vercel.app,http://localhost:3000`).
- `ALLOWED_ORIGIN_REGEX` – optional regex if you want to allow multiple preview domains (e.g. `https://interview-helper-.*\\.vercel\\.app`).

The endpoint exposes:

- `GET /health` – status check.
- `POST /transcribe` – accepts an audio file and returns transcript, language, scores, and suggestions.

## Deployment Overview

1. Deploy the FastAPI service (e.g. Render web service using `uvicorn main:app --host 0.0.0.0 --port 10000`). Note the public URL and set it as `NEXT_PUBLIC_TRANSCRIBE_URL` for the front end.
2. Push this repo to GitHub.
3. Import the project into Vercel, set the root directory to `web`, and add the three environment variables above.
4. Trigger the build; once live, verify `/auth` email OTP sign-in, record an attempt, and confirm the FastAPI transcription is reachable from the browser.

## Troubleshooting: Prisma Sandbox(Signal(6))

If `npx prisma migrate dev` or `npm install` dies with `Sandbox(Signal(6))`, capture diagnostics first:

```bash
node -v
npm -v
npx prisma -v
npx prisma generate --schema web/prisma/schema.prisma
DEBUG=\"prisma:*\" npx prisma migrate dev --name init
```

Common causes + fixes:

- **Prisma engines failed to download** (air-gapped, flaky cache). Fix: clear node_modules + cache, reinstall.
- **Node 22 + Rosetta** on Apple Silicon sometimes needs Rosetta-enabled terminal. Ensure you’re on the latest Prisma.
- **Corrupted cache** – remove `node_modules`, `package-lock.json`, and rerun `npm install`.
- **Permission issues** – verify repo path is writable, especially for SQLite `web/dev.db`.

Recovery commands:

```bash
cd web
rm -rf node_modules package-lock.json prisma/dev.db
npm cache verify
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

If you still see `Sandbox(Signal(6))`, run `DEBUG="*"` with the failing command and attach the log in issues. On macOS ensure `node` isn’t the system-provided binary; use `nvm` or `fnm` to switch to Node 22.18.0 (matching CI). Finally, confirm Rosetta is installed (`softwareupdate --install-rosetta`) if you run Intel binaries on Apple Silicon.

## Repo Structure

```
.
├── README.md              # this file
├── web/                   # Next.js app
│   ├── app/
│   ├── components/
│   └── ...
└── transcriber/           # FastAPI + faster-whisper service
    ├── main.py
    └── scoring.py
```

## Contributing

- `npm run lint` inside `web` keeps the UI code tidy.
- For the API, format with your preferred Python formatter and extend `requirements.txt` when introducing new libraries.

Happy practicing!

codex resume 019beeba-b9c6-7121-8079-9df94b105ed2
