# Interview Coach AI

A full-stack practice environment for behavioral interview prep. The project pairs a polished Next.js web app with a FastAPI transcription/scoring service so candidates can record answers, receive AI feedback, and (optionally) sync progress through Supabase.

## Apps

- **web/** – Next.js 15 front end with guest mode, email magic-link auth via Supabase, in-browser recording, and attempt history.
- **transcriber/** – FastAPI service that wraps `faster-whisper` and a lightweight scoring engine used by the browser client.

## Features

- Modern landing page and dashboard tuned for interview drills.
- Local-first recorder with selectable audio formats and live playback.
- AI summaries, rubric scores, and trend comparisons for each attempt.
- Guest mode with browser storage plus optional Supabase sync.
- Supabase schema (questions, attempts, profiles) including RLS policies and auto-profile trigger.

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

Create `web/.env.local` with your configuration:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_TRANSCRIBE_URL=http://127.0.0.1:8000
```

Run both services locally:

```bash
# In /web
npm run dev

# In /transcriber (with virtualenv activated)
uvicorn main:app --host 0.0.0.0 --port 8000
```

Visit http://localhost:3000 to practice.

## Supabase Setup

1. Create a new project in Supabase and note the project URL + anon key for the env file.
2. Run the schema + seed + trigger script inside the SQL editor:
   - tables: `profiles`, `questions`, `attempts`
   - row level security policies for each table
   - auto-profile trigger
3. Enable **Email (magic link)** under Authentication → Providers.
4. When hosting the front end, add your production domain to the Supabase allowed redirect URLs.

## Transcriber API

Environment variables:

- `WHISPER_MODEL` (default `base`)
- `WHISPER_DEVICE` (default `cpu`)
- `WHISPER_COMPUTE_TYPE` (default `int8`)

The endpoint exposes:

- `GET /health` – status check.
- `POST /transcribe` – accepts an audio file and returns transcript, language, scores, and suggestions.

## Deployment Overview

1. Deploy the FastAPI service (e.g. Render web service using `uvicorn main:app --host 0.0.0.0 --port 10000`). Note the public URL and set it as `NEXT_PUBLIC_TRANSCRIBE_URL` for the front end.
2. Push this repo to GitHub.
3. Import the project into Vercel, set the root directory to `web`, and add the three environment variables above.
4. Trigger the build; once live, verify `/auth` email sign-in, record an attempt, and confirm rows land in Supabase (`attempts` + `profiles`).

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
