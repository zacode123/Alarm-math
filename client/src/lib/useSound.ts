import { useCallback, useRef, useState } from "react";

const SOUNDS = {
  default: "/sounds/alarm_clock.mp3",
  digital: "/sounds/digital_alarm.mp3",
  beep: "/sounds/beep.mp3"
} as const;

type SoundType = keyof typeof SOUNDS;

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [customRingtones, setCustomRingtones] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('customRingtones');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error parsing custom ringtones:', error);
      return [];
    }
  });

  const play = useCallback((sound: SoundType | string, volume: number = 1.0) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    let audioSrc: string;
    if (sound in SOUNDS) {
      audioSrc = SOUNDS[sound as SoundType];
    } else if (customRingtones.includes(sound)) {
      audioSrc = sound;
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

  const preview = useCallback((sound: SoundType | string, volume: number = 1.0) => {
    let audioSrc: string;
    if (sound in SOUNDS) {
      audioSrc = SOUNDS[sound as SoundType];
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

  const updateCustomRingtones = (ringtones: string[]) => {
    try {
      setCustomRingtones(ringtones);
      localStorage.setItem('customRingtones', JSON.stringify(ringtones));
    } catch (error) {
      console.error('Error saving custom ringtones:', error);
    }
  };

  return { play, stop, preview, customRingtones, setCustomRingtones: updateCustomRingtones };
}