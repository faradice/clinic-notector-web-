import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { Song } from './api/songs';
import { songApi } from './api/songs';
import { FretboardViewer } from './components/chord-editor/FretboardViewer';
import { ComposerCanvas } from './components/composer/ComposerCanvas';
import { PlayerViewer } from './components/player/PlayerViewer';
import { NotectorGame } from './components/notector/NotectorGame';

const queryClient = new QueryClient();

function SongList() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await songApi.getAll();
      setSongs(data);
    } catch (err) {
      setError('Failed to load songs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Clinic Notector Music
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Modern web-based music application suite
          </p>

          <div className="mb-8">
            <button
              onClick={loadSongs}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Load Songs'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {songs.length > 0 && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BPM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chords
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {songs.map((song) => (
                    <tr key={song.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {song.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {song.bpm || 120}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {song.chordPositions?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {songs.length === 0 && !loading && !error && (
            <div className="text-gray-500 text-center py-8">
              No songs loaded. Click "Load Songs" to fetch from the backend.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<'player' | 'composer' | 'chords' | 'notector' | 'songs'>('player');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8 py-4">
              <button
                onClick={() => setActiveTab('player')}
                className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                  activeTab === 'player'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Player
              </button>
              <button
                onClick={() => setActiveTab('composer')}
                className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                  activeTab === 'composer'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Composer
              </button>
              <button
                onClick={() => setActiveTab('chords')}
                className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                  activeTab === 'chords'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Chord Editor
              </button>
              <button
                onClick={() => setActiveTab('notector')}
                className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                  activeTab === 'notector'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Notector
              </button>
              <button
                onClick={() => setActiveTab('songs')}
                className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                  activeTab === 'songs'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Songs
              </button>
            </div>
          </div>
        </div>

        <div className={activeTab === 'composer' || activeTab === 'player' || activeTab === 'notector' ? '' : 'py-8'}>
          {activeTab === 'player' && <PlayerViewer />}
          {activeTab === 'composer' && <ComposerCanvas />}
          {activeTab === 'chords' && <FretboardViewer />}
          {activeTab === 'notector' && <NotectorGame />}
          {activeTab === 'songs' && <SongList />}
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App
