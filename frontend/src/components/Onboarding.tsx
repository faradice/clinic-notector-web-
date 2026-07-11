import { useEffect, useRef } from 'react';

export type TabId = 'composer' | 'notector' | 'tuner' | 'chord-detector';

const TOOLS: { id: TabId; emoji: string; name: string; desc: string }[] = [
  { id: 'tuner', emoji: '🎸', name: 'Stillir', desc: 'Stilltu gítarinn — nákvæmur mælir eða eftir eyra.' },
  { id: 'notector', emoji: '🎼', name: 'Nótnaþjálfun', desc: 'Æfðu nótnalestur og spilaðu eða veldu réttu nóturnar.' },
  { id: 'chord-detector', emoji: '🔎', name: 'Hljómagreinir', desc: 'Sláðu hljóm og appið þekkir hvaða hljómur það er.' },
  { id: 'composer', emoji: '🎹', name: 'Hljómasmiðja', desc: 'Raðaðu hljómum og spilaðu heilar framvindur.' },
];

interface Props {
  onStart: () => void;          // dismiss and stay on the default tab
  onPick: (tab: TabId) => void; // dismiss and jump straight to a tool
}

/** First-visit welcome overlay. Shown once (gated by localStorage in App). */
export const Onboarding: React.FC<Props> = ({ onStart, onPick }) => {
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    startRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onStart(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onStart(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Tóneyra</span>
        </div>
        <h2 id="onboarding-title" className="text-2xl font-bold text-gray-900 mb-1">Velkomin! 🎵</h2>
        <p className="text-gray-600 mb-6">
          Fjögur æfingatól fyrir tónlistarnám — allt í vafranum, ekkert að setja upp.
          Veldu tól til að byrja:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              className="text-left rounded-xl border border-gray-200 p-4 transition-colors hover:border-emerald-400 hover:bg-emerald-50"
            >
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <span aria-hidden="true">{t.emoji}</span> {t.name}
              </div>
              <div className="text-sm text-gray-600 mt-1">{t.desc}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            Þú getur alltaf opnað kynninguna með <span className="font-semibold">ℹ Kynning</span>.
          </p>
          <button
            ref={startRef}
            onClick={onStart}
            className="shrink-0 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Byrja
          </button>
        </div>
      </div>
    </div>
  );
};
