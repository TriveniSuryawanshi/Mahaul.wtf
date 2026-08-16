import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronDown, Coffee, Flame, Heart, HeartCrack, ListMusic, ListOrdered, PartyPopper, Pause, Play, Search, Shuffle, SkipBack, SkipForward, Sparkles, Volume2, Wrench } from 'lucide-react';
import './styles.css';
import chaiImage from './assets/chai/chaitapri3.png';
import mistryImage from './assets/mistry/RajuElectrician2.png';
import loveImage from './assets/love/couplemain2.png';
import breakupImage from './assets/breakup/breakup3.png';
import partyImage from './assets/party/party.jpg';
import marathiDanceImage from './assets/marathi/marathiDance.png';
import marathiLoveImage from './assets/marathi/marathiLove.png';
import songListRaw from '../list.txt?raw';
import songHtml80s90sRaw from '../80-90s songs.html?raw';
import songHtml60s70sRaw from '../60-70s songs.html?raw';
import songHtmlLoveRaw from '../lovesongs.html?raw';
import songHtmlBreakupRaw from '../breakupsongs.html?raw';
import songHtmlDanceRaw from '../dance.html?raw';
import songHtmlMarathiRaw from '../MarathiDance.html?raw';
import songHtmlMarathiLoveRaw from '../marathilove.html?raw';

const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.protocol}//${window.location.hostname}:2439` : '');

const titleMap = new Map(
  [...songListRaw.matchAll(/^\s*-\s*(.+?):\s*https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/gm)]
    .map((match) => [match[2], match[1].trim()])
);

const parsePlaylist = (rawHtml, eraLabel) => {
  const ids = [...new Set([...rawHtml.matchAll(/watch\?v=([\w-]{11})/g)].map((m) => m[1]))];
  return ids.map((videoId, index) => ({
    id: videoId,
    videoId,
    title: titleMap.get(videoId) || `${eraLabel} Song #${index + 1}`,
  }));
};

