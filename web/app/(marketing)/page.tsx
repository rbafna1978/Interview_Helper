import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/layout/PageContainer';

const highlights = [
  {
    title: 'Rubric-based scoring',
    description: 'Structure, clarity, relevance, and confidence are measured on every attempt.',
  },
  {
    title: 'Video Confidence Analysis',
    description: 'AI analyzes your eye contact and facial expressions to give feedback on your delivery.',
  },
  {
    title: 'Real interview modes',
    description: 'Switch between behavioral, technical reasoning, and system design prompts.',
  },
  {
    title: 'Private & local-first',
    description: 'Audio & video stays on your machine, with optional email login to save history.',
  },
];

export default function MarketingHome() {
  return (
    <PageContainer className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative mt-12 text-center lg:mt-20">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="inline-flex items-center rounded-full border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[color:var(--accent)]">
            New: Video Analysis & Confidence Scoring
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-[color:var(--text)] sm:text-7xl font-serif">
            Master your interview story.
          </h1>
          <p className="text-xl text-[color:var(--text-muted)] leading-relaxed">
            Practice behavioral and technical questions in a private, low-stakes environment. 
            Get instant AI feedback on your content, structure, and delivery.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="h-12 px-8 text-base">
              <Link href="/question/challenge-star">Start Practice Now</Link>
            </Button>
            <Button asChild variant="secondary" className="h-12 px-8 text-base">
              <Link href="/sessions/new">Start a Session</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Start Grid */}
      <section className="mx-auto max-w-5xl">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="col-span-full mb-4 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">Choose your path</p>
            </div>
            
            <Card className="flex flex-col items-start gap-4 p-6 transition hover:border-[color:var(--accent)]/50">
                <div className="rounded-lg bg-[color:var(--surface-muted)] p-3 text-2xl">🎤</div>
                <h3 className="text-xl font-semibold text-[color:var(--text)]">Behavioral Drills</h3>
                <p className="text-sm text-[color:var(--text-muted)]">Perfect your STAR stories. refine your "Tell me about a time..." answers.</p>
                <Button asChild variant="secondary" className="mt-auto w-full">
                    <Link href="/sessions/new?mode=behavioral">Start Behavioral</Link>
                </Button>
            </Card>

            <Card className="flex flex-col items-start gap-4 p-6 transition hover:border-[color:var(--accent)]/50">
                <div className="rounded-lg bg-[color:var(--surface-muted)] p-3 text-2xl">💻</div>
                <h3 className="text-xl font-semibold text-[color:var(--text)]">Technical & Design</h3>
                <p className="text-sm text-[color:var(--text-muted)]">Practice explaining complex systems and technical trade-offs clearly.</p>
                <Button asChild variant="secondary" className="mt-auto w-full">
                    <Link href="/sessions/new?mode=technical">Start Technical</Link>
                </Button>
            </Card>

             <Card className="flex flex-col items-start gap-4 p-6 transition hover:border-[color:var(--accent)]/50">
                <div className="rounded-lg bg-[color:var(--surface-muted)] p-3 text-2xl">⚡️</div>
                <h3 className="text-xl font-semibold text-[color:var(--text)]">Freestyle</h3>
                <p className="text-sm text-[color:var(--text-muted)]">Have your own questions? Record and analyze any answer.</p>
                <Button asChild variant="secondary" className="mt-auto w-full">
                    <Link href="/record">Go Freestyle</Link>
                </Button>
            </Card>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="mx-auto max-w-6xl space-y-12 rounded-3xl bg-[color:var(--surface-muted)]/50 p-8 sm:p-16">
        <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-[color:var(--text)] sm:text-4xl">Why it works</h2>
            <p className="text-[color:var(--text-muted)] max-w-2xl mx-auto">
                Most interview prep is passive. We make it active. Record yourself, get objective data, and iterate.
            </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.title} className="space-y-3 rounded-2xl bg-[color:var(--surface)] p-6 shadow-sm ring-1 ring-[color:var(--border)]">
              <h3 className="text-lg font-semibold text-[color:var(--text)]">{item.title}</h3>
              <p className="text-sm text-[color:var(--text-muted)] leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl space-y-12">
        <div className="text-center">
             <h2 className="text-3xl font-bold text-[color:var(--text)]">How to use it</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
             <div className="text-center space-y-4">
                 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)] text-xl font-bold text-white">1</div>
                 <h3 className="font-semibold text-[color:var(--text)]">Pick a Prompt</h3>
                 <p className="text-sm text-[color:var(--text-muted)]">Choose from our curated bank of common interview questions.</p>
             </div>
             <div className="text-center space-y-4">
                 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)] text-xl font-bold text-white">2</div>
                 <h3 className="font-semibold text-[color:var(--text)]">Record Video/Audio</h3>
                 <p className="text-sm text-[color:var(--text-muted)]">Speak naturally. We analyze your content and your visual delivery.</p>
             </div>
             <div className="text-center space-y-4">
                 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent)] text-xl font-bold text-white">3</div>
                 <h3 className="font-semibold text-[color:var(--text)]">Get Feedback</h3>
                 <p className="text-sm text-[color:var(--text-muted)]">Review scores, catch filler words, and check your eye contact.</p>
             </div>
        </div>
      </section>
      
      <section className="text-center pt-8 border-t border-[color:var(--border)]">
         <dl className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { label: 'Session modes', value: '3' },
              { label: 'Questions', value: 'Seeded' },
              { label: 'Cost', value: 'Free' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">{stat.label}</dt>
                <dd className="mt-2 text-3xl font-bold text-[color:var(--text)] font-serif">{stat.value}</dd>
              </div>
            ))}
          </dl>
      </section>
    </PageContainer>
  );
}
