from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel
import tempfile, shutil, os, json

from scoring import score_answer
from video_analysis import VideoAnalyzer

app = FastAPI(title="Local ASR (faster-whisper)")

# ... (CORS setup remains) ...

allowed_origins_raw = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)
allowed_origin_regex = os.environ.get("ALLOWED_ORIGIN_REGEX", "").strip() or None
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if not allowed_origin_regex else [],
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
video_analyzer = VideoAnalyzer()

@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE}

@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    duration_seconds: int = Form(...),
    question: str = Form("Tell me about a challenge you faced and how you handled it."),  # default
    question_id: str | None = Form(None),
    history: str | None = Form(None),
):
    try:
        suffix = os.path.splitext(file.filename or "")[1] or ".webm"
        is_video = suffix.lower() in ['.mp4', '.webm', '.mov', '.mkv']
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        # 1. Transcribe (works for audio and video files via ffmpeg)
        segments, info = model.transcribe(tmp_path, beam_size=5)
        transcript = " ".join(seg.text for seg in segments).strip()

        # 2. Video Analysis (if applicable)
        video_metrics = None
        if is_video:
            try:
                video_metrics = video_analyzer.analyze(tmp_path)
            except Exception as e:
                print(f"Video analysis failed: {e}")
                video_metrics = {"error": str(e)}

        os.remove(tmp_path)

        history_payload = []
        if history:
            try:
                history_payload = json.loads(history)
            except Exception:
                history_payload = []

        scoring = score_answer(
            question, 
            transcript, 
            duration_seconds, 
            history_payload, 
            question_id=question_id,
            video_metrics=video_metrics
        )

        return JSONResponse({
            "transcript": transcript,
            "language": info.language,
            "duration_seconds": duration_seconds,
            "video_metrics": video_metrics,
            **scoring
        })
    except Exception as e:
        try:
            if 'tmp_path' in locals() and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
