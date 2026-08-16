"""Asynchronous Piped API client with per-request instance failover."""

import asyncio
from typing import Any

import httpx
import yt_dlp


PIPED_INSTANCES = (
    "https://pipedapi.kavin.rocks",
    "https://api.piped.privacydev.net",
    "https://pipedapi.mha.fi",
)


class PipedError(RuntimeError):
    pass


class PipedNotFoundError(PipedError):
    pass


class PipedClient:
    def __init__(self, instances: tuple[str, ...] = PIPED_INSTANCES) -> None:
        self.instances = instances
        self._next_instance = 0
        self._lock = asyncio.Lock()
        self.http = httpx.AsyncClient(
            follow_redirects=True,
            timeout=httpx.Timeout(15.0, connect=6.0),
            headers={"Accept": "application/json", "User-Agent": "Mahaul/1.0"},
        )

    async def close(self) -> None:
        await self.http.aclose()

    async def fetch_with_fallback(
        self,
        endpoint_path: str,
        params: dict[str, str] | None = None,
    ) -> dict[str, Any] | list[dict[str, Any]]:
        async with self._lock:
            start = self._next_instance
            self._next_instance = (self._next_instance + 1) % len(self.instances)

        failures: list[str] = []
        saw_not_found = False
        for offset in range(len(self.instances)):
            instance = self.instances[(start + offset) % len(self.instances)]
            try:
                response = await self.http.get(f"{instance}{endpoint_path}", params=params)
            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                failures.append(f"{instance}: {type(exc).__name__}")
                continue
            if response.status_code == 404:
                saw_not_found = True
                failures.append(f"{instance}: HTTP 404")
                continue
            if response.status_code != 200:
                failures.append(f"{instance}: HTTP {response.status_code}")
                continue
            try:
                return response.json()
            except ValueError:
                failures.append(f"{instance}: invalid JSON")

        if saw_not_found and all("404" in failure for failure in failures):
            raise PipedNotFoundError("The requested Piped resource was not found")
        raise PipedError("All Piped instances failed: " + "; ".join(failures))

    def _search_ytdlp_sync(self, query: str) -> list[dict[str, Any]]:
        ydl_opts = {
            "extract_flat": True,
            "skip_download": True,
            "quiet": True,
            "no_warnings": True,
            "extractor_args": {
                "youtube": {
                    "player_client": ["android", "ios", "mweb", "web"],
                }
            },
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            res = ydl.extract_info(f"ytsearch15:{query}", download=False)
            items: list[dict[str, Any]] = []
            for entry in (res or {}).get("entries", []):
                if not entry:
                    continue
                vid = entry.get("id")
                if not vid:
                    continue
                items.append({
                    "url": vid,
                    "title": entry.get("title") or "",
                    "uploaderName": entry.get("uploader") or entry.get("channel") or "",
                    "duration": entry.get("duration"),
                    "thumbnailUrl": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                    "type": "stream",
                })
            return items

    def _playlist_ytdlp_sync(self, playlist_id: str) -> dict[str, Any]:
        ydl_opts = {
            "extract_flat": True,
            "skip_download": True,
            "quiet": True,
            "no_warnings": True,
            "extractor_args": {
                "youtube": {
                    "player_client": ["android", "ios", "mweb", "web"],
                }
            },
        }
        url = playlist_id if playlist_id.startswith("http") else f"https://www.youtube.com/playlist?list={playlist_id}"
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                res = ydl.extract_info(url, download=False)
            except Exception as exc:
                raise PipedNotFoundError(f"Playlist {playlist_id} not found") from exc

            entries = (res or {}).get("entries", [])
            items: list[dict[str, Any]] = []
            for entry in entries:
                if not entry:
                    continue
                vid = entry.get("id")
                if not vid:
                    continue
                items.append({
                    "url": vid,
                    "title": entry.get("title") or "",
                    "uploaderName": entry.get("uploader") or entry.get("channel") or "",
                    "duration": entry.get("duration"),
                    "thumbnailUrl": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg",
                    "type": "stream",
                })
            first_id = items[0]["url"] if items else ""
            return {
                "name": (res or {}).get("title") or "Untitled playlist",
                "uploader": (res or {}).get("uploader") or (res or {}).get("channel") or "",
                "thumbnailUrl": f"https://i.ytimg.com/vi/{first_id}/hqdefault.jpg" if first_id else None,
                "videos": len(items),
                "relatedStreams": items,
            }

    def _streams_ytdlp_sync(self, video_id: str) -> dict[str, Any]:
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            "extractor_args": {
                "youtube": {
                    "player_client": ["android", "ios", "mweb", "web"],
                }
            },
        }
        url = f"https://www.youtube.com/watch?v={video_id}"
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
            except Exception as exc:
                raise PipedNotFoundError(f"Video {video_id} not found") from exc

            audio_streams: list[dict[str, Any]] = []
            for f in (info or {}).get("formats", []):
                if f.get("acodec") != "none" and f.get("url"):
                    audio_streams.append({
                        "url": f["url"],
                        "format": str(f.get("ext") or "m4a").casefold(),
                        "bitrate": int(f.get("abr") or f.get("tbr") or 128) * 1000,
                        "is_audio_only": f.get("vcodec") == "none",
                    })
            if not audio_streams:
                raise PipedNotFoundError(f"No valid audio stream found for {video_id}")

            audio_streams.sort(key=lambda s: (s["is_audio_only"], s["bitrate"]), reverse=True)

            return {
                "title": (info or {}).get("title") or "",
                "uploader": (info or {}).get("uploader") or (info or {}).get("channel") or "",
                "duration": int((info or {}).get("duration") or 0),
                "audioStreams": audio_streams,
            }

    async def search(self, query: str) -> list[dict[str, Any]]:
        try:
            data = await self.fetch_with_fallback(
                "/search",
                params={"q": query, "filter": "music_songs"},
            )
            return data.get("items", []) if isinstance(data, dict) else data
        except PipedError:
            return await asyncio.to_thread(self._search_ytdlp_sync, query)

    async def playlist(self, playlist_id: str) -> dict[str, Any]:
        try:
            data = await self.fetch_with_fallback(f"/playlists/{playlist_id}")
            if not isinstance(data, dict):
                raise PipedError("Piped returned an invalid playlist response")
            return data
        except PipedError:
            return await asyncio.to_thread(self._playlist_ytdlp_sync, playlist_id)

    async def streams(self, video_id: str) -> dict[str, Any]:
        # Always use local yt-dlp first because YouTube binds googlevideo URLs
        # to the client's IP. URLs from remote Piped instances trigger 403 Forbidden.
        try:
            return await asyncio.to_thread(self._streams_ytdlp_sync, video_id)
        except Exception:
            try:
                data = await self.fetch_with_fallback(f"/streams/{video_id}")
                if isinstance(data, dict):
                    return data
            except Exception:
                pass
            raise PipedNotFoundError(f"No audio stream found for video {video_id}")


