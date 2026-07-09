import { useEffect, useRef, useState, useCallback } from 'react';

// NOTE: This is a self-contained MVP chord detector. It shares NOTHING with the
// tuner / Notector pitch detection (useTuner) on purpose, so it can't affect them.

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

interface ChordType {
  suffix: string;     // appended to the root name, e.g. 'm', '7'
  intervals: number[]; // semitone offsets from the root
}

// Common chord shapes, roughly simplest-first.
const CHORD_TYPES: ChordType[] = [
  { suffix: '', intervals: [0, 4, 7] },       // major
  { suffix: 'm', intervals: [0, 3, 7] },      // minor
  { suffix: 'sus4', intervals: [0, 5, 7] },
  { suffix: 'sus2', intervals: [0, 2, 7] },
  { suffix: 'dim', intervals: [0, 3, 6] },
  { suffix: 'aug', intervals: [0, 4, 8] },
  { suffix: '7', intervals: [0, 4, 7, 10] },  // dominant 7
  { suffix: 'm7', intervals: [0, 3, 7, 10] },
  { suffix: 'maj7', intervals: [0, 4, 7, 11] },
];

export interface ChordMatch {
  name: string;        // e.g. 'C', 'Am', 'G7'
  root: number;        // pitch class 0..11
  intervals: number[]; // relative to root
  notes: string[];     // pitch-class names in the chord
  score: number;       // cosine similarity 0..1
}

/**
 * Match a 12-bin chroma vector against chord templates (cosine similarity).
 * Pure + exported so it can be unit-tested without audio.
 */
export function matchChord(chroma: number[]): ChordMatch | null {
  const norm = Math.hypot(...chroma);
  if (norm === 0) return null;
  const c = chroma.map((x) => x / norm);

  let best: ChordMatch | null = null;
  for (let root = 0; root < 12; root++) {
    for (const t of CHORD_TYPES) {
      let dot = 0;
      for (const iv of t.intervals) dot += c[(root + iv) % 12];
      const score = dot / Math.sqrt(t.intervals.length); // cosine sim (c is unit-norm)
      if (!best || score > best.score) {
        best = {
          name: NOTE_NAMES[root] + t.suffix,
          root,
          intervals: t.intervals,
          notes: t.intervals.map((iv) => NOTE_NAMES[(root + iv) % 12]),
          score,
        };
      }
    }
  }
  return best;
}

export interface ChordReading {
  chord: ChordMatch | null;
  chroma: number[]; // normalized 0..1 for display
  hasSignal: boolean;
}

const EMPTY: ChordReading = { chord: null, chroma: new Array(12).fill(0), hasSignal: false };

const FFT_SIZE = 8192;
const MIN_HZ = 70;    // ~C#2
const MAX_HZ = 2000;  // ~B6

export const useChordDetector = (enabled: boolean) => {
  const [reading, setReading] = useState<ChordReading>(EMPTY);
  const [isListening, setIsListening] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const freqDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const chromaEmaRef = useRef<number[]>(new Array(12).fill(0));
  // Hold the most recent detection so it stays on screen when the sound stops.
  const lastChordRef = useRef<ChordMatch | null>(null);
  const lastChromaRef = useRef<number[]>(new Array(12).fill(0));

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      freqDataRef.current = new Float32Array(analyser.frequencyBinCount);
      ctx.createMediaStreamSource(stream).connect(analyser);
      setIsListening(true);
    } catch (err) {
      console.error('Chord detector: microphone access failed', err);
      alert('Microphone access denied. Please allow microphone access.');
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    chromaEmaRef.current = new Array(12).fill(0);
    lastChordRef.current = null;
    lastChromaRef.current = new Array(12).fill(0);
    setIsListening(false);
    setReading(EMPTY);
  }, []);

  useEffect(() => {
    if (enabled && !isListening) start();
    else if (!enabled && isListening) stop();
  }, [enabled, isListening, start, stop]);

  useEffect(() => {
    if (!isListening || !enabled) return;

    const tick = () => {
      const analyser = analyserRef.current;
      const data = freqDataRef.current;
      const ctx = audioContextRef.current;
      if (analyser && data && ctx) {
        analyser.getFloatFrequencyData(data);
        const binHz = ctx.sampleRate / FFT_SIZE;

        // Fold the spectrum into 12 pitch classes.
        const chroma = new Array(12).fill(0);
        let energy = 0;
        for (let i = 1; i < data.length; i++) {
          const f = i * binHz;
          if (f < MIN_HZ || f > MAX_HZ) continue;
          const db = data[i];
          if (db < -75) continue; // ignore near-silent bins
          const amp = Math.pow(10, db / 20); // dB -> linear amplitude
          const midi = 69 + 12 * Math.log2(f / 440);
          const pc = ((Math.round(midi) % 12) + 12) % 12;
          chroma[pc] += amp;
          energy += amp;
        }

        const hasSignal = energy > 0.02;
        // Smooth across frames for stability.
        const ema = chromaEmaRef.current;
        for (let i = 0; i < 12; i++) ema[i] = ema[i] * 0.6 + chroma[i] * 0.4;

        if (hasSignal) {
          const max = Math.max(...ema) || 1;
          const display = ema.map((x) => x / max);
          lastChordRef.current = matchChord(ema);
          lastChromaRef.current = display;
          setReading({ chord: lastChordRef.current, chroma: display, hasSignal: true });
        } else {
          // No sound: keep showing the last detected chord (frozen), hasSignal=false.
          setReading({ chord: lastChordRef.current, chroma: lastChromaRef.current, hasSignal: false });
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isListening, enabled]);

  return { reading, isListening };
};
