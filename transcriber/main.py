from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel
import tempfile, shutil, os, json

from scoring import score_answer

app = FastAPI(title="Local ASR (faster-whisper)")

allowed_origins_raw = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)

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
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        segments, info = model.transcribe(tmp_path, beam_size=5)
        transcript = " ".join(seg.text for seg in segments).strip()

        os.remove(tmp_path)

        history_payload = []
        if history:
            try:
                history_payload = json.loads(history)
            except Exception:
                history_payload = []

        scoring = score_answer(question, transcript, duration_seconds, history_payload, question_id=question_id)

        return JSONResponse({
            "transcript": transcript,
            "language": info.language,
            "duration_seconds": duration_seconds,
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
