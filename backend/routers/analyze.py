from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from rag_pipeline import run_full_audit
from ingestion import segment_clauses

router = APIRouter(prefix="/analyze", tags=["Analysis"])


class AnalyzeTextRequest(BaseModel):
    text: str


@router.post("/")
async def analyze(body: AnalyzeTextRequest, request: Request):
    """
    Full pipeline: raw text → segment → retrieve → graph → Groq → audit report
    This is the main endpoint your friend's frontend will call.
    """
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    graph = getattr(request.app.state, "graph", None)
    pinecone_index = getattr(request.app.state, "pinecone_index", None)

    if not graph or not pinecone_index:
        raise HTTPException(status_code=503, detail="Server not fully initialized")

    # Step 1: Segment into clauses
    clauses = segment_clauses(body.text)

    # Step 2: Run RAG audit on each clause
    audit_results = run_full_audit(clauses, pinecone_index, graph)

    return {
        "total_clauses": len(audit_results),
        "violations": sum(1 for r in audit_results if r["verdict"] == "violation"),
        "cautions": sum(1 for r in audit_results if r["verdict"] == "caution"),
        "ok": sum(1 for r in audit_results if r["verdict"] == "ok"),
        "results": audit_results
    }
