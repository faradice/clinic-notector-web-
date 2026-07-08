import { useEffect, useRef, useState, useCallback } from 'react';

const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
};

const TOLERANCE_HZ = 5;

/**
 * Pitch detection hook using Web Audio API with autocorrelation
 * Ported from NoteDetector.java concepts (165-440 Hz range, ±5 Hz tolerance)
 */
export const usePitchDetection = (enabled: boolean) => {
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [detectedFrequency, setDetectedFrequency] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const initAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048; // Same as Java version
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      bufferRef.current = new Float32Array(analyser.fftSize);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);
    } catch (error) {
      console.error('Failed to initialize microphone:', error);
      alert('Microphone access denied. Please allow microphone access.');
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsListening(false);
  }, []);

  const detectPitch = useCallback(() => {
    if (!analyserRef.current || !bufferRef.current) return;

    analyserRef.current.getFloatTimeDomainData(bufferRef.current);

    const frequency = autoCorrelate(bufferRef.current, audioContextRef.current!.sampleRate);

    if (frequency > 0) {
      setDetectedFrequency(frequency);
      const note = frequencyToNote(frequency);
      setDetectedNote(note);
    } else {
      setDetectedNote(null);
      setDetectedFrequency(0);
    }

    animationFrameRef.current = requestAnimationFrame(detectPitch);
  }, []);

  useEffect(() => {
    if (enabled && !isListening) {
      initAudio();
    } else if (!enabled && isListening) {
      stopAudio();
    }
  }, [enabled, isListening, initAudio, stopAudio]);

  useEffect(() => {
    if (isListening && enabled) {
      detectPitch();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isListening, enabled, detectPitch]);

  const matchesNote = useCallback((targetNote: string): boolean => {
    if (!detectedNote || !detectedFrequency) return false;

    const targetFreq = NOTE_FREQUENCIES[targetNote];
    if (!targetFreq) return false;

    return Math.abs(detectedFrequency - targetFreq) <= TOLERANCE_HZ;
  }, [detectedNote, detectedFrequency]);

  return {
    detectedNote,
    detectedFrequency,
    isListening,
    matchesNote,
  };
};

/**
 * Autocorrelation algorithm for fundamental frequency detection
 * More reliable than FFT for pitch detection
 */
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let best_offset = -1;
  let best_correlation = 0;
  let rms = 0;

  // Calculate RMS (root mean square) for noise gate
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  // Noise gate - ignore if too quiet
  if (rms < 0.01) return -1;

  // Find the best correlation offset
  let lastCorrelation = 1;
  for (let offset = 1; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }

    correlation = 1 - correlation / MAX_SAMPLES;

    if (correlation > 0.9 && correlation > lastCorrelation) {
      const foundGoodCorrelation = correlation > best_correlation;
      if (foundGoodCorrelation) {
        best_correlation = correlation;
        best_offset = offset;
      }
    }

    lastCorrelation = correlation;
  }

  if (best_correlation > 0.01 && best_offset !== -1) {
    const frequency = sampleRate / best_offset;

    // Filter to reasonable range (similar to Java 165-440 Hz)
    if (frequency >= 100 && frequency <= 800) {
      return frequency;
    }
  }

  return -1;
}

/**
 * Convert frequency to nearest note
 */
function frequencyToNote(frequency: number): string | null {
  let closestNote: string | null = null;
  let minDiff = Infinity;

  for (const [note, freq] of Object.entries(NOTE_FREQUENCIES)) {
    const diff = Math.abs(frequency - freq);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = note;
    }
  }

  return minDiff <= TOLERANCE_HZ * 2 ? closestNote : null;
}
