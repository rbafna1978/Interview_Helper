import Link from 'next/link';

const features = [
  {
    title: 'Real interview prompts',
    description: 'Pick from curated behavioral questions or paste your own to practice exactly what matters.',
  },
  {
    title: 'AI feedback that teaches',
    description: 'Get transcript, rubric-based scores, filler word stats, and concrete suggestions every run.',
  },
  {
    title: 'Keep progress in sync',
    description: 'Sign in with Supabase to store attempts securely, or practice locally as a guest.',
  },
];

const steps = [
  'Choose a question or add your own prompt.',
  'Record with your browser; no installs required.',
  'Review AI feedback and iterate until it feels sharp.',
];

export default function Home() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 mix-blend-soft-light">
        <div className="absolute -left-32 -top-44 h-72 w-72 rounded-full bg-sky-500/40 blur-3xl" />
        <div className="absolute -right-32 top-32 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl" />
      </div>

      <header className="relative z-10">
        <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Interview Coach
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/dashboard" className="hover:text-white">Practice</Link>
            <Link href="/auth" className="hover:text-white">Sign in</Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-sky-500 px-4 py-2 font-medium text-slate-950 shadow-lg shadow-sky-500/30 hover:bg-sky-400"
            >
              Start practising
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-24 px-4 pb-24 pt-10 sm:pt-20">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-sky-200">
              Behavioral interview coach
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Get confident, structured answers with AI-powered practice reps.
            </h1>
            <p className="max-w-xl text-base text-slate-300 sm:text-lg">
              Record answers in your browser, let Whisper transcribe everything locally, and apply targeted coaching
              to improve every pass. No upload delays, no guesswork, just actionable feedback.
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/dashboard"
                className="rounded-full bg-sky-500 px-5 py-2 font-medium text-slate-950 shadow-lg shadow-sky-500/30 hover:bg-sky-400"
              >
                Try the practice flow
              </Link>
              <Link
                href="/record"
                className="rounded-full border border-slate-700 px-5 py-2 font-medium text-slate-200 hover:border-slate-500 hover:text-white"
              >
                Record a quick demo
              </Link>
            </div>
            <ul className="flex flex-wrap gap-6 text-xs text-slate-400 sm:text-sm">
              <li className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-sky-300">
                  1
                </span>
                Designed for STAR answers
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-sky-300">
                  2
                </span>
                Local-first audio processing
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-sky-300">
                  3
                </span>
                Detailed scoring rubric
              </li>
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -translate-y-4 translate-x-4 rounded-3xl border border-slate-700/50 bg-slate-900/80 blur-xl" />
            <div className="relative rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 backdrop-blur">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                <span>Latest attempt</span>
                <span>Score 84</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-sm font-medium text-white">What is a project you are proud of?</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Confidence +18% since last run. Stronger impact statement and tighter conclusion.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {['Structure', 'Clarity', 'Concision', 'Confidence'].map((metric) => (
                    <div key={metric} className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                      <p className="text-slate-500">{metric}</p>
                      <p className="mt-1 text-lg font-semibold text-sky-300">{metric === 'Confidence' ? '4.5' : '4.2'}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">
                  &ldquo;Loved the quantifiable impact and reflection. Next time anchor the situation in under 20 seconds.&rdquo;
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          <h2 className="text-2xl font-semibold tracking-tight">Everything you need to interview with confidence</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
                <div className="mb-4 h-10 w-10 rounded-full bg-sky-500/20" />
                <h3 className="text-lg font-medium text-white">{feature.title}</h3>
                <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">How the practice loop works</h2>
            <p className="text-sm text-slate-300">
              The app is designed around fast reps. Record in the browser, score locally with the Whisper-powered
              transcriber, and sync the attempts you care about to Supabase when you are ready.
            </p>
            <Link href="/dashboard" className="inline-flex items-center text-sm font-semibold text-sky-300 hover:text-sky-200">
              Jump to the dashboard {'->'}
            </Link>
          </div>
          <ol className="space-y-4 text-sm text-slate-300">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-base font-semibold text-sky-300">
                  {index + 1}
                </span>
                <p className="self-center text-base text-slate-200">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <p className="text-sm text-slate-300">
              &ldquo;The feedback focuses on story structure, not just filler words. After a dozen runs I was answering with a
              clear STAR outline instinctively.&rdquo;
            </p>
          <p className="mt-4 text-sm font-semibold text-white">— Priya, Product Manager</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
          <p className="text-sm text-slate-300">
              &ldquo;Love that recordings never leave my machine until I want them to. The progress history helps me keep track
              of what I drilled each day.&rdquo;
          </p>
            <p className="mt-4 text-sm font-semibold text-white">— Marcus, Software Engineer</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-center">
          <h2 className="text-2xl font-semibold text-white">Ready for your next interview loop?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
            Spin up a practice session in under five minutes. Stay as a guest or connect Supabase to unlock synced
            history, collaborative feedback, and shared question sets.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            <Link
              href="/dashboard"
              className="rounded-full bg-sky-500 px-5 py-2 font-medium text-slate-950 shadow-lg shadow-sky-500/30 hover:bg-sky-400"
            >
              Launch the dashboard
            </Link>
            <Link
              href="/auth"
              className="rounded-full border border-slate-700 px-5 py-2 font-medium text-slate-200 hover:border-slate-500 hover:text-white"
            >
              Configure Supabase auth
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-slate-800/60 bg-slate-950/40">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Interview Coach. Built for practical interview prep.</span>
          <div className="flex gap-4">
            <Link href="/record" className="hover:text-slate-300">Recorder demo</Link>
            <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
            <a href="https://supabase.com" className="hover:text-slate-300" rel="noreferrer" target="_blank">
              Powered by Supabase
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
