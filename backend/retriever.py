from embeddings import embed_text
from graph_builder import get_context_for_clause


def retrieve(
    query_text: str,
    pinecone_index,
    graph,
    top_k: int = 5
) -> list[dict]:
    """
    Full retrieval pipeline:
    1. Embed query text
    2. Pinecone top-K search
    3. For each match, traverse graph to get statute + right + remedy
    4. Return combined context list
    """
    query_embedding = embed_text(query_text)

    results = pinecone_index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )

    enriched = []
    for match in results.matches:
        clause_id = match.id
        score = match.score
        metadata = match.metadata

        # Get graph context for this clause
        graph_context = get_context_for_clause(graph, clause_id)

        enriched.append({
            "clause_id": clause_id,
            "similarity_score": round(score, 4),
            "pinecone_metadata": metadata,
            "graph_context": graph_context,
        })

    return enriched
