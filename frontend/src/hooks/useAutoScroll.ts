import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoScrollOptions {
  bpm: number;
  initialDelay?: number;
  onComplete?: () => void;
}

/**
 * Auto-scroll hook ported from AutoScroller.java:35-56
 * Scrolls 1px every `bpm` milliseconds using requestAnimationFrame for smoothness
 */
export const useAutoScroll = (
  containerRef: React.RefObject<HTMLElement>,
  options: AutoScrollOptions
) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedScrollRef = useRef<number>(0);

  const { bpm, initialDelay = 0, onComplete } = options;

  const scroll = useCallback(() => {
    if (!containerRef.current) return;

    const now = performance.now();

    // Initial delay
    if (startTimeRef.current === 0) {
      startTimeRef.current = now + initialDelay;
      lastUpdateRef.current = startTimeRef.current;
    }

    if (now < startTimeRef.current) {
      // Still in initial delay
      animationFrameRef.current = requestAnimationFrame(scroll);
      return;
    }

    // Check if enough time has passed for next scroll increment
    const elapsed = now - lastUpdateRef.current;
    if (elapsed >= bpm) {
      const container = containerRef.current;
      const maxScroll = container.scrollHeight - container.clientHeight;

      if (container.scrollTop < maxScroll) {
        // Increment scroll by 1px (same as Java version)
        container.scrollTop += 1;
        lastUpdateRef.current = now;
      } else {
        // Reached bottom
        setIsPlaying(false);
        onComplete?.();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scroll);
  }, [containerRef, bpm, initialDelay, onComplete]);

  const play = useCallback(() => {
    if (isPaused) {
      // Resume from paused position
      setIsPaused(false);
      setIsPlaying(true);
      if (containerRef.current) {
        containerRef.current.scrollTop = pausedScrollRef.current;
      }
    } else {
      // Start from beginning
      setIsPlaying(true);
      setIsPaused(false);
      startTimeRef.current = 0;
      lastUpdateRef.current = 0;
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
  }, [isPaused, containerRef]);

  const pause = useCallback(() => {
    setIsPaused(true);
    setIsPlaying(false);
    if (containerRef.current) {
      pausedScrollRef.current = containerRef.current.scrollTop;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [containerRef]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    startTimeRef.current = 0;
    lastUpdateRef.current = 0;
    pausedScrollRef.current = 0;
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [containerRef]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(scroll);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isPaused, scroll]);

  return {
    isPlaying,
    isPaused,
    play,
    pause,
    stop,
  };
};
