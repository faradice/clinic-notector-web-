import { useState, useEffect, useRef } from 'react';
import type { Song } from '../../api/songs';
import { songApi } from '../../api/songs';
import { LyricsDisplay } from './LyricsDisplay';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useMetronome } from '../../hooks/useMetronome';

export const PlayerViewer: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [bpm, setBpm] = useState<number>(120);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isPlaying, isPaused, play, pause, stop } = useAutoScroll(containerRef, {
    bpm: 60000 / bpm, // Convert BPM to milliseconds per beat
    initialDelay: 2000,
  });

  useMetronome(bpm, metronomeEnabled && isPlaying);

  useEffect(() => {
    const loadSongs = async () => {
      try {
        const data = await songApi.getAll();
        setSongs(data);
        if (data.length > 0) {
          setCurrentSong(data[0]);
          setBpm(data[0].bpm || 120);
        }
      } catch (error) {
        console.error('Failed to load songs:', error);
      }
    };
    loadSongs();
  }, []);

  const handleSongChange = (songId: string) => {
    const song = songs.find((s) => s.id?.toString() === songId);
    if (song) {
      setCurrentSong(song);
      setBpm(song.bpm || 120);
      setFontSize(song.fontSize || 18);
      stop(); // Stop auto-scroll when changing songs
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 p-4 flex items-center gap-4 flex-wrap">
        <select
          value={currentSong?.id || ''}
          onChange={(e) => handleSongChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select Song</option>
          {songs.map((song) => (
            <option key={song.id} value={song.id}>
              {song.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            disabled={!currentSong}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                {isPaused ? 'Resume' : 'Play'}
              </>
            )}
          </button>

          <button
            onClick={stop}
            disabled={!currentSong}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 4h10v12H5z" />
            </svg>
            Stop
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">BPM:</label>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
            min="40"
            max="240"
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Font Size:</label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value) || 18)}
            min="12"
            max="32"
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={metronomeEnabled}
            onChange={(e) => setMetronomeEnabled(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium text-gray-700">Metronome</span>
        </label>

        {currentSong && (
          <div className="ml-auto text-sm text-gray-600">
            {currentSong.name} • {currentSong.chordPositions?.length || 0} chords
          </div>
        )}
      </div>

      {/* Lyrics Display */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{
          scrollBehavior: 'auto', // Disable smooth scrolling for auto-scroll
        }}
      >
        {currentSong ? (
          <LyricsDisplay song={currentSong} fontSize={fontSize} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a song to begin
          </div>
        )}
      </div>
    </div>
  );
};
