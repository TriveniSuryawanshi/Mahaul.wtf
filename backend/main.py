import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .piped_client import PipedClient
from .routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.piped = PipedClient()
    yield
    await app.state.piped.close()


app = FastAPI(
    title="Mahaul Curated Music API",
    version="1.0.0",
    description="Asynchronous Piped API backend for curated music.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "mahaul-api"}


# Mount and serve Vite frontend if build/ or dist/ exists
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "build")
if not os.path.isdir(FRONTEND_DIR):
    FRONTEND_DIR = os.path.join(BASE_DIR, "dist")

ASSETS_DIR = os.path.join(FRONTEND_DIR, "assets")

if os.path.isdir(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


@app.get("/{full_path:path}", tags=["frontend"])
async def serve_spa(full_path: str):
    # Don't intercept API routes or docs
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        return {"detail": "Not Found"}

    file_path = os.path.join(FRONTEND_DIR, full_path)
    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)

    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)

    return {
        "status": "ok",
        "service": "mahaul-api",
        "message": "Backend is running. Build frontend with 'npm run build' to serve UI here.",
    }

