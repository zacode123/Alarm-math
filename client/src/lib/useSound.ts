import { useCallback, useRef } from "react";

const SOUNDS = {
  default: "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg",
  digital: "https://actions.google.com/sounds/v1/alarms/digital_timer.ogg",
  beep: "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
};

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((sound: keyof typeof SOUNDS = "default") => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(SOUNDS[sound]);
    audio.loop = true;
    audioRef.current = audio;
    audio.play().catch(console.error);
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { play, stop };
}
