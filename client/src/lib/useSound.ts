import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./queryClient";
import { useQuery } from "@tanstack/react-query";
import path from 'path';

type SoundName = "default" | "digital" | "beep";

export interface CustomRingtone {
  id: string;
  url: string;
  name: string;
}

const DEFAULT_SOUNDS: Record<string, string> = {
  'Morning Dew': "/sounds/default.mp3",
  'Beep': "/sounds/beep.mp3"
};

// Helper function to clean ringtone name
export function cleanRingtoneName(name: string): string {
  return path.parse(name).name.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export function useSound(soundName?: string, defaultVolume: number = 100) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [customRingtones, setCustomRingtones] = useState<CustomRingtone[]>([]);

  // Fetch custom ringtones from the database
  const { data: audioFiles } = useQuery({
    queryKey: ['/api/audio-files'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/audio-files');
      const files = await res.json();
      return files.map((file: any) => ({
        id: `db-${file.id}`,
        url: file.data,
        name: cleanRingtoneName(file.name)
      }));
    }
  });

  // Update custom ringtones when audio files change
  useEffect(() => {
    if (audioFiles) {
      setCustomRingtones(audioFiles);
    }
  }, [audioFiles]);

  useEffect(() => {
    if (soundName) {
      const newAudio = new Audio();
      newAudio.volume = defaultVolume / 100;

      newAudio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
      });

      try {
        // Check if it's a default sound or a custom one
        const soundPath = DEFAULT_SOUNDS[soundName] || soundName;
        newAudio.src = soundPath;
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
          audio.src = DEFAULT_SOUNDS[sound] || sound;
        }
        if (typeof volume === 'number') {
          audio.volume = volume / 100;
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

  const preview = useCallback((sound: string, volume: number = 100) => {
    const previewAudio = new Audio();
    previewAudio.volume = volume / 100;

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
        // Check if it's a default sound or a custom one
        const soundPath = DEFAULT_SOUNDS[sound] || sound;
        previewAudio.src = soundPath;
      } catch (error) {
        console.error('Error setting preview audio source:', error);
        reject(error);
      }
    });
  }, []);

  const addCustomRingtone = useCallback((ringtone: CustomRingtone) => {
    setCustomRingtones(prev => [...prev, {
      ...ringtone,
      name: cleanRingtoneName(ringtone.name)
    }]);
  }, []);

  return { 
    play, 
    stop, 
    preview, 
    customRingtones,
    addCustomRingtone,
    defaultSounds: DEFAULT_SOUNDS
  };
}