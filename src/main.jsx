import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronDown, Coffee, Download, Flame, Heart, HeartCrack, ListMusic, ListOrdered, PartyPopper, Pause, Play, Search, Shuffle, SkipBack, SkipForward, Sparkles, Volume2, Wrench, X } from 'lucide-react';
import './styles.css';
import chaiImage from './assets/chai/chaitapri3.png';
import mistryImage from './assets/mistry/RajuElectrician2.png';
import loveImage from './assets/love/couplemain2.png';
import breakupImage from './assets/breakup/breakup3.png';
import partyImage from './assets/party/party.jpg';
import marathiDanceImage from './assets/marathi/marathiDance.png';
import marathiLoveImage from './assets/marathi/marathiLove.png';
import songTitlesJson from './titles.json';
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
    title: songTitlesJson[videoId] || titleMap.get(videoId) || `${eraLabel} Song #${index + 1}`,
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
    caption: 'Long drives on village roads, gentle breeze, and sweet acoustic love melodies.', track: 'Pal Pal Dil Ke Paas', artist: 'Romantic Melodies',
    image: loveImage, colors: ['#ff88a3', '#a22d4f'], icon: Heart,
  },
  {
    id: 'mistry', name: 'Raju Mistry', eyebrow: 'Workshop Radio', title: 'Cassette deck on the workbench.',
    caption: 'Soldering smoke, screwdriver spins, and the greatest 80s & 90s Bollywood hits.', track: 'Tip Tip Barsa Paani', artist: '80s & 90s Hits',
    image: mistryImage, colors: ['#ffd166', '#a05c10'], icon: Wrench,
  },
  {
    id: 'love', name: 'Dard-e-Dil', eyebrow: 'Toota hua dil', title: 'Quiet nights and aching melodies.',
    caption: 'Dim streetlight through the rain, cigarettes, and deep melancholic heartbreak.', track: 'Channa Mereya', artist: 'Sad & Melancholic',
    image: breakupImage, colors: ['#90b4ce', '#2b4162'], icon: HeartCrack,
  },
  {
    id: 'party', name: 'Party Sharty', eyebrow: 'Full Bawaal', title: 'Bass boosted beats & wedding madness.',
    caption: 'Neon lights, dhol beats, and high energy dance anthems that get everyone grooving.', track: 'Kala Chashma', artist: 'Party & Dance Hits',
    image: partyImage, colors: ['#ff007f', '#7b2cbf'], icon: PartyPopper,
  },
  {
    id: 'marathi', name: 'Marathi Tadka', eyebrow: 'Aapla Mahaul', title: 'Dhol tasha, energetic beats & authentic roots.',
    caption: 'High-octane Marathi dance tracks and celebration anthems with unmatched energy.', track: 'Zingaat', artist: 'Marathi Energy Hits',
    image: marathiDanceImage, colors: ['#ff9933', '#cc3300'], icon: Flame,
  },
  {
    id: 'marathiLove', name: 'Marathi Love', eyebrow: 'Premache Rang', title: 'Heart-touching Marathi melodies.',
    caption: 'Gentle acoustic rhythms, poetic lyrics, and evergreen Marathi romantic melodies.', track: 'Chimbh Bhijalele', artist: 'Marathi Love Songs',
    image: marathiLoveImage, colors: ['#e76f51', '#9a031e'], icon: Sparkles,
  },
];

function TypewriterBrand() {
  const words = ['mahaul', 'माहौल'];
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('m');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    let timer;

    if (!isDeleting && displayText === currentWord) {
      // Pause at full word
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2400);
    } else if (isDeleting && displayText === '') {
      // Finished deleting, go to next word
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    } else {
      // Typing or deleting letters
      const speed = isDeleting ? 65 : 125;
      timer = setTimeout(() => {
        const nextText = isDeleting
          ? currentWord.substring(0, displayText.length - 1)
          : currentWord.substring(0, displayText.length + 1);
        setDisplayText(nextText);
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, wordIndex]);

  const currentLang = wordIndex === 0 ? 'en' : 'mr';

  return (
    <a className={`brand typewriter lang-${currentLang}`} href="#top" aria-label="Mahaul home">
      <span className="brand-text">{displayText || '\u00A0'}</span>
      <span className="brand-dot">.</span>
      <span className="typewriter-cursor" aria-hidden="true">|</span>
    </a>
  );
}

