'use client';
import React from 'react';
import type { AttemptFeedback, AttemptRecord, HistorySummary, ScoreMap } from '@/lib/types';

type Phase = 'idle' | 'recording' | 'recorded' | 'transcribing' | 'done' | 'error';

const TRANSCRIBE_ENDPOINT = `${(process.env.NEXT_PUBLIC_TRANSCRIBE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')}/transcribe`;

function isSafari() {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
}
function pickMimeType(pref: 'auto'|'webm'|'mp4' = 'auto') {
  const list = pref==='webm' ? ['audio/webm;codecs=opus','audio/webm']
    : pref==='mp4' ? ['audio/mp4']
    : (isSafari() ? ['audio/mp4','audio/webm;codecs=opus','audio/webm'] : ['audio/webm;codecs=opus','audio/webm','audio/mp4']);
  for (const t of list) if (MediaRecorder.isTypeSupported?.(t)) return t;
  return '';
}

type RecorderResult = AttemptFeedback;

export default function Recorder({
  question,
  questionId,
  onScored,
  history,
}: {
  question: string;
  questionId?: string | null;
  onScored?: (payload: RecorderResult) => void;
  history?: AttemptRecord[] | null;
}) {
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [audioURL, setAudioURL] = React.useState<string | null>(null);
  const [audioVersion, setAudioVersion] = React.useState(0);
  const [transcript, setTranscript] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [durationSec, setDurationSec] = React.useState<number>(0);
  const [mimeType, setMimeType] = React.useState<string>('');
  const [recordedMime, setRecordedMime] = React.useState<string>('');
  const [pref, setPref] = React.useState<'auto' | 'webm' | 'mp4'>('auto');

  const [scores, setScores] = React.useState<ScoreMap | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[] | null>(null);
  const [strengths, setStrengths] = React.useState<string[] | null>(null);
  const [historySummary, setHistorySummary] = React.useState<HistorySummary | null>(null);
  const [recordingSupported, setRecordingSupported] = React.useState(true);
  const fallbackPreviewError = 'Could not play the recorded preview in this browser. Try switching the format or use Chrome/Edge.';

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const startTsRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const normalizedMime = React.useMemo(() => {
    const source = recordedMime || mimeType;
    if (!source) return 'audio/webm';
    const [base] = source.split(';');
    return base || 'audio/webm';
  }, [mimeType, recordedMime]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.MediaRecorder === 'undefined') {
      setRecordingSupported(false);
      setPhase('error');
      setError('Recording is not supported in this browser. Try Chrome or Edge for the best experience.');
    }
  }, []);

  React.useEffect(() => () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    if (timerRef.current) window.clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach(t=>t.stop());
  }, [audioURL]);

  const startRecording = async () => {
    try {
      setError(null); setTranscript(null); setScores(null); setSuggestions(null); setStrengths(null); setHistorySummary(null);
      setRecordedMime('');
      if (audioURL) URL.revokeObjectURL(audioURL); setAudioURL(null);
      chunksRef.current = [];
      const type = pickMimeType(pref); setMimeType(type);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, type?{mimeType:type}:undefined);
      rec.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = type? new Blob(chunksRef.current,{type}) : new Blob(chunksRef.current);
        const url = URL.createObjectURL(blob);
        const actualType = blob.type || type || 'audio/webm';
        setRecordedMime(actualType);
        setAudioURL(url);
        setAudioVersion((v) => v + 1);
        setPhase('recorded');
        if (audioRef.current) {
          audioRef.current.src = url;
          void audioRef.current.load();
        }
        if (timerRef.current){ window.clearInterval(timerRef.current); timerRef.current=null; }
      };
      recorderRef.current = rec; startTsRef.current = Date.now(); setDurationSec(0); setPhase('recording');
      rec.start(100);
      timerRef.current = window.setInterval(()=> {
        if (startTsRef.current) setDurationSec(Math.round((Date.now()-startTsRef.current)/1000));
      }, 250);
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Mic permission denied.'
          : 'Unable to access microphone.';
      setError(message);
      setPhase('error');
    }
  };
  const stopRecording = () => {
    try {
      const rec = recorderRef.current; if (!rec) return;
      if (rec.state !== 'inactive') rec.stop(); rec.stream.getTracks().forEach(t=>t.stop());
      if (startTsRef.current) setDurationSec(Math.round((Date.now()-startTsRef.current)/1000));
    } catch { setError('Failed to stop recording.'); setPhase('error'); }
  };
  const transcribe = async () => {
    try {
      if (!chunksRef.current.length) return;
      setPhase('transcribing'); setError(null); setTranscript(null); setScores(null); setSuggestions(null); setStrengths(null); setHistorySummary(null);
      const targetMime = recordedMime || mimeType;
      const blob = targetMime ? new Blob(chunksRef.current, { type: targetMime }) : new Blob(chunksRef.current);
      const actualType = blob.type || targetMime || 'audio/webm';
      const ext = actualType.includes('mp4') ? 'mp4' : 'webm';
      const form = new FormData();
      form.append('file', blob, `answer.${ext}`); form.append('duration_seconds', String(durationSec));
      form.append('question', question);
      if (questionId) {
        form.append('question_id', questionId);
      }
      if (history && history.length) {
        try {
          const recent = history.slice(0, 5).map((attempt) => {
            let scoresPayload: ScoreMap | null = null;
            if (attempt.scores && typeof attempt.scores === 'object') {
              scoresPayload = attempt.scores as ScoreMap;
            } else if (typeof attempt.score_total === 'number') {
              scoresPayload = {
                total: attempt.score_total,
                structure: attempt.score_structure ?? null,
                clarity: attempt.score_clarity ?? null,
                concision: attempt.score_concision ?? null,
                content: attempt.score_content ?? null,
                confidence: attempt.score_confidence ?? null,
              };
            }

            let explanationsPayload: Record<string, unknown> | null = null;
            if (attempt.explanations) {
              if (typeof attempt.explanations === 'string') {
                try {
                  explanationsPayload = JSON.parse(attempt.explanations);
                } catch {
                  explanationsPayload = null;
                }
              } else if (typeof attempt.explanations === 'object') {
                explanationsPayload = attempt.explanations as Record<string, unknown>;
              }
            }

            const suggestionsPayload = Array.isArray(attempt.suggestions)
              ? attempt.suggestions
              : attempt.suggestions ?? null;

            const strengthsPayload = Array.isArray(attempt.strengths)
              ? attempt.strengths
              : attempt.strengths ?? null;

            return {
              transcript: attempt.transcript ?? '',
              duration_seconds: attempt.duration_seconds ?? null,
              scores: scoresPayload,
              suggestions: suggestionsPayload,
              explanations: explanationsPayload,
              strengths: strengthsPayload,
              created_at: attempt.created_at ?? null,
            };
          });
          form.append('history', JSON.stringify(recent));
        } catch {
          // ignore malformed history; we can still score current attempt
        }
      }
      const res = await fetch(TRANSCRIBE_ENDPOINT, { method: 'POST', body: form });
      const raw = (await res.json()) as Partial<RecorderResult> & { error?: string };
      if (!res.ok) throw new Error(raw?.error || 'Transcription failed');
      const payload: RecorderResult = {
        transcript: raw.transcript ?? '(empty)',
        duration_seconds:
          typeof raw.duration_seconds === 'number' ? raw.duration_seconds : Math.max(durationSec, 0),
        scores: (raw.scores as ScoreMap | null | undefined) ?? null,
        suggestions: raw.suggestions ?? [],
        explanations: raw.explanations ?? null,
        language: raw.language ?? null,
        strengths: raw.strengths ?? null,
        detected: raw.detected ?? null,
        history_summary: raw.history_summary ?? null,
      };
      setTranscript(payload.transcript);
      setScores(payload.scores ?? null);
      setSuggestions(payload.suggestions ?? []);
      setStrengths(payload.strengths ?? null);
      setHistorySummary((payload.history_summary as HistorySummary | null) ?? null);
      setPhase('done');
      onScored?.(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error during transcription';
      setError(message);
      setPhase('error');
    }
  };
  const reset = () => {
    setPhase('idle'); if (audioURL) URL.revokeObjectURL(audioURL); setAudioURL(null);
    recorderRef.current=null; chunksRef.current=[]; setTranscript(null); setScores(null);
    setSuggestions(null); setStrengths(null); setHistorySummary(null); setRecordedMime(''); setError(null); startTsRef.current=null; setDurationSec(0);
    if (timerRef.current){ window.clearInterval(timerRef.current); timerRef.current=null; }
  };
  const mmss = React.useMemo(()=> {
    const m = Math.floor(durationSec/60).toString().padStart(2,'0');
    const s = (durationSec%60).toString().padStart(2,'0'); return `${m}:${s}`;
  }, [durationSec]);

  const progressInsight = React.useMemo(() => {
    if (!historySummary) return null;
    const { delta_total, last_total, best_total, attempt_count } = historySummary;
    return {
      attemptCount: attempt_count,
      deltaLabel:
        typeof delta_total === 'number'
          ? `${delta_total > 0 ? '+' : ''}${delta_total.toFixed(1)}`
          : null,
      lastTotal: typeof last_total === 'number' ? last_total : null,
      bestTotal: typeof best_total === 'number' ? best_total : null,
    };
  }, [historySummary]);
  const metricDeltas = React.useMemo(
    () => (historySummary?.metric_deltas ?? {}) as Record<string, number | null>,
    [historySummary]
  );
  const fillerDelta = typeof metricDeltas['fillers_per_100w'] === 'number' ? metricDeltas['fillers_per_100w'] as number : null;
  const resultDelta = typeof metricDeltas['result_strength'] === 'number' ? metricDeltas['result_strength'] as number : null;

  return (
    <div className="space-y-4">
      {!recordingSupported && (
        <div className="rounded border border-amber-500/60 bg-amber-500/10 p-3 text-sm text-amber-100">
          Browser recording isn’t available here. Please open this page in Chrome, Edge, or another MediaRecorder-compatible
          browser to record answers.
        </div>
      )}
      {/* Format selector */}
      <div className="text-sm text-slate-300">
        <label className="mr-2">Recording format:</label>
        <select
          value={pref}
          onChange={(event)=>setPref(event.target.value as 'auto' | 'webm' | 'mp4')}
          className="rounded border border-slate-800 bg-slate-950/80 px-2 py-1 text-slate-100"
        >
          <option value="auto">Auto</option><option value="webm">WebM</option><option value="mp4">MP4</option>
        </select>
        <span className="ml-3 text-slate-500">Detected: {mimeType || 'browser default'}</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={startRecording}
          disabled={phase==='recording' || !recordingSupported}
          className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phase==='recording' ? 'Recording…' : 'Start recording'}
        </button>
        <button
          onClick={stopRecording}
          disabled={phase!=='recording'}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Stop
        </button>
        <button
          onClick={reset}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
        >
          Reset
        </button>
        <span className="text-sm text-slate-400">Status: <span className="font-mono">{phase}</span> • Duration: <span className="font-mono">{mmss}</span></span>
      </div>

      {audioURL && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Preview</p>
            <a href={audioURL} download={`answer.${normalizedMime.includes('mp4') ? 'mp4' : 'webm'}`} className="text-sm underline">Download</a>
          </div>
          <audio
            key={audioVersion}
            ref={audioRef}
            controls
            className="w-full"
            preload="metadata"
            src={audioURL}
            onError={() => setError(fallbackPreviewError)}
            onCanPlay={() => {
              if (error === fallbackPreviewError) setError(null);
            }}
          >
            <source src={audioURL} type={normalizedMime} />
          </audio>
        </div>
      )}

      {phase==='recorded' && (
        <button
          onClick={transcribe}
          className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/30 transition hover:bg-sky-400"
        >
          Transcribe & Score (local AI)
        </button>
      )}
      {phase==='transcribing' && (<div className="text-sm text-slate-400">Transcribing…</div>)}

      {transcript && (
        <div>
          <h3 className="text-lg font-semibold">Transcript</h3>
          <pre className="whitespace-pre-wrap rounded border border-slate-800 bg-slate-950/80 p-4 text-base leading-6 text-slate-100">{transcript}</pre>
        </div>
      )}

      {scores && (
        <div>
          <h3 className="text-lg font-semibold">Scores</h3>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            {Object.entries(scores).map(([k,v])=>(
              <div key={k} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-200">
                <span className="capitalize">{k}</span><span className="font-mono text-sky-300">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {strengths && strengths.length>0 && (
        <div>
          <h3 className="text-lg font-semibold">Highlights</h3>
          <ul className="mt-2 list-disc pl-6 text-sm text-slate-100">
            {strengths.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestions && suggestions.length>0 && (
        <div>
          <h3 className="text-lg font-semibold">Focus for next rep</h3>
          <ul className="mt-2 list-disc pl-6 text-sm text-slate-100">{suggestions.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
      )}

      {historySummary && progressInsight && progressInsight.attemptCount > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Trend vs last attempt (n={progressInsight.attemptCount})</span>
            {progressInsight.deltaLabel && (
              <span className={`font-mono ${historySummary.delta_total && historySummary.delta_total < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                Δ {progressInsight.deltaLabel}
              </span>
            )}
          </div>
          <ul className="mt-2 space-y-1 text-xs text-slate-400">
            {progressInsight.lastTotal !== null && (
              <li>Previous total: {progressInsight.lastTotal.toFixed(1)}</li>
            )}
            {progressInsight.bestTotal !== null && (
              <li>Best total so far: {progressInsight.bestTotal.toFixed(1)}</li>
            )}
            {typeof fillerDelta === 'number' && (
              <li>Fillers Δ: {fillerDelta > 0 ? '+' : ''}{fillerDelta.toFixed(2)} /100w</li>
            )}
            {typeof resultDelta === 'number' && (
              <li>Impact clarity Δ: {resultDelta > 0 ? '+' : ''}{resultDelta.toFixed(2)}</li>
            )}
          </ul>
        </div>
      )}

      {error && <div className="rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
    </div>
  );
}
