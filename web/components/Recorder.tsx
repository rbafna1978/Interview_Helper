'use client';
import React from 'react';
import type { AttemptFeedback, AttemptRecord, HistorySummary, ScoreMap } from '@/lib/types';

type Phase = 'idle' | 'recording' | 'recorded' | 'analyzing' | 'done' | 'error';

const MAX_RECORDING_SEC = 300;

type RecorderResult = AttemptFeedback;

// Minimal SpeechRecognition type definitions (not in default TS lib)
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

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
  const [liveTranscript, setLiveTranscript] = React.useState('');
  const [finalTranscript, setFinalTranscript] = React.useState('');
  const [audioURL, setAudioURL] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [durationSec, setDurationSec] = React.useState(0);
  const [speechSupported, setSpeechSupported] = React.useState(true);

  const [overallScore, setOverallScore] = React.useState<number | null>(null);
  const [subscores, setSubscores] = React.useState<Record<string, number> | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[] | null>(null);
  const [strengths, setStrengths] = React.useState<string[] | null>(null);
  const [historySummary, setHistorySummary] = React.useState<HistorySummary | null>(null);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const startTsRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const speechRef = React.useRef<SpeechRecognitionInstance | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) setSpeechSupported(false);
  }, []);

  React.useEffect(() => () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    if (timerRef.current) window.clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    speechRef.current?.stop();
  }, [audioURL]);

  const mmss = React.useMemo(() => {
    const m = Math.floor(durationSec / 60).toString().padStart(2, '0');
    const s = (durationSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [durationSec]);

  const startRecording = async () => {
    try {
      setError(null);
      setLiveTranscript('');
      setFinalTranscript('');
      setOverallScore(null);
      setSubscores(null);
      setSuggestions(null);
      setStrengths(null);
      setHistorySummary(null);
      chunksRef.current = [];
      if (audioURL) { URL.revokeObjectURL(audioURL); setAudioURL(null); }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start SpeechRecognition
      const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (SR) {
        const recognition: SpeechRecognitionInstance = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        let accumulated = '';
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (!result) continue;
            if (result.isFinal) {
              accumulated += result[0]?.transcript ?? '';
            } else {
              interim += result[0]?.transcript ?? '';
            }
          }
          setFinalTranscript(accumulated);
          setLiveTranscript(accumulated + interim);
        };
        recognition.onerror = () => { /* silence recognition errors silently */ };
        recognition.start();
        speechRef.current = recognition;
      }

      // Start MediaRecorder for audio preview
      const mimeType = MediaRecorder.isTypeSupported?.('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      rec.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        if (audioRef.current) { audioRef.current.src = url; void audioRef.current.load(); }
        if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
        stream.getTracks().forEach((t) => t.stop());
      };

      recorderRef.current = rec;
      startTsRef.current = Date.now();
      setDurationSec(0);
      setPhase('recording');
      rec.start(100);
      timerRef.current = window.setInterval(() => {
        if (startTsRef.current) {
          const next = Math.round((Date.now() - startTsRef.current) / 1000);
          setDurationSec(next);
          if (next >= MAX_RECORDING_SEC) stopRecording();
        }
      }, 250);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow it in your browser settings.'
          : 'Unable to access microphone.';
      setError(message);
      setPhase('error');
    }
  };

  const stopRecording = () => {
    try {
      speechRef.current?.stop();
      const rec = recorderRef.current;
      if (!rec) return;
      if (rec.state !== 'inactive') rec.stop();
      if (startTsRef.current) setDurationSec(Math.round((Date.now() - startTsRef.current) / 1000));
      setPhase('recorded');
    } catch {
      setError('Failed to stop recording.');
      setPhase('error');
    }
  };

  const analyzeAnswer = async () => {
    const transcript = finalTranscript || liveTranscript;
    if (!transcript.trim()) {
      setError('No transcript detected. Try speaking clearly, or check your browser supports Web Speech API (Chrome/Edge recommended).');
      return;
    }
    try {
      setPhase('analyzing');
      setError(null);

      const historyPayload = (history ?? []).slice(0, 5).map((a) => ({
        transcript: a.transcript ?? '',
        duration_seconds: a.duration_seconds ?? null,
        scores: a.scores ?? (typeof a.score_total === 'number' ? {
          total: a.score_total,
          structure: a.score_structure ?? null,
          clarity: a.score_clarity ?? null,
          concision: a.score_concision ?? null,
          content: a.score_content ?? null,
          confidence: a.score_confidence ?? null,
        } : null),
        suggestions: a.suggestions ?? null,
        strengths: a.strengths ?? null,
      }));

      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          question,
          durationSeconds: durationSec,
          questionId: questionId ?? null,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Scoring failed' })) as { error?: string };
        throw new Error(err.error ?? 'Scoring failed');
      }

      const raw = await res.json() as Partial<RecorderResult>;

      const payload: RecorderResult = {
        transcript,
        duration_seconds: durationSec,
        overallScore: typeof raw.overallScore === 'number' ? raw.overallScore : undefined,
        subscores: (raw.subscores as Record<string, number> | null | undefined) ?? null,
        issues: raw.issues ?? null,
        explain: raw.explain ?? null,
        scores: (raw.scores as ScoreMap | null | undefined) ?? null,
        suggestions: raw.suggestions ?? [],
        explanations: raw.explanations ?? null,
        language: null,
        strengths: raw.strengths ?? null,
        detected: raw.detected ?? null,
        history_summary: raw.history_summary ?? null,
        question_alignment: raw.question_alignment ?? null,
      };

      setOverallScore(typeof payload.overallScore === 'number' ? payload.overallScore : null);
      setSubscores(payload.subscores ?? null);
      setSuggestions(payload.suggestions ?? []);
      setStrengths(payload.strengths ?? null);
      setHistorySummary((payload.history_summary as HistorySummary | null) ?? null);
      setPhase('done');
      onScored?.(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error during analysis');
      setPhase('error');
    }
  };

  const reset = () => {
    setPhase('idle');
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    recorderRef.current = null;
    chunksRef.current = [];
    setLiveTranscript('');
    setFinalTranscript('');
    setOverallScore(null);
    setSubscores(null);
    setSuggestions(null);
    setStrengths(null);
    setHistorySummary(null);
    setError(null);
    startTsRef.current = null;
    setDurationSec(0);
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
  };

  const progressInsight = React.useMemo(() => {
    if (!historySummary) return null;
    const { delta_total, last_total, best_total, attempt_count } = historySummary;
    return {
      attemptCount: attempt_count,
      deltaLabel: typeof delta_total === 'number' ? `${delta_total > 0 ? '+' : ''}${delta_total.toFixed(1)}` : null,
      lastTotal: typeof last_total === 'number' ? last_total : null,
      bestTotal: typeof best_total === 'number' ? best_total : null,
    };
  }, [historySummary]);

  const scoreColor = overallScore == null ? 'var(--text-muted)' : overallScore >= 75 ? '#16a34a' : overallScore >= 55 ? '#d97706' : '#dc2626';

  return (
    <div className="space-y-6">
      {!speechSupported && (
        <div className="rounded-2xl border border-amber-400/60 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Web Speech API not available.</strong> Your browser doesn&apos;t support live transcription.
          Chrome or Edge on desktop work best. You can still record and manually type your transcript.
        </div>
      )}

      {/* Mic button */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative">
          {phase === 'recording' && (
            <span className="absolute inset-0 rounded-full bg-[color:var(--accent)]/20 animate-ping" />
          )}
          <button
            onClick={phase === 'idle' || phase === 'error' ? startRecording : phase === 'recording' ? stopRecording : undefined}
            disabled={phase === 'analyzing' || phase === 'recorded' || phase === 'done'}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--accent)] text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            title={phase === 'recording' ? 'Stop recording' : 'Start recording'}
          >
            {phase === 'recording' ? (
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v7a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2Zm7 9a1 1 0 0 1 1 1 8 8 0 0 1-7 7.938V23h-2v-2.062A8 8 0 0 1 4 13a1 1 0 1 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1Z" />
              </svg>
            )}
          </button>
        </div>

        <div className="text-center">
          {phase === 'idle' && <p className="text-sm text-[color:var(--text-muted)]">Tap to start recording</p>}
          {phase === 'recording' && (
            <p className="text-sm text-[color:var(--accent)] font-medium">
              Recording — <span className="font-mono">{mmss}</span> — tap to stop
            </p>
          )}
          {phase === 'recorded' && <p className="text-sm text-[color:var(--text-muted)]">Done recording. Review below and analyze.</p>}
          {phase === 'analyzing' && <p className="text-sm text-[color:var(--text-muted)]">Analyzing your answer…</p>}
          {phase === 'done' && <p className="text-sm text-emerald-600 font-medium">Analysis complete!</p>}
        </div>

        {(phase === 'recorded' || phase === 'done' || phase === 'error') && (
          <button
            onClick={reset}
            className="text-sm text-[color:var(--text-muted)] underline underline-offset-2 hover:text-[color:var(--text)]"
          >
            Start over
          </button>
        )}
      </div>

      {/* Live transcript */}
      {(phase === 'recording' || phase === 'recorded') && liveTranscript && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
          <p className="mb-2 text-xs font-medium text-[color:var(--text-muted)]">
            {phase === 'recording' ? 'Live transcript' : 'Your answer'}
          </p>
          <p className="text-sm leading-relaxed text-[color:var(--text)]">{liveTranscript}</p>
        </div>
      )}

      {/* Audio preview */}
      {audioURL && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[color:var(--text-muted)]">Playback preview</p>
          <audio ref={audioRef} controls className="w-full" preload="metadata" src={audioURL} />
        </div>
      )}

      {/* Analyze button */}
      {phase === 'recorded' && (
        <button
          onClick={analyzeAnswer}
          className="w-full rounded-full bg-[color:var(--accent)] py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Analyze my answer
        </button>
      )}

      {/* Analyzing state */}
      {phase === 'analyzing' && (
        <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--accent)] border-t-transparent" />
          Scoring your answer…
        </div>
      )}

      {/* Results */}
      {phase === 'done' && overallScore !== null && (
        <div className="space-y-4">
          {/* Overall score */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <p className="mb-1 text-xs text-[color:var(--text-muted)]">Overall score</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold" style={{ color: scoreColor }}>
                {Math.round(overallScore)}
              </span>
              <span className="mb-1 text-sm text-[color:var(--text-muted)]">/ 100</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-[color:var(--surface-muted)]">
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${overallScore}%`, backgroundColor: scoreColor }}
              />
            </div>
          </div>

          {/* Subscores */}
          {subscores && Object.keys(subscores).length > 0 && (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
              <p className="mb-3 text-xs font-medium text-[color:var(--text-muted)]">Score breakdown</p>
              <div className="space-y-3">
                {Object.entries(subscores).filter(([k]) => k !== 'total').map(([key, val]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="capitalize text-[color:var(--text)]">{key}</span>
                      <span className="font-mono text-[color:var(--text-muted)]">{val}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[color:var(--surface-muted)]">
                      <div
                        className="h-1.5 rounded-full bg-[color:var(--accent)]"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {strengths && strengths.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="mb-3 text-xs font-medium text-emerald-700">What went well</p>
              <ul className="space-y-2">
                {strengths.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
              <p className="mb-3 text-xs font-medium text-[color:var(--text-muted)]">Focus for next rep</p>
              <ul className="space-y-3">
                {suggestions.map((s, i) => (
                  <li key={i} className="rounded-xl bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-[color:var(--text)]">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* History trend */}
          {historySummary && progressInsight && progressInsight.attemptCount > 0 && (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm">
              <p className="mb-2 text-xs font-medium text-[color:var(--text-muted)]">
                Progress vs last attempt (n={progressInsight.attemptCount})
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-[color:var(--text-muted)]">
                {progressInsight.deltaLabel && (
                  <span className={`font-mono font-semibold ${(historySummary.delta_total ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {(historySummary.delta_total ?? 0) >= 0 ? '↑' : '↓'} {progressInsight.deltaLabel} pts
                  </span>
                )}
                {progressInsight.lastTotal !== null && (
                  <span>Last: {progressInsight.lastTotal.toFixed(1)}</span>
                )}
                {progressInsight.bestTotal !== null && (
                  <span>Best: {progressInsight.bestTotal.toFixed(1)}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}
    </div>
  );
}
