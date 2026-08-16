#!/usr/bin/env python3
"""Download the YouTube songs listed in list.txt into the songs directory."""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

try:
    import yt_dlp
except ImportError:
    print(
        "yt-dlp is not installed. Run: python -m pip install yt-dlp",
        file=sys.stderr,
    )
    raise SystemExit(1)


URL_PATTERN = re.compile(r"https?://(?:www\.)?(?:youtube\.com|youtu\.be)/\S+", re.I)


def read_urls(list_file: Path) -> list[str]:
    """Extract YouTube URLs from plain URLs or '- title: URL' list entries."""
    urls: list[str] = []
    seen: set[str] = set()

    for line_number, raw_line in enumerate(
        list_file.read_text(encoding="utf-8-sig").splitlines(), start=1
    ):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue

        match = URL_PATTERN.search(line)
        if not match:
            # Category headings and other notes are intentionally ignored.
            continue

        url = match.group(0).rstrip(")]},.;")
        if url not in seen:
            seen.add(url)
            urls.append(url)

    return urls


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download songs from a text file with yt-dlp."
    )
    parser.add_argument("list_file", nargs="?", default="list.txt")
    parser.add_argument("--output", "-o", default="songs")
    args = parser.parse_args()

    list_file = Path(args.list_file)
    output_dir = Path(args.output)

    if not list_file.is_file():
        print(f"List file not found: {list_file}", file=sys.stderr)
        return 1
    if shutil.which("ffmpeg") is None:
        print(
            "FFmpeg was not found. Install FFmpeg and ensure 'ffmpeg' is on PATH.",
            file=sys.stderr,
        )
        return 1

    urls = read_urls(list_file)
    if not urls:
        print(f"No YouTube URLs found in {list_file}.", file=sys.stderr)
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)
    archive = output_dir / ".downloaded.txt"
    options = {
        "format": "bestaudio/best",
        "outtmpl": str(output_dir / "%(title)s [%(id)s].%(ext)s"),
        "download_archive": str(archive),
        "ignoreerrors": True,
        "noplaylist": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            },
            {"key": "FFmpegMetadata"},
        ],
    }

    print(f"Found {len(urls)} song(s). Saving them to: {output_dir.resolve()}")
    with yt_dlp.YoutubeDL(options) as downloader:
        result = downloader.download(urls)

    if result:
        print("Some songs could not be downloaded; see the messages above.", file=sys.stderr)
        return 1
    print("Downloads complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
