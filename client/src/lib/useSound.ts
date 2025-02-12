import { useCallback, useRef } from "react";

const SOUNDS = {
  default: "/sounds/alarm_clock.mp3",
  digital: "/sounds/digital_alarm.mp3",
  beep: "/sounds/beep.mp3"
};

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((sound: keyof typeof SOUNDS = "default", volume: number = 1.0) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(SOUNDS[sound]);
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, volume));
    audioRef.current = audio;

    // Ensure audio is loaded before playing
    audio.addEventListener('canplaythrough', () => {
      audio.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    });
  }, []);

  const preview = useCallback((sound: keyof typeof SOUNDS, volume: number = 1.0) => {
    const audio = new Audio(SOUNDS[sound]);
    audio.loop = false;
    audio.volume = Math.max(0, Math.min(1, volume));

    audio.addEventListener('canplaythrough', () => {
      audio.play().catch(error => {
        console.error('Error playing preview sound:', error);
      });
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { play, stop, preview };
}