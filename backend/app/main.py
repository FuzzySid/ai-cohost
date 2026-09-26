from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import briefs, conflicts, cost, replies

app = FastAPI(title="Host Copilot API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(replies.router, prefix="/api")
app.include_router(conflicts.router, prefix="/api")
app.include_router(briefs.router, prefix="/api")
app.include_router(cost.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
