# RentRebel 🏠

A tenant rights RAG (Retrieval-Augmented Generation) app for Karnataka renters — powered by FastAPI, Pinecone, and a Vite React frontend.

---

## Project Structure

```
RentRebel/
├── frontend/   → Vite + React UI
├── backend/    → FastAPI + Pinecone + Knowledge Graph
└── .gitignore
```

---

## ⚙️ Prerequisites

- **Node.js** (v18+) → https://nodejs.org
- **Python** (v3.9+) → https://python.org
- **Pinecone account** → https://app.pinecone.io (free tier works)

---

## 🔑 Setup: .env file

Inside the `backend/` folder, create a `.env` file:

```
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=tenant-rag
```

Get your API key from: https://app.pinecone.io → API Keys  
The Pinecone index (`tenant-rag`) will be **created automatically** on first run.

---

## 🚀 Running the Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend runs at → **http://localhost:8000**  
API docs at → **http://localhost:8000/docs**  
Health check → **http://localhost:8000/health**

---

## 🎨 Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → **http://localhost:5173**

---

## ✅ Verify Everything Works

Hit the health endpoint after starting the backend:

```json
{
  "status": "ok",
  "graph_nodes": 59,
  "graph_edges": 65,
  "pinecone_connected": true
}
```

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vite + React |
| Backend | FastAPI + Uvicorn |
| Vector DB | Pinecone (serverless) |
| Knowledge Graph | NetworkX |
| Embeddings | sentence-transformers |
