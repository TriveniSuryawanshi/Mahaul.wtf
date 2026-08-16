from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    description="Asynchronous Piped API backend for curated 90s Bollywood music.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3003", "http://127.0.0.1:3003"],
    allow_origin_regex=r"https?://(?:localhost|127\.0\.0\.1|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?",
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
