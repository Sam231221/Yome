"use client";

import { useEffect } from "react";

export type CallTone = "ringtone" | "ringback";

type TonePattern = { frequencies: number[]; onMs: number; cycleMs: number; gain: number };

// Ringback mirrors the classic 440+480 Hz "it's ringing" cadence; the incoming ringtone is
// a brighter double chirp so the two are easy to tell apart.
const PATTERNS: Record<CallTone, TonePattern[]> = {
  ringback: [{ frequencies: [440, 480], onMs: 2000, cycleMs: 6000, gain: 0.05 }],
  ringtone: [
    { frequencies: [880, 1320], onMs: 350, cycleMs: 2400, gain: 0.08 },
    { frequencies: [880, 1320], onMs: 350, cycleMs: 2400, gain: 0.08 },
  ],
};

type AudioContextConstructor = typeof AudioContext;

const getAudioContextConstructor = (): AudioContextConstructor | null => {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext ??
    null
  );
};

const playBurst = (context: AudioContext, pattern: TonePattern, startAt: number) => {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(pattern.gain, startAt + 0.02);
  gain.gain.setValueAtTime(pattern.gain, startAt + pattern.onMs / 1000 - 0.02);
  gain.gain.linearRampToValueAtTime(0, startAt + pattern.onMs / 1000);
  gain.connect(context.destination);

  for (const frequency of pattern.frequencies) {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    oscillator.start(startAt);
    oscillator.stop(startAt + pattern.onMs / 1000);
  }
};

/**
 * Plays a looping call tone while `tone` is set. Browsers may keep the audio context
 * suspended until the page has had a user gesture; in that case the tone is silently
 * skipped rather than throwing.
 */
export function useCallTone(tone: CallTone | null) {
  useEffect(() => {
    if (!tone) return;
    const AudioContextCtor = getAudioContextConstructor();
    if (!AudioContextCtor) return;

    let context: AudioContext;
    try {
      context = new AudioContextCtor();
    } catch {
      return;
    }
    void context.resume().catch(() => undefined);

    const patterns = PATTERNS[tone];
    const cycleMs = patterns[0].cycleMs;
    const playCycle = () => {
      if (context.state !== "running") return;
      let offset = 0;
      for (const pattern of patterns) {
        playBurst(context, pattern, context.currentTime + offset / 1000);
        offset += pattern.onMs + 150;
      }
    };

    playCycle();
    const interval = window.setInterval(playCycle, cycleMs);
    return () => {
      window.clearInterval(interval);
      void context.close().catch(() => undefined);
    };
  }, [tone]);
}

/** Alternates the tab title with `message` so a ringing call is visible in a background tab. */
export function useTitleAlert(message: string | null) {
  useEffect(() => {
    if (!message || typeof document === "undefined") return;
    const originalTitle = document.title;
    let showMessage = true;
    document.title = message;
    const interval = window.setInterval(() => {
      showMessage = !showMessage;
      document.title = showMessage ? message : originalTitle;
    }, 1000);
    return () => {
      window.clearInterval(interval);
      document.title = originalTitle;
    };
  }, [message]);
}