const themePlaylists = {
  chai: parsePlaylist(songHtml60s70sRaw, '60s-70s'),
  mistry: parsePlaylist(songHtml80s90sRaw, '80s-90s'),
  tractor: parsePlaylist(songHtmlLoveRaw, 'Love Songs'),
  love: parsePlaylist(songHtmlBreakupRaw, 'Breakup Songs'),
  party: parsePlaylist(songHtmlDanceRaw, 'Party Mode'),
  marathi: parsePlaylist(songHtmlMarathiRaw, 'Marathi Dance'),
  marathiLove: parsePlaylist(songHtmlMarathiLoveRaw, 'Marathi Love'),
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

const themes = [
  {
    id: 'chai', name: 'Chai Nukkad', eyebrow: 'Shaam ki chai', title: 'The corner where time slows down.',
    caption: 'Steam in the air, old 60s & 70s songs on the radio, and nowhere else to be.', track: 'Lag Jaa Gale', artist: '60s & 70s Classics',
    image: chaiImage, colors: ['#e9a154', '#a94227'], icon: Coffee,
  },
  {
    id: 'tractor', name: 'Pehla Pyaar', eyebrow: 'Pyar ka mausam', title: 'Golden sunlight and songs close to the heart.',
    caption: 'Warm sunshine, sweet laughter, and timeless melodies that make every moment romantic.', track: 'Kesariya', artist: 'Love Classics',
    image: loveImage, colors: ['#ff4d6d', '#800f2f'], icon: Heart,
  },
  {
    id: 'mistry', name: 'Raju Mistry', eyebrow: 'Kaam ke baad', title: 'Golden hour on a half-built roof.',
    caption: 'Dust settles, tools go quiet, and 80s & 90s hits carry across the city.', track: 'Ek Ladki Ko Dekha', artist: '1942: A Love Story · 1994',
    image: mistryImage, colors: ['#db9b55', '#8d352d'], icon: Wrench,
  },
  {
    id: 'love', name: 'Dil Ka Tootna', eyebrow: 'Toote dil ki aawaaz', title: 'When silence speaks louder than words.',
    caption: 'Quiet nights, fading memories, and songs for a heart learning to heal.', track: 'Tadap Tadap Ke', artist: 'Hum Dil De Chuke Sanam',
    image: breakupImage, colors: ['#a2d2ff', '#3d5a80'], icon: HeartCrack,
  },
  {
    id: 'party', name: 'Party Mode', eyebrow: 'Desi Beats & Dhol', title: 'Turn up the bass and let the celebration begin.',
    caption: 'High energy beats, iconic dance steps, and non-stop party anthems that set the floor on fire.', track: 'Party Hits', artist: 'Dance Anthems',
    image: partyImage, colors: ['#ff007f', '#7928ca'], icon: PartyPopper,
  },
  {
    id: 'marathi', name: 'Marathi Dance', eyebrow: 'Dhol Tasha & Zingaat', title: 'High energy beats and unstoppable celebration.',
    caption: 'Thunderous dhol tasha, electrifying folk rhythms, and non-stop Marathi dance anthems.', track: 'Zingaat', artist: 'Marathi Hits',
    image: marathiDanceImage, colors: ['#ff5400', '#9d0208'], icon: Flame,
  },
  {
    id: 'marathiLove', name: 'Marathi Love', eyebrow: 'Premache Sparsh', title: 'Soulful melodies and romantic echoes.',
    caption: 'Gentle breeze, heartfelt Marathi lyrics, and timeless melodies of love.', track: 'Marathi Romantic', artist: 'Marathi Love Classics',
    image: marathiLoveImage, colors: ['#e07a5f', '#8d352d'], icon: Heart,
  },
];

function App() {
  const [activeId, setActiveId] = useState('chai');
  const [brandLang, setBrandLang] = useState('en');
  const [brandFlipping, setBrandFlipping] = useState(false);
  const [previousImage, setPreviousImage] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(68);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [songMenuOpen, setSongMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [songIndex, setSongIndex] = useState(0);
  const [streamUrl, setStreamUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playerStatus, setPlayerStatus] = useState('Preparing playlist…');
  const [songTitles, setSongTitles] = useState({});
  const [isShuffle, setIsShuffle] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const [dynamicPlaylists, setDynamicPlaylists] = useState(themePlaylists);
  const [isRadioMode, setIsRadioMode] = useState(false);
  
  const fadeTimer = useRef();
  const audioRef = useRef(null);
  const requestRef = useRef(0);
  const objectUrlRef = useRef('');
  const streamCache = useRef(new Map());
  const autoPlayRef = useRef(false);
  const playedIdsRef = useRef(new Set());
  const isFetchingRadioRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBrandFlipping(true);
      setTimeout(() => {
        setBrandLang((prev) => (prev === 'en' ? 'mr' : 'en'));
        setBrandFlipping(false);
      }, 350);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const active = themes.find((theme) => theme.id === activeId);
  const songs = dynamicPlaylists[activeId] || themePlaylists[activeId] || themePlaylists.chai;
  const currentSong = songs[songIndex] || songs[0];
  const currentSongTitle = (currentSong && (songTitles[currentSong.videoId] || currentSong.title)) || 'Your playlist';
  const thumbnailUrl = `https://i.ytimg.com/vi/${currentSong?.videoId}/hqdefault.jpg`;

  useEffect(() => () => {
    clearTimeout(fadeTimer.current);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const fetchStream = async (videoId, forceRefresh = false) => {
    if (!forceRefresh && streamCache.current.has(videoId)) {
      const cached = streamCache.current.get(videoId);
      if (cached && cached.title) {
        setSongTitles((prev) => (prev[videoId] === cached.title ? prev : { ...prev, [videoId]: cached.title }));
      }
      return cached;
    }
    try {
      const endpoint = API_URL ? `${API_URL}/api/v1/get_stream` : `/api/v1/get_stream`;
      const response = await fetch(`${endpoint}?video_id=${encodeURIComponent(videoId)}${forceRefresh ? '&force_refresh=true' : ''}`);
      if (!response.ok) return null;
      const payload = await response.json();
      if (!payload || !payload.audio_url) return null;
      streamCache.current.set(videoId, payload);
      if (payload && payload.title) {
        setSongTitles((prev) => (prev[videoId] === payload.title ? prev : { ...prev, [videoId]: payload.title }));
      }
      return payload;
    } catch {
      return null;
    }
  };

  const prefetchUpcoming = (playlist, currentIndex) => {
    for (let offset = 1; offset <= 5; offset++) {
      const nextIdx = (currentIndex + offset) % playlist.length;
      const nextSong = playlist[nextIdx];
      if (nextSong && !streamCache.current.has(nextSong.videoId)) {
        fetchStream(nextSong.videoId);
      }
    }
  };

  const fetchMoreGenreTracks = async (themeId) => {
    if (isFetchingRadioRef.current) return;
    isFetchingRadioRef.current = true;
    try {
      const excludeList = Array.from(playedIdsRef.current).join(',');
      const endpoint = API_URL ? `${API_URL}/api/v1/recommendations` : `/api/v1/recommendations`;
      const res = await fetch(`${endpoint}?theme_id=${encodeURIComponent(themeId)}&exclude_ids=${encodeURIComponent(excludeList)}`);
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          const newSongs = items.map((item) => ({
            id: item.id,
            videoId: item.id,
            title: item.title,
          }));
          setDynamicPlaylists((prev) => {
            const existing = prev[themeId] || themePlaylists[themeId] || [];
            const existingIds = new Set(existing.map((s) => s.videoId));
            const fresh = newSongs.filter((s) => !existingIds.has(s.videoId));
            if (fresh.length === 0) return prev;
            return {
              ...prev,
              [themeId]: [...existing, ...fresh],
            };
          });
          setIsRadioMode(true);
          newSongs.slice(0, 3).forEach((s) => fetchStream(s.videoId));
        }
      }
    } catch (err) {
      console.warn('Error fetching recommendations:', err);
    } finally {
      isFetchingRadioRef.current = false;
    }
  };

  // On app startup: preload the first 5 songs of ALL themes in parallel batches
  useEffect(() => {
    let isCancelled = false;
    const preloadFirst5AllThemes = async () => {
      const allPlaylists = Object.values(themePlaylists);
      for (const playlist of allPlaylists) {
        if (isCancelled) break;
        const first5 = playlist.slice(0, 5);
        for (const song of first5) {
          if (isCancelled) break;
          if (!streamCache.current.has(song.videoId)) {
            await fetchStream(song.videoId);
            await new Promise((r) => setTimeout(r, 30));
          }
        }
      }
    };
    preloadFirst5AllThemes();
    return () => { isCancelled = true; };
  }, []);

  // Continuous background catalog preloader for current theme
  useEffect(() => {
    let isCancelled = false;
    const preloadAll = async () => {
      for (let i = 0; i < songs.length; i++) {
        if (isCancelled) break;
        const song = songs[i];
        if (!streamCache.current.has(song.videoId)) {
          await fetchStream(song.videoId);
          await new Promise((r) => setTimeout(r, 50));
        }
      }
    };
    preloadAll();
    return () => { isCancelled = true; };
  }, [activeId]);

  const loadTrackForPlaylist = async (playlist, index, autoplay = false) => {
    const song = playlist[index];
    if (!song) return;
    playedIdsRef.current.add(song.videoId);

    // If approaching the end of curated playlist or in radio mode, prefetch more genre tracks in background
    if (index >= playlist.length - 2) {
      fetchMoreGenreTracks(activeId);
    }

    const requestId = ++requestRef.current;
    autoPlayRef.current = autoplay;
    setCurrentTime(0);
    setDuration(0);
    setPlayerStatus(isRadioMode ? 'Endless Radio · Same Genre' : 'From your playlist');

    let payload = streamCache.current.get(song.videoId);
    if (!payload) {
      payload = await fetchStream(song.videoId);
    }

    if (requestId !== requestRef.current) return;

    if (!payload || !payload.audio_url) {
      consecutiveErrorsRef.current += 1;
      if (consecutiveErrorsRef.current >= 3) {
        setPlayerStatus('Backend API offline · Deploy backend & set VITE_API_URL');
        setPlaying(false);
        return;
      }
      setPlayerStatus('Track unavailable, skipping…');
      setTimeout(() => playNext(true), 1200);
      return;
    }

    consecutiveErrorsRef.current = 0;

    if (payload.title) {
      song.title = payload.title;
      setSongTitles((prev) => (prev[song.videoId] === payload.title ? prev : { ...prev, [song.videoId]: payload.title }));
    }

    setStreamUrl(payload.audio_url);
    setDuration(payload.duration || 0);
    setPlayerStatus(isRadioMode ? 'Endless Radio · Same Genre' : 'From your playlist');

    if (audioRef.current) {
      audioRef.current.src = payload.audio_url;
      if (autoplay) {
        audioRef.current.play().then(() => setPlaying(true)).catch((err) => {
          console.warn('Autoplay error:', err);
          setPlayerStatus('Press play to start');
        });
      }
    }

    prefetchUpcoming(playlist, index);
  };

  const loadTrack = (index, autoplay = false) => {
    loadTrackForPlaylist(songs, index, autoplay);
  };

  useEffect(() => {
    loadTrack(songIndex, false);
    return () => { requestRef.current += 1; };
  }, []);

  const playNext = async (autoplay = true) => {
    const currentList = dynamicPlaylists[activeId] || themePlaylists[activeId] || themePlaylists.chai;
    if (currentList.length === 0) return;

    let nextIndex;
    if (isShuffle) {
      const unplayed = currentList
        .map((_, i) => i)
        .filter((i) => i !== songIndex && !playedIdsRef.current.has(currentList[i]?.videoId));

      if (unplayed.length > 0) {
        nextIndex = unplayed[Math.floor(Math.random() * unplayed.length)];
      } else if (currentList.length > 1) {
        nextIndex = songIndex;
        while (nextIndex === songIndex) nextIndex = Math.floor(Math.random() * currentList.length);
        fetchMoreGenreTracks(activeId);
      } else {
        nextIndex = 0;
      }
      setSongIndex(nextIndex);
      loadTrackForPlaylist(currentList, nextIndex, autoplay);
    } else {
      nextIndex = songIndex + 1;
      if (nextIndex < currentList.length) {
        if (nextIndex >= currentList.length - 2) {
          fetchMoreGenreTracks(activeId);
        }
        setSongIndex(nextIndex);
        loadTrackForPlaylist(currentList, nextIndex, autoplay);
      } else {
        // Reached the end of the playlist -> seamless transition to Endless Radio Mode
        setPlayerStatus('Loading endless genre radio…');
        await fetchMoreGenreTracks(activeId);
        setDynamicPlaylists((latest) => {
          const updated = latest[activeId] || currentList;
          if (updated.length > nextIndex) {
            setSongIndex(nextIndex);
            loadTrackForPlaylist(updated, nextIndex, autoplay);
          } else {
            setSongIndex(0);
            loadTrackForPlaylist(updated, 0, autoplay);
          }
          return latest;
        });
      }
    }
  };

  const playPrevious = () => {
    const currentList = dynamicPlaylists[activeId] || themePlaylists[activeId] || themePlaylists.chai;
    if (currentList.length < 2) return;
    let prevIndex;
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * currentList.length);
    } else {
      prevIndex = (songIndex - 1 + currentList.length) % currentList.length;
    }
    setSongIndex(prevIndex);
    loadTrackForPlaylist(currentList, prevIndex, true);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !streamUrl) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch((error) => setPlayerStatus(`Playback failed: ${error.name}`));
    } else audioRef.current.pause();
  };

  const handleSeekChange = (event) => {
    const newTime = Number(event.target.value);
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSongTitle,
      artist: isRadioMode ? 'Mahaul · Endless Radio' : 'Mahaul · playlist',
      album: active.name,
    });
    navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext(true));
    navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    };
  }, [songIndex, activeId, songTitles, isShuffle, isRadioMode]);

  const selectTheme = (nextId) => {
    if (nextId === activeId) return;
    setPreviousImage(active.image);
    setActiveId(nextId);
    setThemeMenuOpen(false);
    setSearchQuery('');
    setIsRadioMode(false);
    playedIdsRef.current.clear();

    // Stop current track immediately
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);

    // Reset to new theme's curated playlist first
    const curatedPlaylist = themePlaylists[nextId] || themePlaylists.chai;
    setDynamicPlaylists((prev) => ({
      ...prev,
      [nextId]: curatedPlaylist,
    }));
    const newIndex = 0;
    setSongIndex(newIndex);
    loadTrackForPlaylist(curatedPlaylist, newIndex, true);

    clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => setPreviousImage(null), 900);
  };

  const filteredSongs = songs
    .map((song, originalIndex) => ({ song, originalIndex }))
    .filter(({ song, originalIndex }) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (songTitles[song.videoId] || song.title).toLowerCase();
      return (
        title.includes(q) ||
        (originalIndex + 1).toString().includes(q)
      );
    });

  return (
    <main className={`app theme-${active.id}`} style={{ '--bg-image': `url("${active.image}")`, '--accent': active.colors[0], '--deep': active.colors[1] }}>
      <div className="background current" aria-hidden="true" />
      {previousImage && <div className="background previous" style={{ backgroundImage: `url("${previousImage}")` }} aria-hidden="true" />}
      <div className="grain" aria-hidden="true" />

      <nav className="nav">
        <a className={`brand ${brandFlipping ? 'flipping' : ''}`} href="#top" aria-label="Mahaul home">
          <span className="brand-text">{brandLang === 'en' ? 'mahaul' : 'माहौल'}</span>
          <span className="brand-dot">.</span>
        </a>
        
        <div className="nav-right">
          {/* Song Picker Dropdown */}
          <div className="select-wrap">
            <button
              className="select-button song-select-btn"
              onClick={() => { setSongMenuOpen(!songMenuOpen); setThemeMenuOpen(false); }}
              aria-expanded={songMenuOpen}
            >
              <ListMusic size={16} />
              <span>Select Song</span>
              <ChevronDown size={15} />
            </button>
            {songMenuOpen && (
              <div className="song-menu">
                <div className="song-menu-header">Playlist ({songs.length} tracks){isRadioMode ? ' · Endless Radio' : ''}</div>
                <div className="song-menu-search">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search songs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="song-search-input"
                    autoFocus
                  />
                </div>
                <div className="song-menu-list">
                  {filteredSongs.length > 0 ? (
                    filteredSongs.map(({ song, originalIndex }) => (
                      <button
                        key={song.videoId}
                        className={originalIndex === songIndex ? 'selected' : ''}
                        onClick={() => {
                          setSongIndex(originalIndex);
                          loadTrack(originalIndex, true);
                          setSongMenuOpen(false);
                        }}
                      >
                        <img
                          className="song-item-thumb"
                          src={`https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`}
                          alt=""
                          loading="lazy"
                        />
                        <span className="song-num">{(originalIndex + 1).toString().padStart(2, '0')}</span>
                        <span className="song-name">{songTitles[song.videoId] || song.title}</span>
                      </button>
                    ))
                  ) : (
                    <div className="no-songs-found">No songs match "{searchQuery}"</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Picker Dropdown */}
          <div className="select-wrap">
            <button
              className="select-button"
              onClick={() => { setThemeMenuOpen(!themeMenuOpen); setSongMenuOpen(false); }}
              aria-expanded={themeMenuOpen}
            >
              <span>{active.name}</span>
              <ChevronDown size={16} />
            </button>
            {themeMenuOpen && (
              <div className="theme-menu">
                {themes.map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <button
                      key={theme.id}
                      className={theme.id === activeId ? 'selected' : ''}
                      onClick={() => selectTheme(theme.id)}
                    >
                      <Icon size={16} />
                      <span>{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="copy" key={active.id}>
          <p className="eyebrow">{active.eyebrow}</p>
          <h1>{active.title}</h1>
          <p className="caption">{active.caption}</p>
        </div>
      </section>

      {/* Floating Compact Bottom Player */}
      <div className={`compact-player ${playing ? 'is-playing' : ''}`}>
        <div className="player-thumb-wrap">
          <img className="player-thumb" src={thumbnailUrl} alt={currentSongTitle} />
        </div>
        <div className="player-center">
          <div className="track-title-row">
            <strong className="track-name">{currentSongTitle}</strong>
            <span className="track-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <div className="progress-container">
            <input
              type="range"
              className="seek-slider"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeekChange}
              style={{ '--seek-progress': `${duration ? (currentTime / duration) * 100 : 0}%` }}
              aria-label="Seek progress"
            />
          </div>
        </div>
        <div className="player-controls">
          <button
            className={`skip-btn ${isShuffle ? 'active-mode' : ''}`}
            onClick={() => setIsShuffle(!isShuffle)}
            title={isShuffle ? 'Mode: Shuffle (Click for Sequential)' : 'Mode: Sequential (Click for Shuffle)'}
            aria-label={isShuffle ? 'Switch to Sequential mode' : 'Switch to Shuffle mode'}
          >
            {isShuffle ? <Shuffle size={17} /> : <ListOrdered size={17} />}
          </button>
          <button className="skip-btn" onClick={playPrevious} aria-label="Play previous song">
            <SkipBack fill="currentColor" size={19} />
          </button>
          <button className="play-btn" onClick={togglePlayback} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} />}
          </button>
          <button className="skip-btn" onClick={() => playNext(true)} aria-label="Play next song">
            <SkipForward fill="currentColor" size={19} />
          </button>
          <div className="volume-panel">
            <Volume2 size={18} />
            <input
              aria-label="Volume"
              type="range"
              min="0"
              max={duration ? 100 : 100}
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              style={{ '--volume': `${volume}%` }}
            />
          </div>
        </div>
        <audio
          ref={audioRef}
          src={streamUrl || undefined}
          preload="auto"
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || duration)}
          onCanPlay={() => {
            if (autoPlayRef.current && audioRef.current) {
              autoPlayRef.current = false;
              audioRef.current.play().catch(() => {});
            }
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => playNext(true)}
          onError={async () => {
            if (currentSong) {
              streamCache.current.delete(currentSong.videoId);
              setPlayerStatus('Refreshing stream…');
              const freshPayload = await fetchStream(currentSong.videoId, true);
              if (freshPayload && freshPayload.audio_url && audioRef.current) {
                setStreamUrl(freshPayload.audio_url);
                setDuration(freshPayload.duration || 0);
                audioRef.current.src = freshPayload.audio_url;
                audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlayerStatus('Press play to start'));
                return;
              }
            }
            if (streamUrl) setPlayerStatus('Stream expired — skip to continue');
          }}
        />
      </div>

      <footer>All music &amp; media rights belong to their respective copyright owners <span>·</span> mahaul.wtf <span>·</span> slow evenings &amp; long roads</footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);




