import { useCallback, useEffect, useState } from "react";

type SoundName = "default" | "digital" | "beep";

export function useSound(soundName: string, defaultVolume: number = 100) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const newAudio = new Audio(`/sounds/${soundName}.mp3`);
    newAudio.volume = defaultVolume / 100;
    setAudio(newAudio);

    return () => {
      if (newAudio) {
        newAudio.pause();
        newAudio.src = "";
      }
    };
  }, [soundName, defaultVolume]);

  const play = useCallback((sound?: string, volume?: number) => {
    if (audio) {
      if (sound) {
        audio.src = `/sounds/${sound}.mp3`;
      }
      if (typeof volume === 'number') {
        audio.volume = volume;
      }
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.error('Error playing sound:', error);
      });
    }
  }, [audio]);

  const stop = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [audio]);

  const preview = useCallback((sound: SoundName, volume: number = 1) => {
    const previewAudio = new Audio(`/sounds/${sound}.mp3`);
    previewAudio.volume = volume;
    previewAudio.play().catch(error => {
      console.error('Error playing preview sound:', error);
    });
  }, []);

  return { play, stop, preview };
}