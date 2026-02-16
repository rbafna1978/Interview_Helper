"use client";

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ScoreIssue } from '@/lib/types';

type Props = {
  transcript: string;
  issues: ScoreIssue[];
};

function splitSentences(text: string) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function severityClasses(severity: ScoreIssue['severity']) {
  switch (severity) {
    case 'high':
      return 'bg-[color:var(--danger-bg)] text-[color:var(--danger)]';
    case 'medium':
      return 'bg-[color:var(--warn-bg)] text-[color:var(--warn)]';
    case 'low':
    default:
      return 'bg-[color:var(--ok-bg)] text-[color:var(--ok)]';
  }
}

export default function TranscriptHighlights({ transcript, issues }: Props) {
  const [activeIssue, setActiveIssue] = useState<ScoreIssue | null>(issues[0] ?? null);

  const sentences = useMemo(() => splitSentences(transcript), [transcript]);
  const matchForSentence = useMemo(() => {
    return sentences.map((sentence) => {
      const match = issues.find((issue) => issue.evidenceSnippet && sentence.includes(issue.evidenceSnippet));
      return match ?? null;
    });
  }, [issues, sentences]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text)]">
        {sentences.map((sentence, index) => {
          const matchedIssue = matchForSentence[index];
          const isActive = activeIssue?.evidenceSnippet && sentence.includes(activeIssue.evidenceSnippet);
          return (
            <p
              key={`${sentence}-${index}`}
              className={cn(
                'mb-3 rounded-xl px-3 py-2 transition',
                matchedIssue ? severityClasses(matchedIssue.severity) : 'text-[color:var(--text-muted)]',
                isActive && 'ring-1 ring-[color:var(--accent)]'
              )}
            >
              {sentence}
            </p>
          );
        })}
        {sentences.length === 0 && <p>No transcript available yet.</p>}
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--text-muted)]">Highlights</p>
        {issues.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
            No flagged issues. Strong, clean response.
          </div>
        ) : (
          <>
            {issues.map((issue) => (
              <button
                key={`${issue.type}-${issue.evidenceSnippet}`}
                onClick={() => setActiveIssue(issue)}
                className={cn(
                  'w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-left text-sm transition',
                  activeIssue === issue ? 'border-[color:var(--accent)] text-[color:var(--text)]' : 'text-[color:var(--text-muted)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">{issue.type}</p>
                  <span className="rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-muted)]">
                    {issue.severity}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--text)]">{issue.fixSuggestion}</p>
                <p className="mt-2 text-xs text-[color:var(--text-muted)]">Evidence: {issue.evidenceSnippet}</p>
              </button>
            ))}
            {activeIssue?.rewriteSuggestion && (
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-xs text-[color:var(--text)]">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-muted)]">Try this rewrite</p>
                <p className="mt-2 text-sm text-[color:var(--text)]">{activeIssue.rewriteSuggestion}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
