from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from ingestion import (
    extract_text_from_pdf,
    extract_text_from_image,
    transcribe_audio,
    segment_clauses,
)

router = APIRouter(prefix="/ingest", tags=["Ingestion"])


class TextInput(BaseModel):
    text: str


@router.post("/text")
async def ingest_text(body: TextInput):
    """Accept raw text and segment into clauses."""
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    clauses = segment_clauses(body.text)
    return {"source": "text", "clause_count": len(clauses), "clauses": clauses}


@router.post("/pdf")
async def ingest_pdf(file: UploadFile = File(...)):
    """Accept PDF, extract text (with OCR fallback), segment clauses."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    file_bytes = await file.read()
    raw_text = extract_text_from_pdf(file_bytes)

    if not raw_text:
        raise HTTPException(status_code=422, detail="Could not extract text from PDF")

    clauses = segment_clauses(raw_text)
    return {"source": "pdf", "clause_count": len(clauses), "clauses": clauses}


@router.post("/image")
async def ingest_image(file: UploadFile = File(...)):
    """Accept image of a document, OCR it, segment clauses."""
    allowed = [".jpg", ".jpeg", ".png", ".webp"]
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(status_code=400, detail="Only image files accepted")

    file_bytes = await file.read()
    raw_text = extract_text_from_image(file_bytes)

    if not raw_text:
        raise HTTPException(status_code=422, detail="Could not extract text from image")

    clauses = segment_clauses(raw_text)
    return {"source": "image", "clause_count": len(clauses), "clauses": clauses}


@router.post("/audio")
async def ingest_audio(
    file: UploadFile = File(...),
    language: str = None         
):
    """Accept audio file, transcribe with Whisper, segment clauses."""
    allowed = [".mp3", ".wav", ".m4a", ".ogg", ".webm"]
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    file_bytes = await file.read()
    raw_text = transcribe_audio(file_bytes, file.filename, language=language)

    if not raw_text:
        raise HTTPException(status_code=422, detail="Could not transcribe audio")

    clauses = segment_clauses(raw_text)
    return {"source": "audio", "clause_count": len(clauses), "clauses": clauses}
