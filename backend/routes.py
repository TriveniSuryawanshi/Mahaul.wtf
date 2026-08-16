import re
from urllib.parse import quote, unquote

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from .filter_pipeline import FilterPipeline
from .models import PlaylistResponse, StreamResponse, Video
from .piped_client import PipedClient, PipedError, PipedNotFoundError

router = APIRouter(prefix="/api/v1", tags=["music"])
VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
PLAYLIST_ID = re.compile(r"^[A-Za-z0-9_-]{6,64}$")
filters = FilterPipeline()


def client(request: Request) -> PipedClient:
    return request.app.state.piped


def piped_error(exc: PipedError) -> HTTPException:
    return HTTPException(404 if isinstance(exc, PipedNotFoundError) else 503, str(exc))


import time

_stream_cache: dict[str, tuple[StreamResponse, float]] = {}
CACHE_TTL = 3600  # Cache stream info for 1 hour


@router.get("/proxy_audio")
async def proxy_audio(
    request: Request,
    url: str = Query(),
    video_id: str | None = Query(None),
) -> StreamingResponse:
    target_url = unquote(url.strip())
    if not (target_url.startswith("http://") or target_url.startswith("https://")):
        raise HTTPException(400, "Invalid audio URL")

    client_http = client(request).http
    req_headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    if "range" in request.headers:
        req_headers["Range"] = request.headers["range"]

    res = None
    try:
        req = client_http.build_request("GET", target_url, headers=req_headers)
        res = await client_http.send(req, stream=True)
    except Exception:
        res = None

    # If stream expired, returned 403/410/404, or failed, auto-refresh directly via yt-dlp
    if (res is None or res.status_code not in (200, 206)) and video_id and VIDEO_ID.fullmatch(video_id.strip()):
        if res is not None:
            await res.aclose()
        safe_id = video_id.strip()
        _stream_cache.pop(safe_id, None)
        try:
            data = await client(request).streams(safe_id)
            streams = [stream for stream in data.get("audioStreams") or [] if stream.get("url")]
            preferred = [stream for stream in streams if str(stream.get("format") or "").casefold() in {"m4a", "webm"}]
            selected_list = preferred if preferred else streams
            if selected_list:
                selected_list.sort(
                    key=lambda s: (
                        str(s.get("format") or "").casefold() == "m4a",
                        int(s.get("bitrate") or 0),
                    ),
                    reverse=True,
                )
                target_url = str(selected_list[0]["url"])
                req = client_http.build_request("GET", target_url, headers=req_headers)
                res = await client_http.send(req, stream=True)
        except Exception:
            pass

    if res is None:
        raise HTTPException(502, "Failed to connect to audio source")

    if res.status_code not in (200, 206):
        await res.aclose()
        if video_id:
            _stream_cache.pop(video_id.strip(), None)
        raise HTTPException(res.status_code, f"Audio source returned HTTP {res.status_code}")

    res_headers = {}
    for h in ("content-type", "content-length", "accept-ranges", "content-range"):
        if h in res.headers:
            res_headers[h] = res.headers[h]

    async def stream_body():
        try:
            async for chunk in res.aiter_bytes():
                yield chunk
        finally:
            await res.aclose()

    return StreamingResponse(stream_body(), status_code=res.status_code, headers=res_headers)


import asyncio
import random

THEME_GENRE_QUERIES: dict[str, list[str]] = {
    "chai": [
        "60s 70s hindi classic songs",
        "golden oldies hindi evergreen songs",
        "70s bollywood retro romantic hits",
        "kishore kumar lata mangeshkar classic songs",
    ],
    "mistry": [
        "80s 90s bollywood superhit songs",
        "90s hindi romantic kumar sanu alka yagnik",
        "90s bollywood evergreen melodies",
        "udit narayan kavita krishnamurthy hits",
    ],
    "tractor": [
        "bollywood romantic love songs",
        "hindi love songs acoustic melodious arijit",
        "latest bollywood romantic songs hits",
        "shreya ghoshal romantic bollywood songs",
    ],
    "love": [
        "bollywood heartbreak sad emotional songs",
        "hindi sad songs arijit atif aslam",
        "heart touching hindi emotional sad songs",
        "dard bhare nagme hindi songs",
    ],
    "party": [
        "bollywood high energy dance party songs",
        "hindi club party hits dance songs",
        "bollywood dance anthems hits",
        "hindi party mashup dance tracks",
    ],
    "marathi": [
        "marathi high energy dance songs zingaat",
        "marathi dhol tasha dance hits",
        "marathi party dance songs ajay atul",
        "marathi dj song lavani dance",
    ],
    "marathiLove": [
        "marathi romantic love songs prem geete",
        "marathi love songs romantic melodies",
        "marathi romantic songs lyrical hits",
        "swapnil bandodkar marathi romantic songs",
    ],
}


