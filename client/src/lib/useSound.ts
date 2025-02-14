import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./queryClient";
import { useQuery } from "@tanstack/react-query";

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

  // Fetch custom ringtones from the database
  const { data: audioFiles } = useQuery({
    queryKey: ['/api/audio-files'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/audio-files');
      const files = await res.json();
      return files.map((file: any) => ({
        id: `db-${file.id}`,
        url: file.data, // Now contains the file path
        name: file.name
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

  const addCustomRingtone = useCallback(async (ringtone: CustomRingtone) => {
    // Save to database
    const response = await fetch(ringtone.url);
    const blob = await response.blob();
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64data = (reader.result as string).split(',')[1];

      await apiRequest('POST', '/api/audio-files', {
        name: ringtone.name,
        data: base64data,
        type: blob.type,
        created: Math.floor(Date.now() / 1000)
      });
    };

    reader.readAsDataURL(blob);
  }, []);

  return { 
    play, 
    stop, 
    preview, 
    customRingtones,
    addCustomRingtone
  };
}