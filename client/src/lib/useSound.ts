import { useCallback, useRef } from "react";

const SOUNDS = {
  default: "/sounds/alarm_clock.mp3",
  digital: "/sounds/digital_alarm.mp3",
  beep: "/sounds/beep.mp3"
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
    audio.volume = 1.0;
    audioRef.current = audio;

    // Ensure audio is loaded before playing
    audio.addEventListener('canplaythrough', () => {
      audio.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { play, stop };
}