import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import {
  dbToMagnitude,
  harmonicProductSpectrum,
  spectrumToChroma,
  matchChord,
  type ChordMatch,
} from '../../hooks/useChordDetector';

// Self-test: the app plays a known chord progression on a synth and taps that
// audio DIRECTLY into an analyser (in Tone's own audio context) — no microphone,
// no speaker→mic loop. It then runs the exact same detection pipeline the mic
// detector uses and scores the guess against the chord it just played. A clean,
// deterministic accuracy harness for the detector's DSP.

const FFT_SIZE = 8192;      // must match the mic detector for identical binning
const MIN_HZ = 70;
const MAX_FUND_HZ = 1300;
const STEP_MS = 1800;       // how long each chord sounds before we score + advance

type Quality = 'maj' | 'min';
interface TestChord {
  name: string;
  root: number;      // pitch class 0..11
  quality: Quality;
  midis: number[];   // the voicing we synthesise
}

// Common open-position triads/tetrads, voiced in a comfortable mid octave.
const PROGRESSION: TestChord[] = [
  { name: 'C',  root: 0, quality: 'maj', midis: [48, 52, 55, 60] }, // C E G C
  { name: 'Am', root: 9, quality: 'min', midis: [45, 52, 57, 60] }, // A E A C
  { name: 'F',  root: 5, quality: 'maj', midis: [41, 48, 53, 57] }, // F C F A
  { name: 'G',  root: 7, quality: 'maj', midis: [43, 50, 55, 59] }, // G D G B
  { name: 'Em', root: 4, quality: 'min', midis: [40, 47, 52, 55] }, // E B E G
  { name: 'Dm', root: 2, quality: 'min', midis: [50, 53, 57, 62] }, // D F A D
  { name: 'A',  root: 9, quality: 'maj', midis: [45, 52, 57, 61] }, // A E A C#
  { name: 'D',  root: 2, quality: 'maj', midis: [50, 54, 57, 62] }, // D F# A D
];

/** Reduce a detected match to (root, major/minor) for a fair comparison. */
function classify(m: ChordMatch | null): { root: number; quality: Quality | 'other' } | null {
  if (!m) return null;
  const quality = m.intervals.includes(4) ? 'maj' : m.intervals.includes(3) ? 'min' : 'other';
  return { root: m.root, quality };
}

interface Result { expected: string; detected: string; correct: boolean }

