import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./queryClient";
import { useQuery } from "@tanstack/react-query";

type SoundName = "default" | "digital" | "beep";

export interface CustomRingtone {
  id: string;
  url: string;
  name: string;
}

export let DEFAULT_SOUNDS: Record<string, string> = {
  default: "/sounds/default.mp3",
  beep: "/sounds/beep.mp3"
};

// Check which default sounds exist
const checkSoundExists = async (path: string): Promise<boolean> => {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

const initDefaultSounds = async () => {
  const sounds = {
    default: "/sounds/default.mp3",
    beep: "/sounds/beep.mp3"
  };

  DEFAULT_SOUNDS = {}; // Reset default sounds
  for (const [key, path] of Object.entries(sounds)) {
    if (await checkSoundExists(path)) {
      DEFAULT_SOUNDS[key] = path;
    }
  }
};

// Initialize default sounds
initDefaultSounds();

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

  const preview = useCallback((function() {
    let currentPreview: HTMLAudioElement | null = null;
    let isPlaying = false;
    
    return async (sound: SoundName | string, volume: number = 1) => {
      try {
        if (isPlaying) {
          if (currentPreview) {
            currentPreview.pause();
            currentPreview.src = '';
          }
          isPlaying = false;
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const soundUrl = DEFAULT_SOUNDS[sound as SoundName] || sound;
        if (!soundUrl) {
          console.warn('Invalid sound URL');
          return;
        }

        const previewAudio = new Audio(soundUrl);
        currentPreview = previewAudio;
        previewAudio.volume = volume;
        isPlaying = true;

        try {
          await previewAudio.play();
        } catch (error) {
          console.warn('Preview playback failed:', error);
          isPlaying = false;
        }

        previewAudio.onended = () => {
          isPlaying = false;
          if (currentPreview === previewAudio) {
            currentPreview = null;
          }
        };
      } catch (error) {
        console.warn('Preview error:', error);
        isPlaying = false;
      }
    };
  })(), []);

  const addCustomRingtone = useCallback(async (ringtone: CustomRingtone) => {
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