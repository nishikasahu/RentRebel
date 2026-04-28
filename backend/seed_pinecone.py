"""
Run this ONCE to embed all knowledge base clauses and store in Pinecone.
Usage: python seed_pinecone.py
"""
import json
from embeddings import embed_text
from pinecone_setup import get_pinecone_index


def seed():
    with open("knowledge_base.json", "r") as f:
        clauses = json.load(f)

    index = get_pinecone_index()

    vectors = []
    for clause in clauses:
        # Embed a rich description combining type + description + right
        text_to_embed = f"{clause['type']}: {clause['description']}. {clause['right']}"
        embedding = embed_text(text_to_embed)

        vectors.append({
            "id": clause["id"],
            "values": embedding,
            "metadata": {
                "type": clause["type"],
                "description": clause["description"],
                "statute": clause["statute"],
                "right": clause["right"],
                "remedy": clause["remedy"],
                "violation_keywords": ", ".join(clause["violation_keywords"])
            }
        })

    # Upsert in batches of 50
    batch_size = 50
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i+batch_size]
        index.upsert(vectors=batch)
        print(f"Upserted {len(batch)} vectors")

    print(f"Done. {len(vectors)} clauses seeded into Pinecone.")


if __name__ == "__main__":
    seed()
