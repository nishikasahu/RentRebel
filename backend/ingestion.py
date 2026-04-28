from fastapi import APIRouter, HTTPException, Request, UploadFile, File
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import whisper
import io
import re
import os
from groq import Groq
from dotenv import load_dotenv
from rag_pipeline import run_full_audit

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
router = APIRouter(prefix="/ingest", tags=["Ingestion"])

# Load whisper once at startup (small model = fast + free)
whisper_model = whisper.load_model("base")


# ─── TEXT EXTRACTION ────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Try PyMuPDF first, fall back to Tesseract OCR if scanned."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    full_text = ""

    for page in doc:
        page_text = page.get_text().strip()

        if page_text:
            # Normal PDF with selectable text
            full_text += page_text + "\n"
        else:
            # Scanned page — render to image and OCR it
            pix = page.get_pixmap(dpi=200)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_text = pytesseract.image_to_string(img)
            full_text += ocr_text + "\n"

    return full_text.strip()


def extract_text_from_image(file_bytes: bytes) -> str:
    """OCR directly on an uploaded image."""
    img = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(img).strip()


def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    """Transcribe audio using local Whisper model."""
    import tempfile
    # Save temp file because Whisper needs a file path
    # Use tempfile.gettempdir() for cross-platform compatibility (works on Windows)
    temp_path = os.path.join(tempfile.gettempdir(), filename)
    with open(temp_path, "wb") as f:
        f.write(file_bytes)

    result = whisper_model.transcribe(temp_path)
    os.remove(temp_path)
    return result["text"].strip()


def _build_audit_response(raw_text: str, request: Request) -> dict:
    graph = getattr(request.app.state, "graph", None)
    pinecone_index = getattr(request.app.state, "pinecone_index", None)

    if not graph or not pinecone_index:
        raise HTTPException(status_code=503, detail="Server not fully initialized")

    clauses = segment_clauses(raw_text)
    audit_results = run_full_audit(clauses, pinecone_index, graph)

    return {
        "total_clauses": len(audit_results),
        "violations": sum(1 for r in audit_results if r["verdict"] == "violation"),
        "cautions": sum(1 for r in audit_results if r["verdict"] == "caution"),
        "ok": sum(1 for r in audit_results if r["verdict"] == "ok"),
        "results": audit_results,
    }


# ─── CLAUSE SEGMENTATION ────────────────────────────────────────

def segment_clauses(raw_text: str) -> list[dict]:
    """
    Use Groq/llama to split raw agreement text into labelled clauses.
    Returns a list of clause dicts.
    """
    prompt = f"""You are a legal document parser specializing in Indian rental agreements.

Given the following rental agreement text, identify and extract individual clauses.
For each clause return a JSON array where each item has:
- "clause_text": the original clause text
- "clause_type": one of [Security Deposit, Lock-in Period, Rent Escalation, 
  Landlord Entry, Termination Notice, Maintenance, Penalty, Subletting, 
  Utility Charges, Pet Restriction, Registration, Other]

Return ONLY a valid JSON array, no explanation, no markdown.

Agreement text:
{raw_text[:4000]}
"""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )

    raw_response = response.choices[0].message.content.strip()

    # Clean up in case model adds markdown fences
    raw_response = re.sub(r"```json|```", "", raw_response).strip()

    try:
        import json
        clauses = json.loads(raw_response)
        return clauses
    except Exception:
        # Fallback: return whole text as one clause if parsing fails
        return [{"clause_text": raw_text, "clause_type": "Other"}]


@router.post("/pdf")
async def ingest_pdf(request: Request, file: UploadFile = File(...)):
    filename = (file.filename or "").lower()
    if file.content_type not in {"application/pdf"} and not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    file_bytes = await file.read()
    extracted_text = extract_text_from_pdf(file_bytes)

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")

    return _build_audit_response(extracted_text, request)


@router.post("/image")
async def ingest_image(request: Request, file: UploadFile = File(...)):
    filename = (file.filename or "").lower()
    if not (file.content_type or "").startswith("image/") and not filename.endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Please upload a PNG or JPG image")

    file_bytes = await file.read()
    extracted_text = extract_text_from_image(file_bytes)

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the image")

    return _build_audit_response(extracted_text, request)


@router.post("/audio")
async def ingest_audio(request: Request, file: UploadFile = File(...)):
    file_bytes = await file.read()
    transcript = transcribe_audio(file_bytes, file.filename or "audio.webm")

    if not transcript.strip():
        raise HTTPException(status_code=400, detail="No speech could be transcribed from the audio")

    return _build_audit_response(transcript, request)
