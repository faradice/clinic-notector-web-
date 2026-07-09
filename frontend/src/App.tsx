import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { FretboardViewer } from './components/chord-editor/FretboardViewer';
import { ComposerCanvas } from './components/composer/ComposerCanvas';
import { NotectorGame } from './components/notector/NotectorGame';
import { GuitarTuner } from './components/tuner/GuitarTuner';
import { ChordDetector } from './components/chord-detector/ChordDetector';

const queryClient = new QueryClient();


function App() {
  const [activeTab, setActiveTab] = useState<'composer' | 'chords' | 'notector' | 'tuner' | 'chord-detector'>('composer');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="px-6">
            <div className="flex gap-8 py-4">
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
                onClick={() => setActiveTab('tuner')}
                className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                  activeTab === 'tuner'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Tuner
              </button>
              <button
                onClick={() => setActiveTab('chord-detector')}
                className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                  activeTab === 'chord-detector'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                Chord Detector
              </button>
            </div>
          </div>
        </div>

        <div className={activeTab === 'composer' || activeTab === 'notector' || activeTab === 'tuner' || activeTab === 'chord-detector' ? '' : 'py-8'}>
          {activeTab === 'composer' && <ComposerCanvas />}
          {activeTab === 'chords' && <FretboardViewer />}
          {activeTab === 'notector' && <NotectorGame />}
          {activeTab === 'tuner' && <GuitarTuner />}
          {activeTab === 'chord-detector' && <ChordDetector />}
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App
