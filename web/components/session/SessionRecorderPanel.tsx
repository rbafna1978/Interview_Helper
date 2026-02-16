"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Recorder from '@/components/Recorder';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { AttemptFeedback } from '@/lib/types';

type Props = {
  sessionId: string;
  questionSlug: string;
  questionPrompt: string;
};

export default function SessionRecorderPanel({ sessionId, questionSlug, questionPrompt }: Props) {
  const router = useRouter();
  const { notify } = useToast();
  const [saving, setSaving] = useState(false);

  async function handleScored(payload: AttemptFeedback) {
    try {
      setSaving(true);
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionSlug,
          transcript: payload.transcript,
          durationSeconds: payload.duration_seconds,
          overallScore: payload.overallScore,
          subscores: payload.subscores,
          scores: payload.scores,
          issues: payload.issues,
          explain: payload.explain,
          suggestions: payload.suggestions,
          strengths: payload.strengths,
          detected: payload.detected,
          explanations: payload.explanations,
          questionAlignment: payload.question_alignment,
        }),
      });
      if (!res.ok) {
        notify({ title: 'Save failed', description: 'Try recording again.', tone: 'error' });
        return;
      }
      const data = (await res.json()) as { attemptId?: string; planId?: string };
      if (data.planId) {
        notify({ title: 'Practice plan created', description: 'Find it in your dashboard.', tone: 'success' });
      } else {
        notify({ title: 'Attempt saved', description: 'Opening results...', tone: 'success' });
      }
      const attemptId = data.attemptId;
      router.push(`/sessions/${sessionId}/results?slug=${questionSlug}${attemptId ? `&attempt=${attemptId}` : ''}`);
    } catch (error) {
      console.error(error);
      notify({ title: 'Save failed', description: 'Network error. Please retry.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Recorder question={questionPrompt} questionId={questionSlug} history={[]} onScored={handleScored} />
      {saving && (
        <div className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3 text-xs text-[color:var(--text-muted)]">
          <span>Saving attempt…</span>
          <Button variant="secondary" disabled>
            Saving
          </Button>
        </div>
      )}
    </div>
  );
}
