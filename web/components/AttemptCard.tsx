'use client';
import React from 'react';
import type { AttemptRecord, ScoreMap } from '@/lib/types';

export default function AttemptCard({ a }: { a: AttemptRecord }) {
  const [open, setOpen] = React.useState(false);

  const fallbackScores: ScoreMap = {
    structure: a.score_structure ?? null,
    clarity: a.score_clarity ?? null,
    concision: a.score_concision ?? null,
    content: a.score_content ?? null,
    confidence: a.score_confidence ?? null,
    total: a.score_total ?? null,
  };
  const scores = a.scores && Object.keys(a.scores).length > 0 ? a.scores : fallbackScores;
  const fillerDelta = typeof a.history_summary?.metric_deltas?.['fillers_per_100w'] === 'number'
    ? (a.history_summary?.metric_deltas?.['fillers_per_100w'] as number)
    : null;
  const resultDelta = typeof a.history_summary?.metric_deltas?.['result_strength'] === 'number'
    ? (a.history_summary?.metric_deltas?.['result_strength'] as number)
    : null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            {new Date(a.created_at || Date.now()).toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Total score: <span className="font-mono text-slate-100">{scores?.total ?? '—'}</span>
            {typeof a.duration_seconds === 'number' && (
              <span className="ml-2 text-xs text-slate-500">({Math.round(a.duration_seconds)}s)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-200">
            {scores?.total ? `Score ${scores.total}` : 'Awaiting score'}
          </span>
          <button
            onClick={() => setOpen(!open)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300 hover:text-sky-200"
          >
            {open ? 'Hide details' : 'View details'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-5 space-y-4 text-sm text-slate-300">
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(scores)
              .filter(([, value]) => value !== undefined && value !== null)
              .map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-xs text-slate-300"
                >
                  <p className="text-slate-400">{k.toUpperCase()}</p>
                  <p className="mt-2 text-lg font-semibold text-sky-300">{String(v)}</p>
                </div>
              ))}
          </div>

          {a.transcript && (
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Transcript</p>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-200">
                {a.transcript}
              </pre>
            </div>
          )}

          {a.strengths && a.strengths.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Highlights</p>
              <ul className="mt-2 space-y-2 text-sm text-emerald-200">
                {a.strengths.map((s, i) => (
                  <li key={i} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {a.suggestions && a.suggestions.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Suggestions</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {a.suggestions.map((s: string, i: number) => (
                  <li key={i} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {a.history_summary && a.history_summary.attempt_count > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
              <p className="font-semibold text-slate-200">Trend vs previous attempt</p>
              {typeof a.history_summary.delta_total === 'number' && (
                <p className={`mt-1 font-mono ${a.history_summary.delta_total < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                  Δ total: {a.history_summary.delta_total > 0 ? '+' : ''}{a.history_summary.delta_total.toFixed(1)}
                </p>
              )}
              {(typeof fillerDelta === 'number' || typeof resultDelta === 'number') && (
                <ul className="mt-2 space-y-1">
                  {typeof fillerDelta === 'number' && (
                    <li>Fillers Δ: {fillerDelta > 0 ? '+' : ''}{fillerDelta.toFixed(2)} /100w</li>
                  )}
                  {typeof resultDelta === 'number' && (
                    <li>Impact clarity Δ: {resultDelta > 0 ? '+' : ''}{resultDelta.toFixed(2)}</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
