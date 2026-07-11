import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ComposerCanvas } from './components/composer/ComposerCanvas';
import { NotectorGame } from './components/notector/NotectorGame';
import { GuitarTuner } from './components/tuner/GuitarTuner';
import { ChordDetector } from './components/chord-detector/ChordDetector';

const queryClient = new QueryClient();


function App() {
  const [activeTab, setActiveTab] = useState<'composer' | 'notector' | 'tuner' | 'chord-detector'>('composer');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="px-6">
            <div className="flex flex-wrap items-center justify-between gap-y-2 py-4">
              <div className="flex flex-wrap items-center gap-8">
                <span className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                  Tóneyra
                </span>
                <div className="flex gap-8">
                  <button
                    onClick={() => setActiveTab('composer')}
                    className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                      activeTab === 'composer'
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    Hljómasmiðja
                  </button>
                  <button
                    onClick={() => setActiveTab('notector')}
                    className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                      activeTab === 'notector'
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    Nótnaþjálfun
                  </button>
                  <button
                    onClick={() => setActiveTab('tuner')}
                    className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                      activeTab === 'tuner'
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    Stillir
                  </button>
                  <button
                    onClick={() => setActiveTab('chord-detector')}
                    className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                      activeTab === 'chord-detector'
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700'
                    }`}
                  >
                    Hljómagreinir
                  </button>
                </div>
              </div>
              <a
                href="/onepager.html"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:border-emerald-500 hover:text-emerald-600"
              >
                <span aria-hidden>ℹ</span> Kynning
              </a>
            </div>
          </div>
        </div>

        <div className={activeTab === 'composer' || activeTab === 'notector' || activeTab === 'tuner' || activeTab === 'chord-detector' ? '' : 'py-8'}>
          {activeTab === 'composer' && <ComposerCanvas />}
          {activeTab === 'notector' && <NotectorGame />}
          {activeTab === 'tuner' && <GuitarTuner />}
          {activeTab === 'chord-detector' && <ChordDetector />}
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App
