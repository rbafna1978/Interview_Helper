from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel
import tempfile, shutil, os

from scoring import score_answer  # <-- NEW

app = FastAPI(title="Local ASR (faster-whisper)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],
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
):
    try:
        suffix = os.path.splitext(file.filename or "")[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        segments, info = model.transcribe(tmp_path, beam_size=5)
        transcript = " ".join(seg.text for seg in segments).strip()

        os.remove(tmp_path)

        scoring = score_answer(question, transcript, duration_seconds)

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
        return JSONResponse({"error": str(e)}, status_code=500)
