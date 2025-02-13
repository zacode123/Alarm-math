import { useCallback, useRef, useState } from "react";

const SOUNDS = {
  default: "/sounds/alarm_clock.mp3",
  digital: "/sounds/digital_alarm.mp3",
  beep: "/sounds/beep.mp3"
} as const;

type SoundType = keyof typeof SOUNDS;

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [customRingtones, setCustomRingtones] = useState<({ url: string; data: string } | string)[]>(() => {
    try {
      const saved = localStorage.getItem('customRingtones');
      if (!saved) return [];
      
      const parsedItems = JSON.parse(saved);
      return parsedItems.map(item => {
        if (!item?.data) return item;
        try {
          const binaryString = window.atob(item.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], {type: 'audio/mpeg'});
          const url = URL.createObjectURL(blob);
          if (!url) throw new Error('Failed to create object URL');
          return {...item, url};
        } catch (err) {
          console.error('Error creating object URL:', err);
          return { url: '', data: item.data };
        }
      }).filter(item => item.url !== '');
    } catch (error) {
      console.error('Error parsing custom ringtones:', error);
      return [];
    }
  });

  const play = useCallback((sound: SoundType | string | { url: string; data: string }, volume: number = 1.0) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    let audioSrc: string;
    if (typeof sound === 'string') {
      if (sound in SOUNDS) {
        audioSrc = SOUNDS[sound as SoundType];
      } else if (customRingtones.some(r => typeof r === 'string' ? r === sound : r.url === sound)) {
        audioSrc = typeof sound === 'string' ? sound : sound.url;
      } else {
        console.error("Invalid sound:", sound);
        return;
      }
    } else {
      audioSrc = sound.url;
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

  const preview = useCallback((sound: SoundType | string | { url: string; data: string }, volume: number = 1.0) => {
    let audioSrc: string;
    if (typeof sound === 'string') {
      if (sound in SOUNDS) {
        audioSrc = SOUNDS[sound as SoundType];
      } else if (customRingtones.some(r => typeof r === 'string' ? r === sound : r.url === sound)) {
          audioSrc = typeof sound === 'string' ? sound : sound.url;
      } else {
        console.error("Invalid sound for preview:", sound);
        return;
      }
    } else {
      audioSrc = sound.url;
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

  const updateCustomRingtones = (ringtones: ({ url: string; data: string } | string)[]) => {
    try {
      // Cleanup old object URLs
      customRingtones.forEach(ringtone => {
        if (typeof ringtone !== 'string' && ringtone.url) {
          URL.revokeObjectURL(ringtone.url);
        }
      });
      
      setCustomRingtones(ringtones);
      localStorage.setItem('customRingtones', JSON.stringify(ringtones.map(r => 
        typeof r === 'string' ? {data: r} : { data: r.data }
      )));
    } catch (error) {
      console.error('Error saving custom ringtones:', error);
    }
  };

  return { play, stop, preview, customRingtones, setCustomRingtones: updateCustomRingtones };
}