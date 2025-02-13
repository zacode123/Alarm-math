import { useCallback, useRef, useState } from "react";

const SOUNDS = {
  default: "/sounds/alarm_clock.mp3",
  digital: "/sounds/digital_alarm.mp3",
  beep: "/sounds/beep.mp3"
};

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [customRingtones, setCustomRingtones] = useState<string[]>([]);

  const play = useCallback((sound: keyof typeof SOUNDS | string, volume: number = 1.0) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    let audioSrc: string;
    if (sound in SOUNDS) {
      audioSrc = SOUNDS[sound];
    } else if (customRingtones.includes(sound)) {
      audioSrc = sound; // Assume sound is a valid URL if not in SOUNDS
    } else {
      console.error("Invalid sound:", sound);
      return;
    }

    const audio = new Audio(audioSrc);
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, volume));
    audioRef.current = audio;

    audio.addEventListener('canplaythrough', () => {
      audio.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    });
  }, [customRingtones]);

  const preview = useCallback((sound: keyof typeof SOUNDS | string, volume: number = 1.0) => {
    let audioSrc: string;
    if (sound in SOUNDS) {
      audioSrc = SOUNDS[sound];
    } else if (customRingtones.includes(sound)) {
      audioSrc = sound;
    } else {
      console.error("Invalid sound for preview:", sound);
      return;
    }

    const audio = new Audio(audioSrc);
    audio.loop = false;
    audio.volume = Math.max(0, Math.min(1, volume));

    audio.addEventListener('canplaythrough', () => {
      audio.play().catch(error => {
        console.error('Error playing preview sound:', error);
      });
    });
  }, [customRingtones]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { play, stop, preview, customRingtones, setCustomRingtones };
}