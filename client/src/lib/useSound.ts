import { useCallback, useEffect, useState } from "react";

type SoundName = "default" | "digital" | "beep";

export interface CustomRingtone {
  id: string;
  url: string;
  name: string;
}

const DEFAULT_SOUNDS = {
  default: "/sounds/default.mp3",
  digital: "/sounds/digital.mp3",
  beep: "/sounds/beep.mp3"
};

export function useSound(soundName?: string, defaultVolume: number = 100) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [customRingtones, setCustomRingtones] = useState<CustomRingtone[]>([]);

  useEffect(() => {
    if (soundName) {
      const newAudio = new Audio();
      newAudio.volume = defaultVolume / 100;

      // Test if the audio can be loaded
      newAudio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
      });

      try {
        newAudio.src = DEFAULT_SOUNDS[soundName as SoundName] || soundName;
      } catch (error) {
        console.error('Error setting audio source:', error);
      }

      setAudio(newAudio);

      return () => {
        if (newAudio) {
          newAudio.pause();
          newAudio.src = "";
        }
      };
    }
  }, [soundName, defaultVolume]);

  const play = useCallback((sound?: string, volume?: number) => {
    if (audio) {
      try {
        if (sound) {
          audio.src = DEFAULT_SOUNDS[sound as SoundName] || sound;
        }
        if (typeof volume === 'number') {
          audio.volume = volume;
        }
        audio.currentTime = 0;
        return audio.play();
      } catch (error) {
        console.error('Error playing sound:', error);
        return Promise.reject(error);
      }
    }
    return Promise.reject(new Error('Audio not initialized'));
  }, [audio]);

  const stop = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [audio]);

  const preview = useCallback((sound: SoundName | string, volume: number = 1) => {
    const soundUrl = DEFAULT_SOUNDS[sound as SoundName] || sound;
    const previewAudio = new Audio();
    previewAudio.volume = volume;

    return new Promise((resolve, reject) => {
      previewAudio.addEventListener('loadeddata', () => {
        previewAudio.play()
          .then(resolve)
          .catch(reject);
      });

      previewAudio.addEventListener('error', (e) => {
        console.error('Error loading preview sound:', e);
        reject(e);
      });

      try {
        previewAudio.src = soundUrl;
      } catch (error) {
        console.error('Error setting preview audio source:', error);
        reject(error);
      }
    });
  }, []);

  const addCustomRingtone = useCallback((ringtone: CustomRingtone) => {
    setCustomRingtones(prev => [...prev, ringtone]);
  }, []);

  return { 
    play, 
    stop, 
    preview, 
    customRingtones,
    addCustomRingtone
  };
}