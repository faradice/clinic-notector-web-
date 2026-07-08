import { useEffect, useRef, useState, useCallback } from 'react';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface TunerReading {
  frequency: number;       // Hz (0 when nothing detected)
  note: string | null;     // nearest chromatic note, e.g. 'E'
  octave: number | null;   // e.g. 2
  midi: number | null;     // nearest MIDI note number
  cents: number;           // -50..+50 deviation from the nearest note
}

export interface GuitarString {
  label: string;    // 'E2'
  note: string;     // 'E'
  octave: number;   // 2
  midi: number;
  frequency: number;
}

const EMPTY: TunerReading = { frequency: 0, note: null, octave: null, midi: null, cents: 0 };

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function makeString(note: string, octave: number): GuitarString {
  const midi = NOTE_NAMES.indexOf(note) + (octave + 1) * 12;
  return { label: `${note}${octave}`, note, octave, midi, frequency: midiToFreq(midi) };
}

// Standard tuning, low to high.
export const GUITAR_STRINGS: GuitarString[] = [
  makeString('E', 2),
  makeString('A', 2),
  makeString('D', 3),
  makeString('G', 3),
  makeString('B', 3),
  makeString('E', 4),
];

/** Convert a frequency (Hz) to the nearest chromatic note plus a cents offset. */
export function freqToReading(frequency: number): TunerReading {
  if (!frequency || frequency <= 0) return EMPTY;
  const midiFloat = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const note = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { frequency, note, octave, midi, cents };
}

/** The standard-tuning string closest to a reading (by MIDI distance). */
export function nearestGuitarString(reading: TunerReading): GuitarString | null {
  if (reading.midi == null) return null;
  let best = GUITAR_STRINGS[0];
  let bestDiff = Infinity;
  for (const s of GUITAR_STRINGS) {
    const diff = Math.abs(s.midi - reading.midi);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = s;
    }
  }
  return best;
}

/**
 * Guitar tuner hook: microphone pitch detection via normalized autocorrelation
 * (ACF2+ with parabolic interpolation) for accurate, low-jitter readings across
 * the guitar range (low E ~82 Hz up).
 */
export const useTuner = (enabled: boolean) => {
  const [reading, setReading] = useState<TunerReading>(EMPTY);
  const [isListening, setIsListening] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const smoothedFreqRef = useRef(0);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      micStreamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);

      ctx.createMediaStreamSource(stream).connect(analyser);
      setIsListening(true);
    } catch (err) {
      console.error('Tuner: microphone access failed', err);
      alert('Microphone access denied. Please allow microphone access to tune.');
    }
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    smoothedFreqRef.current = 0;
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
      const buf = bufferRef.current;
      const ctx = audioContextRef.current;
      if (analyser && buf && ctx) {
        analyser.getFloatTimeDomainData(buf);
        const freq = autoCorrelate(buf, ctx.sampleRate);
        if (freq > 0) {
          // Light exponential smoothing to steady the needle.
          const prev = smoothedFreqRef.current;
          const next = prev > 0 ? prev * 0.7 + freq * 0.3 : freq;
          smoothedFreqRef.current = next;
          setReading(freqToReading(next));
        } else {
          smoothedFreqRef.current = 0;
          setReading(EMPTY);
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

/**
 * Normalized autocorrelation pitch detector (ACF2+), the well-proven approach
 * used by browser tuners. Returns frequency in Hz, or -1 when no clear pitch.
 */
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;

  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // too quiet — noise gate

  // Trim the quiet edges of the buffer.
  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < threshold) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < threshold) { r2 = SIZE - i; break; }
  }

  const trimmed = buf.subarray(r1, r2);
  const n = trimmed.length;
  const c = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i; j++) c[i] += trimmed[j] * trimmed[j + i];
  }

  // Skip the initial downslope, then find the highest peak.
  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  if (maxpos <= 0) return -1;

  // Parabolic interpolation for sub-sample accuracy.
  let T0 = maxpos;
  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a !== 0) T0 = T0 - b / (2 * a);

  const freq = sampleRate / T0;
  if (freq < 60 || freq > 1200) return -1; // outside guitar range
  return freq;
}