export const ChordSelfTest: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [expected, setExpected] = useState<TestChord | null>(null);
  const [detected, setDetected] = useState<ChordMatch | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  const synthRef = useRef<Tone.PolySynth | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const dataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const emaRef = useRef<number[]>(new Array(12).fill(0));
  const detectedRef = useRef<ChordMatch | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const idxRef = useRef(0);

  const playChord = useCallback((tc: TestChord) => {
    const synth = synthRef.current;
    if (!synth) return;
    synth.releaseAll();
    const freqs = tc.midis.map((m) => Tone.Frequency(m, 'midi').toFrequency());
    synth.triggerAttackRelease(freqs, (STEP_MS / 1000) * 0.95);
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    rafRef.current = undefined;
    timerRef.current = undefined;
    synthRef.current?.releaseAll();
    synthRef.current?.dispose();
    synthRef.current = null;
    analyserRef.current = null;
    ctxRef.current = null; // shared Tone context — do NOT close it
    setRunning(false);
    setDetected(null);
    setExpected(null);
  }, []);

  const start = useCallback(async () => {
    await Tone.start();
    const ctx = Tone.getContext().rawContext as unknown as AudioContext;
    ctxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;
    dataRef.current = new Float32Array(analyser.frequencyBinCount);

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 },
    }).toDestination();      // audible…
    synth.connect(analyser); // …and tapped for analysis
    synth.volume.value = -8;
    synthRef.current = synth;

    emaRef.current = new Array(12).fill(0);
    detectedRef.current = null;
    idxRef.current = 0;
    setResults([]);
    setRunning(true);
    setExpected(PROGRESSION[0]);
    playChord(PROGRESSION[0]);

    const tick = () => {
      const a = analyserRef.current;
      const data = dataRef.current;
      const c = ctxRef.current;
      if (a && data && c) {
        a.getFloatFrequencyData(data);
        const binHz = c.sampleRate / FFT_SIZE;
        const mag = dbToMagnitude(data);
        const hps = harmonicProductSpectrum(mag);
        const chroma = spectrumToChroma(hps, binHz, MIN_HZ, MAX_FUND_HZ);
        const ema = emaRef.current;
        for (let i = 0; i < 12; i++) ema[i] = ema[i] * 0.6 + chroma[i] * 0.4;
        const m = matchChord(ema);
        detectedRef.current = m;
        setDetected(m);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Every step: score the chord that just played, then advance to the next.
    timerRef.current = setInterval(() => {
      const exp = PROGRESSION[idxRef.current];
      const det = classify(detectedRef.current);
      const correct = !!det && det.root === exp.root && det.quality === exp.quality;
      setResults((prev) => [
        ...prev.slice(-49),
        { expected: exp.name, detected: detectedRef.current?.name ?? '–', correct },
      ]);
      idxRef.current = (idxRef.current + 1) % PROGRESSION.length;
      const next = PROGRESSION[idxRef.current];
      setExpected(next);
      playChord(next);
    }, STEP_MS);
  }, [playChord]);

  useEffect(() => () => stop(), [stop]); // clean up on unmount

  const correctCount = results.filter((r) => r.correct).length;
  const accuracy = results.length ? Math.round((correctCount / results.length) * 100) : 0;
  const lastCorrect = results.length ? results[results.length - 1].correct : null;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl">
      <p className="text-slate-400 text-sm mb-4 text-center">
        Appið spilar þekkta hljóma og greinirinn reynir að þekkja þá — hreint próf án hljóðnema.
      </p>

      {/* Played vs detected */}
      <div className="flex items-stretch gap-4 mb-4 w-full" role="status" aria-live="polite"
           aria-label={running && expected
             ? `Spilar ${expected.name}, greindi ${detected?.name ?? 'ekkert'}`
             : 'Sjálfspróf óvirkt'}>
        <div className="flex-1 rounded-xl bg-slate-800 border border-slate-600 p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Spilar</div>
          <div className="text-5xl font-bold">{expected ? expected.name : '–'}</div>
        </div>
        <div className="flex flex-col items-center justify-center text-2xl text-slate-400" aria-hidden="true">
          {lastCorrect == null ? '→' : lastCorrect ? '✓' : '✗'}
        </div>
        <div className="flex-1 rounded-xl bg-slate-800 border border-slate-600 p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Greindi</div>
          <div className="text-5xl font-bold" style={{ color: detected ? '#22c55e' : '#64748b' }}>
            {detected ? detected.name : '–'}
          </div>
          <div className="text-xs text-slate-400 mt-1 h-4">
            {detected ? `öryggi ${(detected.score * 100).toFixed(0)}%` : ''}
          </div>
        </div>
      </div>

      {/* Accuracy */}
      <div className="w-full rounded-lg bg-slate-800 border border-slate-600 p-3 mb-4 text-center">
        <span className="text-slate-400 text-sm">Nákvæmni: </span>
        <span className="text-xl font-bold">{correctCount}/{results.length}</span>
        <span className="text-slate-400 text-sm"> rétt ({accuracy}%)</span>
      </div>

      {/* Recent history */}
      <div className="flex flex-wrap gap-1.5 mb-6 justify-center min-h-8" aria-hidden="true">
        {results.slice(-16).map((r, i) => (
          <span
            key={i}
            className={`px-2 py-1 rounded text-xs font-mono border ${
              r.correct
                ? 'bg-green-500/15 border-green-500 text-green-300'
                : 'bg-red-500/15 border-red-500 text-red-300'
            }`}
            title={`Spilaði ${r.expected} → greindi ${r.detected}`}
          >
            {r.correct ? '✓' : '✗'} {r.expected}
          </span>
        ))}
      </div>

      <button
        onClick={running ? stop : start}
        aria-pressed={running}
        aria-label={running ? 'Stöðva sjálfspróf' : 'Keyra sjálfspróf'}
        className={`px-8 py-3 rounded-lg text-lg font-semibold transition-colors ${
          running ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
        }`}
      >
        <span aria-hidden="true">{running ? '■ Stöðva sjálfspróf' : '▶ Keyra sjálfspróf'}</span>
      </button>
    </div>
  );
};