function App() {
  const [activeId, setActiveId] = useState('chai');
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
  const [playerStatus, setPlayerStatus] = useState('Ready');
  const [songTitles, setSongTitles] = useState(songTitlesJson || {});
  const [isShuffle, setIsShuffle] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  
  // PWA Install state
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  const ytReadyRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const fadeTimer = useRef();
  const audioRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const activeEngineRef = useRef('html5');
  const requestRef = useRef(0);
  const objectUrlRef = useRef('');
  const streamCache = useRef(new Map());
  const autoPlayRef = useRef(false);
  const playedPerPlaylistRef = useRef({});
  const consecutiveErrorsRef = useRef(0);
  const prefetchTimerRef = useRef(null);

  // Listen for PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      setDeferredInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) {
      alert("To install Mahaul on your device: tap your browser's menu (or Share button on iOS Safari) and select 'Add to Home Screen' / 'Install App' 📲");
      return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    setDeferredInstallPrompt(null);
  };

  // Close menus when tapping outside
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!event.target.closest('.select-wrap') && !event.target.closest('.song-menu') && !event.target.closest('.theme-menu')) {
        setSongMenuOpen(false);
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // Initialize YouTube IFrame API for fallback playback
  useEffect(() => {
    const initYT = () => {
      if (window.YT && window.YT.Player && !ytPlayerRef.current) {
        try {
          ytPlayerRef.current = new window.YT.Player('youtube-player-hidden', {
            height: '200',
            width: '200',
            videoId: themePlaylists.chai[0]?.videoId || 'KASqzjKVbzE',
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              playsinline: 1,
              enablejsapi: 1,
              origin: typeof window !== 'undefined' ? window.location.origin : '',
              rel: 0,
            },
            events: {
              onReady: (e) => {
                ytReadyRef.current = true;
                try {
                  e.target.setVolume(volume);
                } catch {}
                if (pendingPlayRef.current) {
                  pendingPlayRef.current = false;
                  const cur = themePlaylists[activeId]?.[songIndex] || themePlaylists.chai[0];
                  if (cur) {
                    try {
                      e.target.loadVideoById(cur.videoId);
                      setPlaying(true);
                    } catch {}
                  }
                }
              },
              onStateChange: (event) => {
                if (event.data === 1) { // PLAYING
                  setPlaying(true);
                  consecutiveErrorsRef.current = 0;
                } else if (event.data === 2) { // PAUSED
                  setPlaying(false);
                } else if (event.data === 0) { // ENDED
                  consecutiveErrorsRef.current = 0;
                  playNext(true);
                }
              },
              onError: () => {
                consecutiveErrorsRef.current += 1;
                if (consecutiveErrorsRef.current <= 2) {
                  setTimeout(() => playNext(true), 1200);
                } else {
                  setPlaying(false);
                  setPlayerStatus('Playback paused. Tap play to retry');
                }
              },
            },
          });
        } catch (err) {
          console.warn('YT Player Init Error:', err);
        }
      }
    };

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initYT();
      };
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }
  }, []);

  // Update playback time and duration every 250ms when playing via YouTube engine
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeEngineRef.current === 'yt' && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const t = ytPlayerRef.current.getCurrentTime() || 0;
          const d = ytPlayerRef.current.getDuration() || 0;
          setCurrentTime(t);
          if (d > 0) setDuration(d);
          const state = ytPlayerRef.current.getPlayerState ? ytPlayerRef.current.getPlayerState() : -1;
          if (state === 1 && !playing) setPlaying(true);
          else if ((state === 2 || state === 0) && playing) setPlaying(false);
        } catch {}
      }
    }, 250);
    return () => clearInterval(interval);
  }, [playing]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const active = themes.find((theme) => theme.id === activeId);
  const songs = themePlaylists[activeId] || themePlaylists.chai;
  const currentSong = songs[songIndex] || songs[0];
  const currentSongTitle = (currentSong && (songTitles[currentSong.videoId] || currentSong.title)) || 'Your playlist';
  const thumbnailUrl = `https://i.ytimg.com/vi/${currentSong?.videoId}/hqdefault.jpg`;

  useEffect(() => () => {
    clearTimeout(fadeTimer.current);
    clearTimeout(prefetchTimerRef.current);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(volume);
      } catch {}
    }
  }, [volume]);

  // Fetch clean track metadata via oEmbed as fallback
  const fetchTrackTitle = (videoId) => {
    if (songTitles[videoId]) return;
    fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.title) {
          setSongTitles((prev) => (prev[videoId] === data.title ? prev : { ...prev, [videoId]: data.title }));
        }
      })
      .catch(() => {});
  };

  const fetchStream = async (videoId) => {
    if (streamCache.current.has(videoId)) {
      const cached = streamCache.current.get(videoId);
      if (cached && cached.title) {
        setSongTitles((prev) => (prev[videoId] === cached.title ? prev : { ...prev, [videoId]: cached.title }));
      }
      return cached;
    }
    try {
      const endpoint = API_URL ? `${API_URL}/api/v1/get_stream` : `/api/v1/get_stream`;
      const response = await fetch(`${endpoint}?video_id=${encodeURIComponent(videoId)}`);
      if (!response.ok) return null;
      const payload = await response.json();
      if (!payload || !payload.audio_url) return null;
      streamCache.current.set(videoId, payload);
      if (payload.title) {
        setSongTitles((prev) => (prev[videoId] === payload.title ? prev : { ...prev, [videoId]: payload.title }));
      }
      return payload;
    } catch {
      return null;
    }
  };

  // Only prefetch the immediate next track after 3s of stable playback to preserve bandwidth & CPU
  const prefetchSingleNext = (playlist, currentIndex) => {
    clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = setTimeout(() => {
      const nextIdx = (currentIndex + 1) % playlist.length;
      const nextSong = playlist[nextIdx];
      if (nextSong && !streamCache.current.has(nextSong.videoId)) {
        fetchStream(nextSong.videoId);
      }
    }, 3000);
  };

  const loadTrackForPlaylist = async (playlist, index, autoplay = false, currentActiveThemeId = activeId) => {
    const song = playlist[index];
    if (!song) return;

    if (!playedPerPlaylistRef.current[currentActiveThemeId]) {
      playedPerPlaylistRef.current[currentActiveThemeId] = new Set();
    }
    playedPerPlaylistRef.current[currentActiveThemeId].add(song.videoId);

    const requestId = ++requestRef.current;
    autoPlayRef.current = autoplay;
    if (autoplay) {
      setPlaying(true);
    }
    setCurrentTime(0);
    setDuration(0);
    setPlayerStatus('Loading audio…');

    // Attempt HTML5 backend proxy stream
    let payload = streamCache.current.get(song.videoId);
    if (!payload) {
      payload = await fetchStream(song.videoId);
    }

    if (requestId !== requestRef.current) return;

    if (payload && payload.audio_url) {
      activeEngineRef.current = 'html5';
      if (payload.title) {
        setSongTitles((prev) => (prev[song.videoId] === payload.title ? prev : { ...prev, [song.videoId]: payload.title }));
      }
      setStreamUrl(payload.audio_url);
      setDuration(payload.duration || 0);
      setPlayerStatus('Ready');

      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        try { ytPlayerRef.current.pauseVideo(); } catch {}
      }

      if (audioRef.current) {
        audioRef.current.src = payload.audio_url;
        if (autoplay) {
          audioRef.current.play().then(() => {
            setPlaying(true);
            consecutiveErrorsRef.current = 0;
          }).catch((err) => {
            console.warn('Autoplay pending gesture:', err);
          });
        }
      }
    } else {
      // Direct YouTube engine fallback
      activeEngineRef.current = 'yt';
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
      setStreamUrl(`yt://${song.videoId}`);
      setPlayerStatus('Playing via web player');

      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        try {
          if (autoplay) {
            ytPlayerRef.current.loadVideoById(song.videoId);
            setPlaying(true);
          } else {
            ytPlayerRef.current.cueVideoById(song.videoId);
            setPlaying(false);
          }
        } catch (err) {
          console.warn('YT loadVideo error:', err);
        }
      }
    }

    prefetchSingleNext(playlist, index);
  };

  const loadTrack = (index, autoplay = false) => {
    loadTrackForPlaylist(songs, index, autoplay, activeId);
  };

  useEffect(() => {
    loadTrack(songIndex, false);
    return () => { requestRef.current += 1; };
  }, []);

  const playNext = async (autoplay = true) => {
    const currentList = themePlaylists[activeId] || themePlaylists.chai;
    if (currentList.length === 0) return;

    if (!playedPerPlaylistRef.current[activeId]) {
      playedPerPlaylistRef.current[activeId] = new Set();
    }
    const playedSet = playedPerPlaylistRef.current[activeId];
    if (currentList[songIndex]?.videoId) {
      playedSet.add(currentList[songIndex].videoId);
    }

    let nextIndex;
    if (isShuffle) {
      let unplayedIndices = currentList
        .map((_, i) => i)
        .filter((i) => i !== songIndex && !playedSet.has(currentList[i]?.videoId));

      if (unplayedIndices.length === 0) {
        // All songs in this playlist have been shuffled through! Reset playlist shuffle history.
        playedSet.clear();
        if (currentList[songIndex]?.videoId) {
          playedSet.add(currentList[songIndex].videoId);
        }
        unplayedIndices = currentList
          .map((_, i) => i)
          .filter((i) => i !== songIndex);
        nextIndex = unplayedIndices.length > 0
          ? unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)]
          : 0;
      } else {
        nextIndex = unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)];
      }
    } else {
      nextIndex = (songIndex + 1) % currentList.length;
    }

    if (currentList[nextIndex]?.videoId) {
      playedSet.add(currentList[nextIndex].videoId);
    }
    setSongIndex(nextIndex);
    loadTrackForPlaylist(currentList, nextIndex, autoplay, activeId);
  };

  const playPrevious = () => {
    const currentList = themePlaylists[activeId] || themePlaylists.chai;
    if (currentList.length < 2) return;
    let prevIndex;
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * currentList.length);
    } else {
      prevIndex = (songIndex - 1 + currentList.length) % currentList.length;
    }
    setSongIndex(prevIndex);
    loadTrackForPlaylist(currentList, prevIndex, true, activeId);
  };

  const togglePlayback = () => {
    if (activeEngineRef.current === 'html5' && audioRef.current && audioRef.current.src) {
      if (audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setPlaying(true);
          consecutiveErrorsRef.current = 0;
        }).catch((error) => setPlayerStatus(`Playback failed: ${error.name}`));
      } else {
        audioRef.current.pause();
        setPlaying(false);
      }
    } else if (ytPlayerRef.current) {
      try {
        if (!ytReadyRef.current) {
          pendingPlayRef.current = true;
          setPlaying(true);
          return;
        }
        const state = typeof ytPlayerRef.current.getPlayerState === 'function' ? ytPlayerRef.current.getPlayerState() : -1;
        if (state === 1) { // Playing
          ytPlayerRef.current.pauseVideo();
          setPlaying(false);
        } else {
          if (state === -1 || state === 5 || state === undefined) {
            const cur = themePlaylists[activeId]?.[songIndex] || themePlaylists.chai[0];
            if (cur) {
              ytPlayerRef.current.loadVideoById(cur.videoId);
              setPlaying(true);
              return;
            }
          }
          ytPlayerRef.current.playVideo();
          setPlaying(true);
        }
      } catch (e) {
        console.warn('Toggle playback error:', e);
      }
    } else if (audioRef.current && streamUrl) {
      if (audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setPlaying(true);
          consecutiveErrorsRef.current = 0;
        }).catch(() => {});
      } else {
        audioRef.current.pause();
        setPlaying(false);
      }
    }
  };

  const handleSeekChange = (event) => {
    const newTime = Number(event.target.value);
    if (activeEngineRef.current === 'html5' && audioRef.current) {
      audioRef.current.currentTime = newTime;
    } else if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try {
        ytPlayerRef.current.seekTo(newTime, true);
      } catch {}
    }
    setCurrentTime(newTime);
  };

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSongTitle,
      artist: active.name,
      album: 'Mahaul',
    });
    navigator.mediaSession.setActionHandler('play', () => {
      if (activeEngineRef.current === 'html5') audioRef.current?.play();
      else ytPlayerRef.current?.playVideo();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (activeEngineRef.current === 'html5') audioRef.current?.pause();
      else ytPlayerRef.current?.pauseVideo();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext(true));
    navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    };
  }, [songIndex, activeId, songTitles, isShuffle]);

  const selectTheme = (nextId) => {
    if (nextId === activeId) return;
    setPreviousImage(active.image);
    setActiveId(nextId);
    setThemeMenuOpen(false);
    setSearchQuery('');
    consecutiveErrorsRef.current = 0;
    autoPlayRef.current = true;
    setPlaying(true);

    // Stop current track cleanly
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Load new theme's playlist and immediately start playing
    const curatedPlaylist = themePlaylists[nextId] || themePlaylists.chai;
    const newIndex = 0;
    setSongIndex(newIndex);
    loadTrackForPlaylist(curatedPlaylist, newIndex, true, nextId);

    clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => setPreviousImage(null), 900);
  };

  const handleAudioError = () => {
    if (activeEngineRef.current === 'html5') {
      consecutiveErrorsRef.current += 1;
      console.warn(`Audio error count: ${consecutiveErrorsRef.current}`);
      if (consecutiveErrorsRef.current <= 2) {
        setTimeout(() => {
          playNext(true);
        }, 1000);
      } else {
        setPlaying(false);
        setPlayerStatus('Playback paused. Tap play to retry');
      }
    }
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
        <TypewriterBrand />
        
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
                <div className="song-menu-header">Playlist ({songs.length} tracks)</div>
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

          {/* PWA Install Button */}
          {canInstall && (
            <button
              className="select-button pwa-install-btn"
              onClick={handleInstallClick}
              title="Install Mahaul App"
              aria-label="Install Mahaul App"
            >
              <Download size={14} />
              <span>Install App</span>
            </button>
          )}
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
          playsInline
          webkit-playsinline="true"
          onTimeUpdate={(event) => {
            setCurrentTime(event.currentTarget.currentTime);
            if (consecutiveErrorsRef.current > 0) consecutiveErrorsRef.current = 0;
          }}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || duration)}
          onCanPlay={() => {
            if (autoPlayRef.current && audioRef.current) {
              audioRef.current.play().then(() => {
                setPlaying(true);
                consecutiveErrorsRef.current = 0;
                autoPlayRef.current = false;
              }).catch(() => {});
            }
          }}
          onPlay={() => {
            setPlaying(true);
            autoPlayRef.current = false;
            consecutiveErrorsRef.current = 0;
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            consecutiveErrorsRef.current = 0;
            playNext(true);
          }}
          onError={handleAudioError}
        />
      </div>

      <div
        id="youtube-player-hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 200,
          height: 200,
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -100,
        }}
      />

      <footer>All music &amp; media rights belong to their respective copyright owners <span>·</span> mahaul.wtf <span>·</span> slow evenings &amp; long roads</footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
