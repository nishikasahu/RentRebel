import os
import json
import re
from groq import Groq
from retriever import retrieve
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def extract_number(text: str) -> int:
    """Extract first integer from text."""
    match = re.search(r"\d+", text)
    return int(match.group()) if match else None


def apply_numeric_overrides(clause_text: str, verdict_data: dict) -> dict:
    """
    Apply rule-based numeric checks for specific clause types.
    Overrides LLM verdict for numeric constraints, but keeps other fields intact.
    """
    clause_lower = clause_text.lower()
    
    # Rule 1: Security Deposit (max 3 months)
    if "deposit" in clause_lower:
        num = extract_number(clause_text)
        if num is not None:
            if num <= 3:
                verdict_data["verdict"] = "ok"
                verdict_data["explanation"] = f"Security deposit of {num} month(s) is within the legal limit of 3 months."
            else:
                verdict_data["verdict"] = "violation"
                verdict_data["explanation"] = f"Security deposit of {num} month(s) EXCEEDS the legal limit of 3 months."
    
    # Rule 2: Rent Increase/Escalation (max 5% per annum)
    elif "escalation" in clause_lower or "increase" in clause_lower and "rent" in clause_lower:
        num = extract_number(clause_text)
        if num is not None:
            if num <= 5:
                verdict_data["verdict"] = "ok"
                verdict_data["explanation"] = f"Rent increase of {num}% is within the legal limit of 5% per annum."
            else:
                verdict_data["verdict"] = "violation"
                verdict_data["explanation"] = f"Rent increase of {num}% EXCEEDS the legal limit of 5% per annum."
    
    # Rule 3: Notice Period (min 30 days for termination)
    elif "notice" in clause_lower and ("days" in clause_lower or "hours" in clause_lower):
        num = extract_number(clause_text)
        if num is not None:
            if num >= 30:
                verdict_data["verdict"] = "ok"
                verdict_data["explanation"] = f"Notice period of {num} day(s) meets the minimum legal requirement of 30 days."
            else:
                verdict_data["verdict"] = "violation"
                verdict_data["explanation"] = f"Notice period of {num} day(s) is LESS than the minimum legal requirement of 30 days."
    
    return verdict_data


def determine_verdict(clause_text: str, retrieved_contexts: list[dict]) -> dict:
    """
    Given a clause and retrieved legal context,
    ask Groq to determine if it's a violation, caution, or ok.
    Uses structured reasoning prompt to reduce hallucination.
    """
    # Extract primary legal context from best match
    if not retrieved_contexts:
        gc = {}
    else:
        gc = retrieved_contexts[0].get("graph_context", {})
    
    rule = gc.get("description", "No rule retrieved")
    statute = gc.get("statute", "N/A")
    tenant_right = gc.get("tenant_right", "N/A")
    remedy = gc.get("remedy", "N/A")
    clause_type_from_kb = gc.get("clause_type", "Unknown")

    prompt = f"""You are a legal assistant analyzing a rental agreement clause under Karnataka rental law.

CLAUSE SUBMITTED FOR REVIEW:
{clause_text}

RETRIEVED LEGAL RULE:
Rule: {rule}
Statute: {statute}
Tenant Right: {tenant_right}
Remedy: {remedy}

REASONING INSTRUCTIONS:
1. Identify the clause type from the submitted clause.
2. IF the clause contains a NUMBER (e.g., months, percentage, days, amount):
   a. Extract the numeric value from the clause.
   b. Extract the legal limit from the tenant right or rule.
   c. Compare numerically: does clause exceed, match, or fall short of the limit?
   d. Base verdict on this numeric comparison (exceeding = violation, matching or below = ok, unclear = caution).
3. IF the clause contains NO NUMBER:
   a. Compare qualitatively: does the clause violate, comply with, or contradict the rule?
4. Do NOT assume facts not explicitly stated in the clause or rule.
5. Base your reasoning ONLY on the given context and statute.
6. If unsure about the verdict, default to "caution" rather than guessing.

NUMERIC COMPARISON PRIORITY:
- If legal rule specifies "up to X" and clause says more than X → violation
- If legal rule specifies "minimum X" and clause says less than X → violation
- If legal rule specifies "cannot exceed X" and clause exceeds X → violation
- If clause meets the rule's limits → ok
- If comparison is ambiguous → caution

VERDICT LOGIC:
- "violation": clause clearly violates the statute or exceeds numeric limits
- "caution": clause is unclear, borderline, potentially unfair, or numeric comparison ambiguous
- "ok": clause complies with statute and numeric limits

RESPOND WITH ONLY VALID JSON (no markdown, no extra text):
{{
  "verdict": "violation" | "caution" | "ok",
  "clause_type": "identified type",
  "explanation": "reasoning with numeric comparison if applicable",
  "statute_cited": "{statute}",
  "tenant_right": "{tenant_right}",
  "remedy": "{remedy}"
}}
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
            "clause_type": clause_type_from_kb or "Unknown",
            "explanation": f"Unable to parse response. Raw: {raw}",
            "statute_cited": statute,
            "tenant_right": tenant_right,
            "remedy": remedy
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
        retrieved = retrieve(clause_text, pinecone_index, graph, top_k=5)

        # Step 2: Get verdict from Groq
        verdict_data = determine_verdict(clause_text, retrieved)
        
        # Step 3: Apply rule-based numeric overrides for guaranteed correctness
        verdict_data = apply_numeric_overrides(clause_text, verdict_data)

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
