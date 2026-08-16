from pydantic import BaseModel, Field, HttpUrl


class Video(BaseModel):
    id: str = Field(pattern=r"^[A-Za-z0-9_-]{11}$")
    title: str = Field(min_length=1)
    uploaderName: str
    duration: int = Field(ge=0)
    thumbnailUrl: str


class PlaylistResponse(BaseModel):
    id: str
    name: str
    uploaderName: str
    thumbnailUrl: str | None = None
    totalVideos: int = Field(ge=0)
    items: list[Video]


class StreamResponse(BaseModel):
    video_id: str = Field(pattern=r"^[A-Za-z0-9_-]{11}$")
    title: str
    artist: str
    duration: int = Field(ge=0)
    audio_url: HttpUrl
    format: str
    bitrate: int | None = None
