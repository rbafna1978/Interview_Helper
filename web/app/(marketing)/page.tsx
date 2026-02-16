import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/layout/PageContainer';

const features = [
  {
    title: 'Rubric-based scoring',
    description: 'Structure, clarity, relevance, and confidence are measured on every attempt — not vibes.',
  },
  {
    title: 'Real interview modes',
    description: 'Behavioral, technical, and system design prompts pulled from real interview question banks.',
  },
  {
    title: 'Live transcript',
    description: 'See your words appear in real time as you speak. No upload. No waiting.',
  },
  {
    title: 'Progress over time',
    description: 'Each attempt is compared to your history so you can see exactly what improved.',
  },
];

export default function MarketingHome() {
  return (
    <PageContainer className="space-y-24 pb-20">
      {/* Hero */}
      <section className="relative mt-12 text-center lg:mt-20">
        {/* Soft background blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[-4rem] mx-auto h-96 w-full max-w-2xl rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(ellipse, var(--accent) 0%, transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-3xl space-y-8">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-[color:var(--text)] sm:text-7xl">
            Practice like it&apos;s real.<br />Perform like you&apos;re ready.
          </h1>
          <p className="mx-auto max-w-xl text-xl leading-relaxed text-[color:var(--text-muted)]">
            Record a 2-minute answer, get instant feedback on structure, clarity, and delivery.
            No Python service. No upload delays. Just you and the question.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="h-12 px-8 text-base">
              <Link href="/question/challenge-star">Start practicing now</Link>
            </Button>
            <Button asChild variant="secondary" className="h-12 px-8 text-base">
              <Link href="/sessions/new">Browse sessions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl font-bold text-[color:var(--text)] sm:text-4xl">Three steps to better answers</h2>
          <p className="text-[color:var(--text-muted)]">Simple loop. Real improvement.</p>
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          {[
            { num: '1', title: 'Pick a prompt', body: 'Choose from behavioral, technical, or system design questions — or use your own.' },
            { num: '2', title: 'Answer out loud', body: 'Speak naturally. Your words appear live on screen as you talk.' },
            { num: '3', title: 'Get your score', body: 'Instant feedback on STAR structure, filler words, pacing, and impact.' },
          ].map((step) => (
            <div key={step.num} className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--accent)] text-xl font-bold text-white shadow-md">
                {step.num}
              </div>
              <h3 className="font-serif text-lg font-semibold text-[color:var(--text)]">{step.title}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--text-muted)]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Practice modes */}
      <section className="mx-auto max-w-5xl space-y-8">
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl font-bold text-[color:var(--text)]">Choose your mode</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col items-start gap-4 p-7 transition hover:border-[color:var(--accent)]/50">
            <div className="rounded-xl bg-[color:var(--surface-muted)] p-3 text-3xl">🎤</div>
            <h3 className="font-serif text-xl font-semibold text-[color:var(--text)]">Behavioral</h3>
            <p className="text-sm leading-relaxed text-[color:var(--text-muted)]">Perfect your STAR stories. Refine your &ldquo;Tell me about a time&hellip;&rdquo; answers until they land.</p>
            <Button asChild variant="secondary" className="mt-auto w-full">
              <Link href="/sessions/new?mode=behavioral">Start behavioral</Link>
            </Button>
          </Card>

          <Card className="flex flex-col items-start gap-4 p-7 transition hover:border-[color:var(--accent)]/50">
            <div className="rounded-xl bg-[color:var(--surface-muted)] p-3 text-3xl">💻</div>
            <h3 className="font-serif text-xl font-semibold text-[color:var(--text)]">Technical</h3>
            <p className="text-sm leading-relaxed text-[color:var(--text-muted)]">Explain systems, algorithms, and trade-offs clearly under pressure. Out loud, not on paper.</p>
            <Button asChild variant="secondary" className="mt-auto w-full">
              <Link href="/sessions/new?mode=technical">Start technical</Link>
            </Button>
          </Card>

          <Card className="flex flex-col items-start gap-4 p-7 transition hover:border-[color:var(--accent)]/50">
            <div className="rounded-xl bg-[color:var(--surface-muted)] p-3 text-3xl">⚡️</div>
            <h3 className="font-serif text-xl font-semibold text-[color:var(--text)]">Freestyle</h3>
            <p className="text-sm leading-relaxed text-[color:var(--text-muted)]">Bring your own question. Record any answer and get objective scoring on the spot.</p>
            <Button asChild variant="secondary" className="mt-auto w-full">
              <Link href="/record">Go freestyle</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="mx-auto max-w-6xl space-y-10 rounded-3xl bg-[color:var(--surface-muted)]/60 p-8 sm:p-16">
        <div className="text-center space-y-3">
          <h2 className="font-serif text-3xl font-bold text-[color:var(--text)] sm:text-4xl">Why it works</h2>
          <p className="mx-auto max-w-xl text-[color:var(--text-muted)]">
            Most prep is passive — reading, watching, nodding. This makes it active.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((item) => (
            <div key={item.title} className="space-y-2 rounded-2xl bg-[color:var(--surface)] p-6 shadow-sm ring-1 ring-[color:var(--border)]">
              <h3 className="font-serif text-lg font-semibold text-[color:var(--text)]">{item.title}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--text-muted)]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-2xl space-y-6 border-t border-[color:var(--border)] pt-12 text-center">
        <h2 className="font-serif text-3xl font-bold text-[color:var(--text)]">Ready for your next rep?</h2>
        <p className="text-[color:var(--text-muted)]">Free to use. No account required to start.</p>
        <Button asChild className="h-12 px-10 text-base">
          <Link href="/question/challenge-star">Try a question now</Link>
        </Button>
      </section>
    </PageContainer>
  );
}
