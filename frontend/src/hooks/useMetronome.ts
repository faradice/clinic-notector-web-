import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

/**
 * Metronome hook using Tone.js Transport
 */
export const useMetronome = (bpm: number, enabled: boolean) => {
  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const eventIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize metronome synth (drum-like sound)
    synthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
        attackCurve: 'exponential',
      },
    }).toDestination();

    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  const start = useCallback(async () => {
    if (!synthRef.current) return;

    await Tone.start();
    Tone.Transport.bpm.value = bpm;

    // Schedule repeating event on every quarter note
    eventIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      synthRef.current?.triggerAttackRelease('C2', '32n', time);
    }, '4n');

    Tone.Transport.start();
  }, [bpm]);

  const stop = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    eventIdRef.current = null;
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, start, stop]);

  useEffect(() => {
    // Update BPM when it changes
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  return { start, stop };
};
