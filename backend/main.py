from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from graph_builder import build_knowledge_graph
from pinecone_setup import get_pinecone_index
from ingestion import router as ingestion_router
from routers.analyze import router as analyze_router

# State shared across the app
app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: build graph and connect Pinecone
    print("Building knowledge graph...")
    graph = build_knowledge_graph()
    print("Connecting to Pinecone...")
    pinecone_index = get_pinecone_index()

    app_state["graph"] = graph
    app_state["pinecone_index"] = pinecone_index
    app.state.graph = graph
    app.state.pinecone_index = pinecone_index

    print("Ready.")
    yield
    # Shutdown: nothing to clean up
    app_state.clear()

app = FastAPI(title="Tenant RAG API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten this in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion_router)
app.include_router(analyze_router)

@app.get("/health")
def health():
    graph = app_state.get("graph")
    pinecone = app_state.get("pinecone_index")
    return {
        "status": "ok",
        "graph_nodes": graph.number_of_nodes() if graph else 0,
        "graph_edges": graph.number_of_edges() if graph else 0,
        "pinecone_connected": pinecone is not None,
    }