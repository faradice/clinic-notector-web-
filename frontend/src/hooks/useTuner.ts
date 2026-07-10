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
export const useTuner = (enabled: boolean, echoCancellation = false) => {
  const [reading, setReading] = useState<TunerReading>(EMPTY);
  const [isListening, setIsListening] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const smoothedFreqRef = useRef(0);
  const historyRef = useRef<number[]>([]); // recent raw freqs for median filtering
  const silentFramesRef = useRef(0);       // consecutive frames with no pitch

  const start = useCallback(async () => {
    try {
      // The standalone tuner wants the raw signal (echoCancellation off) for cent
      // accuracy. The Notector game turns it ON so the browser cancels its own
      // metronome tick out of the mic — otherwise the tick bleeds in and reads as
      // a played note, auto-passing every note while the metronome is running.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation, noiseSuppression: false, autoGainControl: false },
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
  }, [echoCancellation]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    smoothedFreqRef.current = 0;
    historyRef.current = [];
    silentFramesRef.current = 0;
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
          silentFramesRef.current = 0;
          // Median of recent readings rejects outlier/octave-jump spikes...
          const hist = historyRef.current;
          hist.push(freq);
          if (hist.length > 7) hist.shift();
          const median = [...hist].sort((a, b) => a - b)[Math.floor(hist.length / 2)];
          // ...then EMA steadies what's left.
          const prev = smoothedFreqRef.current;
          const next = prev > 0 ? prev * 0.8 + median * 0.2 : median;
          smoothedFreqRef.current = next;
          setReading(freqToReading(next));
        } else if (++silentFramesRef.current > 12) {
          // Hold the last reading through brief dropouts (decaying string);
          // only clear after sustained silence to avoid flicker.
          smoothedFreqRef.current = 0;
          historyRef.current = [];
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
 * Pitch detector using the McLeod Pitch Method (Normalized Square Difference
 * Function). Unlike raw autocorrelation, the NSDF is normalized per lag, so it
 * has no finite-buffer decay bias — the period peak lands in the right place,
 * which matters most at low frequencies (large lags). Returns Hz, or -1.
 */
export function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const n = buf.length;

  let rms = 0;
  for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.01) return -1; // too quiet — noise gate

  const maxLag = Math.floor(n / 2);
  const nsdf = new Float32Array(maxLag);
  for (let tau = 0; tau < maxLag; tau++) {
    let acf = 0; // sum b[j]*b[j+tau]
    let m = 0;   // sum b[j]^2 + b[j+tau]^2  (normalizer)
    for (let j = 0; j + tau < n; j++) {
      const a = buf[j];
      const b = buf[j + tau];
      acf += a * b;
      m += a * a + b * b;
    }
    nsdf[tau] = m > 0 ? (2 * acf) / m : 0;
  }

  // Collect the local maxima of the NSDF, one per positive-going region,
  // skipping the initial lag-0 lobe.
  let tau = 1;
  while (tau < maxLag && nsdf[tau] > 0) tau++; // past the first (lag-0) lobe

  let best = -1;      // position of highest key maximum
  let bestVal = -1;
  const maxima: number[] = [];
  while (tau < maxLag) {
    if (nsdf[tau] > 0) {
      let localPos = tau;
      let localVal = nsdf[tau];
      while (tau < maxLag && nsdf[tau] > 0) {
        if (nsdf[tau] > localVal) { localVal = nsdf[tau]; localPos = tau; }
        tau++;
      }
      maxima.push(localPos);
      if (localVal > bestVal) { bestVal = localVal; best = localPos; }
    } else {
      tau++;
    }
  }
  if (best < 0 || bestVal < 0.3) return -1; // no confident pitch

  // Pick the FIRST key maximum that clears a threshold near the strongest one
  // (avoids octave-up errors from picking a later, taller harmonic peak).
  const threshold = 0.9 * bestVal;
  let chosen = best;
  for (const pos of maxima) {
    if (nsdf[pos] >= threshold) { chosen = pos; break; }
  }

  // Parabolic interpolation around the chosen peak for sub-sample accuracy.
  let T0 = chosen;
  const x1 = nsdf[T0 - 1] ?? nsdf[T0];
  const x2 = nsdf[T0];
  const x3 = nsdf[T0 + 1] ?? nsdf[T0];
  const denom = 2 * (x1 + x3 - 2 * x2);
  if (denom !== 0) T0 = T0 - (x3 - x1) / denom;

  const freq = sampleRate / T0;
  if (freq < 60 || freq > 1200) return -1; // outside guitar range
  return freq;
}