@router.get("/recommendations", response_model=list[Video])
async def recommendations(
    request: Request,
    theme_id: str = Query("chai"),
    exclude_ids: str = Query(""),
) -> list[Video]:
    theme = theme_id.strip()
    queries = THEME_GENRE_QUERIES.get(theme) or THEME_GENRE_QUERIES["chai"]
    selected_query = random.choice(queries)

    exclude_set = set(filter(None, [x.strip() for x in exclude_ids.split(",")]))

    try:
        raw_items = await asyncio.to_thread(client(request)._search_ytdlp_sync, selected_query)
    except Exception:
        raw_items = []

    filtered: list[Video] = []
    seen: set[str] = set()
    for item in raw_items:
        vid = item.get("url") or item.get("id") or ""
        if not vid or vid in exclude_set or vid in seen:
            continue
        title = item.get("title") or ""
        if not title:
            continue
        seen.add(vid)
        filtered.append(
            Video(
                id=vid,
                title=title,
                uploaderName=str(item.get("uploaderName") or item.get("uploader") or ""),
                duration=int(item.get("duration") or 0),
                thumbnailUrl=str(item.get("thumbnailUrl") or f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"),
            )
        )
    return filtered[:15]


@router.get("/search", response_model=list[Video])
async def search(request: Request, q: str = Query(min_length=1, max_length=120)) -> list[Video]:
    query = " ".join(q.split())
    if not query:
        raise HTTPException(400, "Search query cannot be blank")
    try:
        items = await client(request).search(filters.transform_query(query))
    except PipedError as exc:
        raise piped_error(exc) from exc
    return filters.sanitize(items)


@router.get("/playlist", response_model=PlaylistResponse)
async def playlist(request: Request, id: str = Query()) -> PlaylistResponse:
    playlist_id = id.strip()
    if not PLAYLIST_ID.fullmatch(playlist_id):
        raise HTTPException(400, "Invalid playlist id")
    try:
        data = await client(request).playlist(playlist_id)
    except PipedError as exc:
        raise piped_error(exc) from exc
    items = filters.sanitize(data.get("relatedStreams") or [])
    return PlaylistResponse(
        id=playlist_id,
        name=str(data.get("name") or "Untitled playlist"),
        uploaderName=str(data.get("uploader") or ""),
        thumbnailUrl=data.get("thumbnailUrl") or data.get("bannerUrl"),
        totalVideos=int(data.get("videos") or len(items)),
        items=items,
    )


@router.get("/get_stream", response_model=StreamResponse)
async def get_stream(
    request: Request,
    video_id: str = Query(),
    force_refresh: bool = Query(False),
) -> StreamResponse:
    safe_id = video_id.strip()
    if not VIDEO_ID.fullmatch(safe_id):
        raise HTTPException(400, "Invalid video id")

    now = time.time()
    if not force_refresh and safe_id in _stream_cache:
        cached_resp, cached_time = _stream_cache[safe_id]
        if now - cached_time < CACHE_TTL:
            return cached_resp
        else:
            _stream_cache.pop(safe_id, None)

    try:
        data = await client(request).streams(safe_id)
    except PipedError as exc:
        raise piped_error(exc) from exc
    title = str(data.get("title") or "").strip()
    artist = str(data.get("uploader") or "").strip()
    duration = int(data.get("duration") or 0)
    streams = [stream for stream in data.get("audioStreams") or [] if stream.get("url")]
    preferred = [stream for stream in streams if str(stream.get("format") or "").casefold() in {"m4a", "webm"}]
    selected_list = preferred if preferred else streams
    if not selected_list:
        raise HTTPException(404, "No M4A or WebM audio stream found")
    selected_list.sort(
        key=lambda stream: (
            str(stream.get("format") or "").casefold() == "m4a",
            int(stream.get("bitrate") or 0),
        ),
        reverse=True,
    )
    selected = selected_list[0]
    raw_stream_url = str(selected["url"])
    proxy_url = str(request.url_for("proxy_audio")) + f"?url={quote(raw_stream_url, safe='')}&video_id={safe_id}"
    response_obj = StreamResponse(
        video_id=safe_id,
        title=title,
        artist=artist,
        duration=duration,
        audio_url=proxy_url,
        format=str(selected.get("format") or "").casefold(),
        bitrate=selected.get("bitrate"),
    )
    _stream_cache[safe_id] = (response_obj, now)
    return response_obj

