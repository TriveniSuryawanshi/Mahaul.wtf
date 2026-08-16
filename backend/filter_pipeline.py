"""Strict metadata filtering for the curated 90s Bollywood catalogue."""

import re
from typing import Any
from urllib.parse import parse_qs, urlparse

from .models import Video


class FilterPipeline:
    MIN_DURATION = 90
    MAX_DURATION = 12 * 60
    QUERY_SUFFIX = "90s bollywood song -vlog -reaction -interview"
    BLACKLIST = (
        "vlog", "reaction", "interview", "behind the scenes", "making of",
        "review", "status", "remix 2026", "trailer", "short",
    )

    def transform_query(self, query: str) -> str:
        return f"{' '.join(query.split())} {self.QUERY_SUFFIX}"

    def is_allowed(self, title: str, channel: str, duration: int | None) -> bool:
        if duration is None or not self.MIN_DURATION <= duration <= self.MAX_DURATION:
            return False
        text = re.sub(r"\s+", " ", f"{title} {channel}".casefold())
        return not any(term in text for term in self.BLACKLIST)

    def sanitize(self, items: list[dict[str, Any]]) -> list[Video]:
        results: list[Video] = []
        seen: set[str] = set()
        for item in items:
            item_type = str(item.get("type") or "stream").casefold()
            if item_type not in {"stream", "video"}:
                continue
            video_id = self._video_id(str(item.get("url") or item.get("id") or ""))
            title = str(item.get("title") or "").strip()
            uploader = str(item.get("uploaderName") or item.get("uploader") or "").strip()
            duration = self._duration(item.get("duration"))
            thumbnail = str(item.get("thumbnailUrl") or item.get("thumbnail") or "").strip()
            if not video_id or video_id in seen or not title or not thumbnail:
                continue
            if not self.is_allowed(title, uploader, duration):
                continue
            seen.add(video_id)
            results.append(Video(
                id=video_id,
                title=title,
                uploaderName=uploader,
                duration=duration,
                thumbnailUrl=thumbnail,
            ))
        return results

    @staticmethod
    def _duration(value: Any) -> int | None:
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str) and value.isdigit():
            return int(value)
        return None

    @staticmethod
    def _video_id(value: str) -> str:
        if re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
            return value
        parsed = urlparse(value)
        query_id = parse_qs(parsed.query).get("v", [""])[0]
        if re.fullmatch(r"[A-Za-z0-9_-]{11}", query_id):
            return query_id
        match = re.search(r"(?:watch\?v=|youtu\.be/)([A-Za-z0-9_-]{11})", value)
        return match.group(1) if match else ""
