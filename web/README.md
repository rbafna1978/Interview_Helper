# Interview Coach Web

A polished Next.js application for recording behavioural interview answers, running local AI transcription, and capturing practice history with optional Supabase sync.

## Features
- Modern marketing landing page with clear calls to action and product storytelling.
- In-browser recorder with local-first processing and configurable audio formats.
- Guided dashboard of behavioural prompts plus freestyle practice mode.
- Guest mode with browser storage and optional Supabase authentication/history sync.
- Adaptive scoring that compares the current attempt with recent history to highlight improvements and lingering gaps.
- Responsive dark theme tuned for production use.

## Prerequisites
- Node.js 18+
- Dependencies installed via `npm install`
- (Optional) Supabase project for auth + attempt storage
- Local transcriber API (default expected at `http://127.0.0.1:8000`)

## Environment Variables
Configure the following variables in `.env.local` (or through your hosting provider):

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_TRANSCRIBE_URL=http://127.0.0.1:8000
```

If the Supabase variables are omitted the app gracefully falls back to guest-only mode. Update `NEXT_PUBLIC_TRANSCRIBE_URL` when hosting the transcription service elsewhere.

## Local Development
```bash
npm install
npm run dev
```
Visit http://localhost:3000 to explore the app.

## Quality Checks
```bash
npm run lint
```

## Production Build
```bash
npm run build
npm run start
```

## Deployment
- **Frontend:** The project is ready for one-click deployment on Vercel (free tier). Add the environment variables above in the Vercel dashboard.
- **Auth & Storage:** Use Supabase's free tier and create an `attempts` table matching the schema in your migrations/service backend.
- **Transcriber API:** Host your FastAPI/Whisper service on a free Render or Fly.io instance, then update `NEXT_PUBLIC_TRANSCRIBE_URL` to the deployed URL.

## Folder Structure Highlights
- `app/` – Next.js App Router pages (landing, dashboard, auth, record, question flow)
- `components/` – Shared UI such as the recorder, attempt cards, and session banner
- `lib/` – Supabase client and shared types/helpers
