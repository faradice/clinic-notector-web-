import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

/**
 * Metronome hook using Tone.js Transport
 * @param volume tick loudness as a linear gain 0..1 (0 = muted)
 */
export const useMetronome = (bpm: number, enabled: boolean, volume: number = 1) => {
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
    synthRef.current.volume.value = Tone.gainToDb(volume);

    return () => {
      synthRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply tick volume changes live (gainToDb(0) === -Infinity → silent).
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume.value = Tone.gainToDb(volume);
    }
  }, [volume]);

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
