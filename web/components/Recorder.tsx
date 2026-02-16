'use client';
import React from 'react';
import type { AttemptFeedback, AttemptRecord, HistorySummary, ScoreMap } from '@/lib/types';

type Phase = 'idle' | 'recording' | 'recorded' | 'transcribing' | 'done' | 'error';

const TRANSCRIBE_ENDPOINT = `${(process.env.NEXT_PUBLIC_TRANSCRIBE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')}/transcribe`;
const MAX_RECORDING_SEC = 300;

function isSafari() {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
}
function pickMimeType(pref: 'auto'|'webm'|'mp4' = 'auto', video: boolean = false) {
  if (video) {
    const list = pref==='webm' ? ['video/webm;codecs=vp8,opus','video/webm']
      : pref==='mp4' ? ['video/mp4']
      : (isSafari() ? ['video/mp4','video/webm'] : ['video/webm;codecs=vp8,opus','video/webm','video/mp4']);
    for (const t of list) if (MediaRecorder.isTypeSupported?.(t)) return t;
    return 'video/webm'; // Fallback
  }
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
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [retryable, setRetryable] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastPayload, setLastPayload] = React.useState<FormData | null>(null);
  const [networkStatus, setNetworkStatus] = React.useState<'online' | 'offline'>('online');
  const [recordVideo, setRecordVideo] = React.useState(false);

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
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const videoPreviewRef = React.useRef<HTMLVideoElement | null>(null);

  const normalizedMime = React.useMemo(() => {
    const source = recordedMime || mimeType;
    if (!source) return recordVideo ? 'video/webm' : 'audio/webm';
    const [base] = source.split(';');
    return base || (recordVideo ? 'video/webm' : 'audio/webm');
  }, [mimeType, recordedMime, recordVideo]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.MediaRecorder === 'undefined') {
      setRecordingSupported(false);
      setPhase('error');
      setError('Recording is not supported in this browser. Try Chrome or Edge for the best experience.');
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
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
      setUploadProgress(null);
      setRetryable(false);
      setRetryCount(0);
      setLastPayload(null);
      if (audioURL) URL.revokeObjectURL(audioURL); setAudioURL(null);
      chunksRef.current = [];
      const type = pickMimeType(pref, recordVideo); setMimeType(type);
      
      const constraints = { audio: true, video: recordVideo ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (recordVideo && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      const rec = new MediaRecorder(stream, type?{mimeType:type}:undefined);
      rec.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = type? new Blob(chunksRef.current,{type}) : new Blob(chunksRef.current);
        const url = URL.createObjectURL(blob);
        const actualType = blob.type || type || (recordVideo ? 'video/webm' : 'audio/webm');
        setRecordedMime(actualType);
        setAudioURL(url);
        setAudioVersion((v) => v + 1);
        setPhase('recorded');
        if (recordVideo && videoRef.current) {
          videoRef.current.src = url;
          void videoRef.current.load();
        } else if (audioRef.current) {
          audioRef.current.src = url;
          void audioRef.current.load();
        }
        if (timerRef.current){ window.clearInterval(timerRef.current); timerRef.current=null; }
        // Stop stream tracks
        stream.getTracks().forEach(t => t.stop());
      };
      recorderRef.current = rec; startTsRef.current = Date.now(); setDurationSec(0); setPhase('recording');
      rec.start(100);
      timerRef.current = window.setInterval(()=> {
        if (startTsRef.current) {
          const next = Math.round((Date.now()-startTsRef.current)/1000);
          setDurationSec(next);
          if (next >= MAX_RECORDING_SEC) {
            stopRecording();
          }
        }
      }, 250);
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Permission denied. Please allow access to microphone/camera.'
          : 'Unable to access media devices.';
      setError(message);
      setPhase('error');
    }
  };
  const stopRecording = () => {
    try {
      const rec = recorderRef.current; if (!rec) return;
      if (rec.state !== 'inactive') rec.stop(); 
      // Stream tracks are stopped in onstop to keep preview alive until end
      if (startTsRef.current) setDurationSec(Math.round((Date.now()-startTsRef.current)/1000));
    } catch { setError('Failed to stop recording.'); setPhase('error'); }
  };
  const performUpload = async (form: FormData) => {
    const raw = (await new Promise<Partial<RecorderResult> & { error?: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', TRANSCRIBE_ENDPOINT);
      xhr.responseType = 'json';
      xhr.timeout = 120_000; // Increased timeout for video
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        const body = (xhr.response || {}) as Partial<RecorderResult> & { error?: string };
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(body);
        } else {
          reject(new Error(body?.error || 'Transcription failed'));
        }
      };
      xhr.onerror = () => reject(new Error('Network error while uploading'));
      xhr.ontimeout = () => reject(new Error('Upload timed out. Please retry.'));
      xhr.send(form);
    })) as Partial<RecorderResult> & { error?: string };
    return raw;
  };

  const transcribe = async () => {
    try {
      if (!chunksRef.current.length) return;
      setPhase('transcribing'); setError(null); setTranscript(null); setScores(null); setSuggestions(null); setStrengths(null); setHistorySummary(null);
      setUploadProgress(0);
      setRetryable(false);
      const targetMime = recordedMime || mimeType;
      const blob = targetMime ? new Blob(chunksRef.current, { type: targetMime }) : new Blob(chunksRef.current);
      const actualType = blob.type || targetMime || (recordVideo ? 'video/webm' : 'audio/webm');
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
      setLastPayload(form);
      const raw = await performUpload(form);
      const payload: RecorderResult = {
        transcript: raw.transcript ?? '(empty)',
        duration_seconds:
          typeof raw.duration_seconds === 'number' ? raw.duration_seconds : Math.max(durationSec, 0),
        overallScore: typeof raw.overallScore === 'number' ? raw.overallScore : undefined,
        subscores: (raw.subscores as Record<string, number> | null | undefined) ?? null,
        issues: (raw.issues as any[] | null | undefined) ?? null,
        explain: (raw.explain as any | null | undefined) ?? null,
        scores: (raw.scores as ScoreMap | null | undefined) ?? null,
        suggestions: raw.suggestions ?? [],
        explanations: raw.explanations ?? null,
        language: raw.language ?? null,
        strengths: raw.strengths ?? null,
        detected: raw.detected ?? null,
        history_summary: raw.history_summary ?? null,
        question_alignment: raw.question_alignment ?? null,
      };
      setTranscript(payload.transcript);
      setScores(payload.scores ?? null);
      setSuggestions(payload.suggestions ?? []);
      setStrengths(payload.strengths ?? null);
      setHistorySummary((payload.history_summary as HistorySummary | null) ?? null);
      setPhase('done');
      setUploadProgress(null);
      onScored?.(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error during transcription';
      setError(message);
      setPhase('error');
      setRetryable(true);
      setUploadProgress(null);
    }
  };

  const retryUpload = async () => {
    if (!lastPayload) return;
    try {
      setRetryCount((count) => count + 1);
      setPhase('transcribing');
      setError(null);
      setUploadProgress(0);
      const raw = await performUpload(lastPayload);
      const payload: RecorderResult = {
        transcript: raw.transcript ?? '(empty)',
        duration_seconds:
          typeof raw.duration_seconds === 'number' ? raw.duration_seconds : Math.max(durationSec, 0),
        overallScore: typeof raw.overallScore === 'number' ? raw.overallScore : undefined,
        subscores: (raw.subscores as Record<string, number> | null | undefined) ?? null,
        issues: (raw.issues as any[] | null | undefined) ?? null,
        explain: (raw.explain as any | null | undefined) ?? null,
        scores: (raw.scores as ScoreMap | null | undefined) ?? null,
        suggestions: raw.suggestions ?? [],
        explanations: raw.explanations ?? null,
        language: raw.language ?? null,
        strengths: raw.strengths ?? null,
        detected: raw.detected ?? null,
        history_summary: raw.history_summary ?? null,
        question_alignment: raw.question_alignment ?? null,
      };
      setTranscript(payload.transcript);
      setScores(payload.scores ?? null);
      setSuggestions(payload.suggestions ?? []);
      setStrengths(payload.strengths ?? null);
      setHistorySummary((payload.history_summary as HistorySummary | null) ?? null);
      setPhase('done');
      setUploadProgress(null);
      onScored?.(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error during transcription';
      setError(message);
      setPhase('error');
      setRetryable(true);
      setUploadProgress(null);
    }
  };
  const reset = () => {
    setPhase('idle'); if (audioURL) URL.revokeObjectURL(audioURL); setAudioURL(null);
    recorderRef.current=null; chunksRef.current=[]; setTranscript(null); setScores(null);
    setSuggestions(null); setStrengths(null); setHistorySummary(null); setRecordedMime(''); setError(null); startTsRef.current=null; setDurationSec(0);
    setUploadProgress(null); setRetryable(false);
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
        <div className="rounded border border-amber-400/60 bg-amber-100 p-3 text-sm text-amber-900">
          Browser recording isn’t available here. Please open this page in Chrome, Edge, or another MediaRecorder-compatible
          browser to record answers.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[color:var(--border)] px-3 py-1">Mic</span>
          <span>{recordingSupported ? 'Ready' : 'Unavailable'}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[color:var(--text-muted)]">Format</label>
          <select
            value={pref}
            onChange={(event)=>setPref(event.target.value as 'auto' | 'webm' | 'mp4')}
            className="rounded border border-[color:var(--border)] bg-[color:var(--surface)] px-2 py-1 text-[color:var(--text)]"
          >
            <option value="auto">Auto</option><option value="webm">WebM</option><option value="mp4">MP4</option>
          </select>
          <span className="text-[color:var(--text-muted)]">Detected: {mimeType || 'browser default'}</span>
        </div>
        <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={recordVideo} 
                    onChange={e => {
                        if (phase === 'idle') {
                          setRecordVideo(e.target.checked);
                          if (!e.target.checked && videoPreviewRef.current?.srcObject) {
                            (videoPreviewRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
                            videoPreviewRef.current.srcObject = null;
                          }
                        }
                    }}
                    disabled={phase !== 'idle'}
                    className="rounded border-gray-300 text-[color:var(--accent)] focus:ring-[color:var(--accent)]"
                />
                <span>Enable Video Analysis</span>
            </label>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${networkStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span>{networkStatus === 'online' ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Video Preview Area */}
      {recordVideo && (phase === 'idle' || phase === 'recording') && (
          <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border-2 border-[color:var(--border)] bg-black shadow-xl">
              <video 
                ref={videoPreviewRef} 
                autoPlay 
                muted 
                playsInline 
                className="h-full w-full object-cover -scale-x-100" 
              />
              {phase === 'idle' && !videoPreviewRef.current?.srcObject && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button 
                    onClick={async () => {
                      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                      if (videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
                    }}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-white/20 transition"
                  >
                    Turn on camera to check framing
                  </button>
                </div>
              )}
              {phase === 'recording' && (
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-white" />
                  REC
                </div>
              )}
          </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={startRecording}
          disabled={phase==='recording' || !recordingSupported}
          className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phase==='recording' ? 'Recording…' : 'Start recording'}
        </button>
        <button
          onClick={stopRecording}
          disabled={phase!=='recording'}
          className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--text)] transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Stop
        </button>
        <button
          onClick={reset}
          className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--text)] transition"
        >
          Reset
        </button>
        <span className="text-sm text-[color:var(--text-muted)]">Status: <span className="font-mono">{phase}</span> • Duration: <span className="font-mono">{mmss}</span></span>
      </div>

      {audioURL && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[color:var(--text)]">Preview</p>
            <a href={audioURL} download={`answer.${normalizedMime.includes('mp4') ? 'mp4' : 'webm'}`} className="text-sm underline text-[color:var(--accent)]">Download</a>
          </div>
          {recordVideo ? (
              <video
                key={audioVersion}
                ref={videoRef}
                controls
                className="w-full max-w-md rounded-lg bg-black"
                preload="metadata"
                src={audioURL}
                onError={() => setError(fallbackPreviewError)}
                onCanPlay={() => {
                  if (error === fallbackPreviewError) setError(null);
                }}
              >
                  <source src={audioURL} type={normalizedMime} />
              </video>
          ) : (
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
          )}
        </div>
      )}

      {phase==='recorded' && (
        <button
          onClick={transcribe}
          className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Transcribe & Score (local AI)
        </button>
      )}
      {phase==='transcribing' && (
        <div className="space-y-2 text-sm text-[color:var(--text-muted)]">
          <p>Uploading & transcribing{recordVideo ? ' & analyzing video' : ''}…</p>
          {uploadProgress !== null && (
            <div className="h-2 w-full rounded-full bg-[color:var(--surface-muted)]">
              <div className="h-2 rounded-full bg-[color:var(--accent)] transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
      )}

      {transcript && (
        <div>
          <h3 className="text-lg font-semibold">Transcript</h3>
          <pre className="whitespace-pre-wrap rounded border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-base leading-6 text-[color:var(--text)]">{transcript}</pre>
        </div>
      )}

      {scores && (
        <div>
          <h3 className="text-lg font-semibold">Scores</h3>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            {Object.entries(scores).map(([k,v])=>(
              <div key={k} className="flex items-center justify-between rounded border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[color:var(--text)]">
                <span className="capitalize">{k}</span><span className="font-mono text-[color:var(--accent-2)]">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {strengths && strengths.length>0 && (
        <div>
          <h3 className="text-lg font-semibold">Highlights</h3>
          <ul className="mt-2 list-disc pl-6 text-sm text-[color:var(--text)]">
            {strengths.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {suggestions && suggestions.length>0 && (
        <div>
          <h3 className="text-lg font-semibold">Focus for next rep</h3>
          <ul className="mt-2 list-disc pl-6 text-sm text-[color:var(--text)]">{suggestions.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
      )}

      {historySummary && progressInsight && progressInsight.attemptCount > 0 && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Trend vs last attempt (n={progressInsight.attemptCount})</span>
            {progressInsight.deltaLabel && (
              <span className={`font-mono ${historySummary.delta_total && historySummary.delta_total < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                Δ {progressInsight.deltaLabel}
              </span>
            )}
          </div>
          <ul className="mt-2 space-y-1 text-xs text-[color:var(--text-muted)]">
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

      {error && (
        <div className="rounded border border-rose-400/60 bg-rose-100 p-3 text-sm text-rose-800">
          {error}
          {retryable && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={retryUpload}
                className="rounded-full border border-rose-500/60 px-3 py-1 text-rose-700"
              >
                Retry upload
              </button>
              {retryCount > 0 && <span className="text-rose-700">Retries: {retryCount}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
