'use client';
import React from 'react';

type Phase = 'idle' | 'recording' | 'recorded' | 'transcribing' | 'done' | 'error';

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

export default function Recorder({
  question,
  onScored,
}: {
  question: string;
  onScored?: (payload: any) => void;
}) {
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [audioURL, setAudioURL] = React.useState<string | null>(null);
  const [transcript, setTranscript] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [durationSec, setDurationSec] = React.useState<number>(0);
  const [mimeType, setMimeType] = React.useState<string>('');
  const [pref, setPref] = React.useState<'auto' | 'webm' | 'mp4'>('auto');

  const [scores, setScores] = React.useState<any | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[] | null>(null);
  const [details, setDetails] = React.useState<any | null>(null);

  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const startTsRef = React.useRef<number | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    if (timerRef.current) window.clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach(t=>t.stop());
  }, [audioURL]);

  const startRecording = async () => {
    try {
      setError(null); setTranscript(null); setScores(null); setSuggestions(null); setDetails(null);
      if (audioURL) URL.revokeObjectURL(audioURL); setAudioURL(null);
      chunksRef.current = [];
      const type = pickMimeType(pref); setMimeType(type);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, type?{mimeType:type}:undefined);
      rec.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = type? new Blob(chunksRef.current,{type}) : new Blob(chunksRef.current);
        const url = URL.createObjectURL(blob); setAudioURL(url); setPhase('recorded');
        if (audioRef.current){ audioRef.current.src = url; audioRef.current.load(); }
        if (timerRef.current){ window.clearInterval(timerRef.current); timerRef.current=null; }
      };
      recorderRef.current = rec; startTsRef.current = Date.now(); setDurationSec(0); setPhase('recording');
      rec.start(100);
      timerRef.current = window.setInterval(()=> {
        if (startTsRef.current) setDurationSec(Math.round((Date.now()-startTsRef.current)/1000));
      }, 250);
    } catch (e:any) {
      setError(e?.name==='NotAllowedError' ? 'Mic permission denied.' : 'Unable to access microphone.'); setPhase('error');
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
      setPhase('transcribing'); setError(null); setTranscript(null); setScores(null); setSuggestions(null); setDetails(null);
      const type = mimeType; const ext = type.includes('mp4') ? 'mp4' : 'webm';
      const blob = type? new Blob(chunksRef.current,{type}) : new Blob(chunksRef.current);
      const form = new FormData();
      form.append('file', blob, `answer.${ext}`); form.append('duration_seconds', String(durationSec));
      form.append('question', question);
      const res = await fetch('http://127.0.0.1:8000/transcribe', { method: 'POST', body: form });
      const data = await res.json(); if (!res.ok) throw new Error(data?.error || 'Transcription failed');
      setTranscript(data.transcript || '(empty)'); setScores(data.scores || null);
      setSuggestions(data.suggestions || []); setDetails(data.explanations || null); setPhase('done');
      onScored?.(data); // notify parent
    } catch (e:any) {
      setError(e.message || 'Unexpected error during transcription'); setPhase('error');
    }
  };
  const reset = () => {
    setPhase('idle'); if (audioURL) URL.revokeObjectURL(audioURL); setAudioURL(null);
    recorderRef.current=null; chunksRef.current=[]; setTranscript(null); setScores(null);
    setSuggestions(null); setDetails(null); setError(null); startTsRef.current=null; setDurationSec(0);
    if (timerRef.current){ window.clearInterval(timerRef.current); timerRef.current=null; }
  };
  const mmss = React.useMemo(()=> {
    const m = Math.floor(durationSec/60).toString().padStart(2,'0');
    const s = (durationSec%60).toString().padStart(2,'0'); return `${m}:${s}`;
  }, [durationSec]);

  return (
    <div className="space-y-4">
      {/* Format selector */}
      <div className="text-sm">
        <label className="mr-2">Recording format:</label>
        <select value={pref} onChange={(e)=>setPref(e.target.value as any)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1">
          <option value="auto">Auto</option><option value="webm">WebM</option><option value="mp4">MP4</option>
        </select>
        <span className="ml-3 text-zinc-500">Detected: {mimeType || 'browser default'}</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={startRecording} disabled={phase==='recording'} className="rounded bg-white text-black px-4 py-2 disabled:opacity-50">
          {phase==='recording' ? 'Recording…' : 'Start recording'}
        </button>
        <button onClick={stopRecording} disabled={phase!=='recording'} className="rounded border border-zinc-700 px-4 py-2 disabled:opacity-50">Stop</button>
        <button onClick={reset} className="rounded border border-zinc-700 px-4 py-2">Reset</button>
        <span className="text-sm text-zinc-400">Status: <span className="font-mono">{phase}</span> • Duration: <span className="font-mono">{mmss}</span></span>
      </div>

      {audioURL && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Preview</p>
            <a href={audioURL} download={`answer.${mimeType.includes('mp4')?'mp4':'webm'}`} className="text-sm underline">Download</a>
          </div>
          <audio ref={audioRef} controls src={audioURL} className="w-full" />
        </div>
      )}

      {phase==='recorded' && (
        <button onClick={transcribe} className="rounded bg-blue-600 px-4 py-2 text-white">
          Transcribe & Score (local AI)
        </button>
      )}
      {phase==='transcribing' && (<div className="text-sm text-zinc-400">Transcribing…</div>)}

      {transcript && (
        <div>
          <h3 className="text-lg font-semibold">Transcript</h3>
          <pre className="whitespace-pre-wrap rounded border border-zinc-700 bg-zinc-900 p-4 text-base leading-6 text-zinc-100">{transcript}</pre>
        </div>
      )}

      {scores && (
        <div>
          <h3 className="text-lg font-semibold">Scores</h3>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            {Object.entries(scores).map(([k,v])=>(
              <div key={k} className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-900 px-3 py-2">
                <span className="capitalize">{k}</span><span className="font-mono">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions && suggestions.length>0 && (
        <div>
          <h3 className="text-lg font-semibold">Suggestions</h3>
          <ul className="mt-2 list-disc pl-6 text-sm text-zinc-100">{suggestions.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
      )}

      {error && <div className="rounded border border-red-500 bg-red-950/40 p-3 text-sm text-red-300">{error}</div>}
    </div>
  );
}
