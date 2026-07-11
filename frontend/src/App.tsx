import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ComposerCanvas } from './components/composer/ComposerCanvas';
import { NotectorGame } from './components/notector/NotectorGame';
import { GuitarTuner } from './components/tuner/GuitarTuner';
import { ChordDetector } from './components/chord-detector/ChordDetector';
import { Onboarding } from './components/Onboarding';

const queryClient = new QueryClient();

const ONBOARDED_KEY = 'toneyra_onboarded';


const TABS = [
  { id: 'composer', label: 'Hljómasmiðja' },
  { id: 'notector', label: 'Nótnaþjálfun' },
  { id: 'tuner', label: 'Stillir' },
  { id: 'chord-detector', label: 'Hljómagreinir' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('composer');
  // First-visit welcome overlay; shown once, remembered in localStorage.
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem(ONBOARDED_KEY); } catch { return false; }
  });
  const dismissOnboarding = () => {
    try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch { /* ignore */ }
    setShowOnboarding(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      {showOnboarding && (
        <Onboarding
          onStart={dismissOnboarding}
          onPick={(tab) => { setActiveTab(tab); dismissOnboarding(); }}
        />
      )}
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6">
            <div className="flex flex-wrap items-center justify-between gap-y-2 py-4">
              <div className="flex flex-wrap items-center gap-8">
                <span className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden />
                  Tóneyra
                </span>
                <nav aria-label="Aðalflipar" className="flex gap-8">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={activeTab === tab.id ? 'page' : undefined}
                      className={`pb-2 px-1 font-semibold transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              <a
                href="/onepager.html"
                target="_blank"
                rel="noopener"
                aria-label="Opna kynningarblað í nýjum flipa"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:border-emerald-500 hover:text-emerald-600"
              >
                <span aria-hidden>ℹ</span> Kynning
              </a>
            </div>
          </div>
        </header>

        <main>
          {activeTab === 'composer' && <ComposerCanvas />}
          {activeTab === 'notector' && <NotectorGame />}
          {activeTab === 'tuner' && <GuitarTuner />}
          {activeTab === 'chord-detector' && <ChordDetector />}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App
