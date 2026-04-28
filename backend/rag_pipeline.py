import os
import json
import re
from groq import Groq
from retriever import retrieve
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def determine_verdict(clause_text: str, retrieved_contexts: list[dict]) -> dict:
    """
    Given a clause and retrieved legal context,
    ask Groq to determine if it's a violation, caution, or ok.
    """
    # Build context string from retrieved results
    context_str = ""
    for i, ctx in enumerate(retrieved_contexts):
        gc = ctx.get("graph_context", {})
        context_str += f"""
Context {i+1}:
- Clause Type: {gc.get('clause_type', 'Unknown')}
- Statute: {gc.get('statute', 'N/A')}
- Tenant Right: {gc.get('tenant_right', 'N/A')}
- Remedy: {gc.get('remedy', 'N/A')}
- Similarity Score: {ctx.get('similarity_score', 0)}
"""

    prompt = f"""You are an expert in Karnataka tenant law and Indian rental agreements.

A tenant has submitted the following rental agreement clause for review:

CLAUSE: \"{clause_text}\"

Based on the following retrieved legal knowledge from Karnataka Rent Act and related statutes:
{context_str}

Analyze this clause and respond ONLY with a valid JSON object (no markdown, no explanation):
{{
  "verdict": "violation" | "caution" | "ok",
  "clause_type": "identified clause type",
  "explanation": "clear explanation in 2-3 sentences why this is a violation/caution/ok",
  "statute_cited": "the specific statute that applies",
  "tenant_right": "what the tenant's right is",
  "remedy": "what the tenant can do about it"
}}

Verdict guide:
- "violation" = clearly illegal under Karnataka law
- "caution" = potentially unfair or borderline, tenant should be aware
- "ok" = standard and legal clause
"""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )

    raw = response.choices[0].message.content.strip()
    raw = re.sub(r"```json|```", "", raw).strip()

    try:
        return json.loads(raw)
    except Exception:
        return {
            "verdict": "caution",
            "clause_type": "Unknown",
            "explanation": raw,
            "statute_cited": "N/A",
            "tenant_right": "N/A",
            "remedy": "Consult a lawyer"
        }


def run_full_audit(clauses: list[dict], pinecone_index, graph) -> list[dict]:
    """
    Run the full RAG audit on a list of segmented clauses.
    Returns audit results with verdict for each clause.
    """
    results = []

    for clause in clauses:
        clause_text = clause.get("clause_text", "")
        if not clause_text.strip():
            continue

        # Step 1: Retrieve similar clauses from Pinecone + graph
        retrieved = retrieve(clause_text, pinecone_index, graph, top_k=3)

        # Step 2: Get verdict from Groq
        verdict_data = determine_verdict(clause_text, retrieved)

        results.append({
            "clause_text": clause_text,
            "clause_type": clause.get("clause_type", verdict_data.get("clause_type")),
            "verdict": verdict_data.get("verdict", "caution"),
            "explanation": verdict_data.get("explanation", ""),
            "statute_cited": verdict_data.get("statute_cited", ""),
            "tenant_right": verdict_data.get("tenant_right", ""),
            "remedy": verdict_data.get("remedy", ""),
            "retrieved_context_count": len(retrieved),
        })

    return results
