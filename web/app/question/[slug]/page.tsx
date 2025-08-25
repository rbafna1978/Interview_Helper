'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useContext } from 'react';
import { getQuestion } from '@/lib/questions';
import Recorder from '@/components/Recorder';
import AttemptCard from '@/components/AttemptCard';
import SessionBanner from '@/components/SessionBanner';
import { AuthCtx } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export default function QuestionPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const q = getQuestion(slug);
  const { user } = useContext(AuthCtx);

  const [attempts, setAttempts] = useState<any[]>([]);
  const localKey = `coach.attempts.${slug}`;

  useEffect(() => {
    if (!q) { router.replace('/dashboard'); return; }
    (async () => {
      if (user) {
        const { data, error } = await supabase
          .from('attempts')
          .select('*')
          .eq('question_slug', slug)
          .order('created_at', { ascending: false })
          .limit(20);
        if (!error) setAttempts(data || []);
      } else {
        const raw = localStorage.getItem(localKey);
        setAttempts(raw ? JSON.parse(raw) : []);
      }
    })();
  }, [slug, q, user, router]);

  async function onScored(payload: any) {
    if (user) {
      await supabase.from('attempts').insert({
        user_id: user.id,                 // RLS requires this to match auth.uid()
        question_slug: slug,
        duration_seconds: payload.duration_seconds ?? 0,
        transcript: payload.transcript,
        scores: payload.scores,
        suggestions: payload.suggestions,
        language: payload.language,
      });
      const { data } = await supabase
        .from('attempts')
        .select('*')
        .eq('question_slug', slug)
        .order('created_at', { ascending: false })
        .limit(20);
      setAttempts(data || []);
    } else {
      const next = [{ ...payload, created_at: Date.now() }, ...attempts].slice(0, 20);
      localStorage.setItem(localKey, JSON.stringify(next));
      setAttempts(next);
    }
  }

  if (!q) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-zinc-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{q.text}</h1>
        <a href="/dashboard" className="text-sm underline">Back</a>
      </div>

      <SessionBanner />

      <div className="mt-6">
        <Recorder question={q.text} onScored={onScored} />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Attempts</h2>
        {attempts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No attempts yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {attempts.map((a:any, i:number) => <AttemptCard key={a.id ?? i} a={a} />)}
          </div>
        )}
      </div>
    </main>
  );
}