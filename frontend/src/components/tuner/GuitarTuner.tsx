import { useState } from 'react';
import { useTuner, nearestGuitarString, GUITAR_STRINGS } from '../../hooks/useTuner';

const IN_TUNE_CENTS = 5; // within this many cents counts as accurately in tune

export const GuitarTuner: React.FC = () => {
  const [active, setActive] = useState(false);
  const { reading, isListening } = useTuner(active);

  const hasPitch = reading.note != null;
  const cents = hasPitch ? reading.cents : 0;
  const inTune = hasPitch && Math.abs(cents) <= IN_TUNE_CENTS;
  const nearest = nearestGuitarString(reading);
  const matchesString = !!(nearest && reading.note === nearest.note && reading.octave === nearest.octave);

  // Needle angle: -50 cents -> -90deg (left), 0 -> up, +50 -> +90deg (right).
  const needleAngle = Math.max(-50, Math.min(50, cents)) / 50 * 90;

  const accent = !hasPitch ? '#64748b' : inTune ? '#22c55e' : '#f59e0b';

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-900 text-slate-100 p-6">
      <h2 className="text-2xl font-bold mt-2 mb-1">Guitar Tuner</h2>
      <p className="text-slate-400 mb-6 text-sm">Standard tuning · E A D G B E</p>

      {/* Note + cents readout */}
      <div className="flex flex-col items-center">
        <div
          className="font-bold leading-none transition-colors"
          style={{ fontSize: 96, color: accent }}
        >
          {hasPitch ? reading.note : '–'}
          {hasPitch && <span className="text-3xl align-super text-slate-400">{reading.octave}</span>}
        </div>
        <div className="h-6 mt-1 text-lg font-mono" style={{ color: accent }}>
          {hasPitch ? `${cents > 0 ? '+' : ''}${cents}¢` : ''}
        </div>
      </div>

      {/* Needle dial */}
      <svg viewBox="0 0 300 180" className="w-full max-w-md mt-2">
        {/* Arc */}
        <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="#334155" strokeWidth={4} />
        {/* In-tune zone (±IN_TUNE_CENTS around top) */}
        <path
          d={arcBetweenCents(-IN_TUNE_CENTS, IN_TUNE_CENTS)}
          fill="none"
          stroke="#22c55e"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Tick marks */}
        {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map((c) => {
          const major = c % 50 === 0 || c === 0;
          const p1 = pointAtCents(c, 120);
          const p2 = pointAtCents(c, major ? 100 : 108);
          return (
            <line
              key={c}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={c === 0 ? '#22c55e' : '#475569'}
              strokeWidth={c === 0 ? 3 : 2}
            />
          );
        })}
        {/* Labels */}
        <text x={30} y={168} fill="#64748b" fontSize={12} textAnchor="middle">♭ flat</text>
        <text x={270} y={168} fill="#64748b" fontSize={12} textAnchor="middle">sharp ♯</text>

        {/* Needle */}
        <g transform={`rotate(${needleAngle} 150 150)`} style={{ transition: 'transform 90ms linear' }}>
          <line x1={150} y1={150} x2={150} y2={44} stroke={accent} strokeWidth={4} strokeLinecap="round" />
          <circle cx={150} cy={150} r={8} fill={accent} />
        </g>
      </svg>

      {/* In-tune / frequency */}
      <div className="h-8 mb-3 text-lg font-semibold" style={{ color: accent }}>
        {!isListening ? '' : !hasPitch ? 'Play a string…' : inTune ? '✓ In tune' : cents < 0 ? 'Tune up ↑' : 'Tune down ↓'}
      </div>
      <div className="text-slate-400 font-mono text-sm mb-6 h-5">
        {hasPitch ? `${reading.frequency.toFixed(1)} Hz` : ''}
      </div>

      {/* String chips */}
      <div className="flex gap-2 sm:gap-3 mb-8">
        {GUITAR_STRINGS.map((s) => {
          const isNearest = nearest?.label === s.label;
          const isTuned = isNearest && inTune && matchesString;
          return (
            <div
              key={s.label}
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                isTuned
                  ? 'bg-green-500 border-green-400 text-white'
                  : isNearest
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-800 border-slate-600 text-slate-300'
              }`}
              title={`${s.label} · ${s.frequency.toFixed(2)} Hz`}
            >
              {s.note}
              <span className="text-xs align-super text-slate-400">{s.octave}</span>
            </div>
          );
        })}
      </div>

      {/* Mic control */}
      <button
        onClick={() => setActive((a) => !a)}
        className={`px-8 py-3 rounded-lg text-lg font-semibold transition-colors ${
          active ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {active ? '■ Stop' : '🎤 Start tuning'}
      </button>
    </div>
  );
};

// Geometry helpers: map a cents value (-50..50) to a point on the dial arc.
// Arc center (150,150), radius R; cents -50 -> 180°, 0 -> 90° (top), +50 -> 0°.
function pointAtCents(cents: number, radius: number) {
  const clamped = Math.max(-50, Math.min(50, cents));
  const angleDeg = 90 - (clamped / 50) * 90; // 0 cents -> 90° (straight up)
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 150 - radius * Math.cos(rad), y: 150 - radius * Math.sin(rad) };
}

function arcBetweenCents(c1: number, c2: number): string {
  const p1 = pointAtCents(c1, 120);
  const p2 = pointAtCents(c2, 120);
  return `M ${p1.x} ${p1.y} A 120 120 0 0 1 ${p2.x} ${p2.y}`;
}
