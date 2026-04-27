import json
import networkx as nx

def build_knowledge_graph(kb_path: str = "knowledge_base.json") -> nx.DiGraph:
    with open(kb_path, "r") as f:
        clauses = json.load(f)

    G = nx.DiGraph()

    for clause in clauses:
        # Add clause node
        G.add_node(
            clause["id"],
            node_type="clause",
            label=clause["type"],
            description=clause["description"],
            statute=clause["statute"],
            right=clause["right"],
            remedy=clause["remedy"],
            violation_keywords=clause["violation_keywords"]
        )

        # Add statute node (if not already added)
        statute_id = f"statute::{clause['statute']}"
        if not G.has_node(statute_id):
            G.add_node(statute_id, node_type="statute", label=clause["statute"])

        # Edge: clause → violates → statute
        G.add_edge(clause["id"], statute_id, relation="violates")

        # Edge: clause → grants_right → right text
        right_id = f"right::{clause['id']}"
        G.add_node(right_id, node_type="right", label=clause["right"])
        G.add_edge(clause["id"], right_id, relation="grants_right")

        # Edge: clause → remedy → remedy text
        remedy_id = f"remedy::{clause['id']}"
        G.add_node(remedy_id, node_type="remedy", label=clause["remedy"])
        G.add_edge(clause["id"], remedy_id, relation="has_remedy")

    # Add related_clause edges
    for clause in clauses:
        for related_id in clause.get("related_clauses", []):
            if G.has_node(related_id):
                G.add_edge(clause["id"], related_id, relation="related_to")

    print(f"Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    return G


def get_context_for_clause(G: nx.DiGraph, clause_id: str) -> dict:
    """Traverse graph from a matched clause to get statute, right, remedy."""
    if clause_id not in G:
        return {}

    context = {"clause_id": clause_id}
    node_data = G.nodes[clause_id]
    context["clause_type"] = node_data.get("label", "")
    context["description"] = node_data.get("description", "")

    for successor in G.successors(clause_id):
        edge_data = G.edges[clause_id, successor]
        relation = edge_data.get("relation", "")
        successor_data = G.nodes[successor]

        if relation == "violates":
            context["statute"] = successor_data.get("label", "")
        elif relation == "grants_right":
            context["tenant_right"] = successor_data.get("label", "")
        elif relation == "has_remedy":
            context["remedy"] = successor_data.get("label", "")
        elif relation == "related_to":
            context.setdefault("related_clauses", []).append(
                G.nodes[successor].get("label", successor)
            )

    return context