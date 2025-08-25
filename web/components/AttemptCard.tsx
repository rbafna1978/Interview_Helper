'use client';
import React from 'react';

export default function AttemptCard({ a }: { a: any }) {
  const [open, setOpen] = React.useState(false);

  const scores = a.scores ?? {
    structure: a.score_structure,
    clarity: a.score_clarity,
    concision: a.score_concision,
    content: a.score_content,
    confidence: a.score_confidence,
    total: a.score_total,
  };

  return (
    <div className="rounded border border-zinc-700 bg-zinc-900 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <div className="font-mono text-zinc-300">
            {new Date(a.created_at || Date.now()).toLocaleString()}
          </div>
          <div className="text-zinc-400">
            Total: <span className="font-mono">{scores?.total}</span>
          </div>
        </div>
        <button onClick={()=>setOpen(!open)} className="text-sm underline">
          {open ? 'Hide details ▲' : 'Details ▼'}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(scores).map(([k,v]) => (
              <div key={k} className="flex items-center justify-between rounded border border-zinc-700 px-2 py-1">
                <span className="capitalize">{k}</span>
                <span className="font-mono">{String(v)}</span>
              </div>
            ))}
          </div>

          {a.transcript && (
            <details className="mt-2">
              <summary className="cursor-pointer">Transcript</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded border border-zinc-700 bg-zinc-950 p-3 text-zinc-200">
                {a.transcript}
              </pre>
            </details>
          )}

          {a.suggestions && a.suggestions.length > 0 && (
            <div>
              <div className="font-medium text-zinc-200">Suggestions</div>
              <ul className="list-disc pl-5">
                {a.suggestions.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}