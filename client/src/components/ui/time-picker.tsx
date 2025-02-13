import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

const generateTimeOptions = () => {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  return { hours, minutes };
};

export function TimePicker({ date, setDate }: TimePickerProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const { hours: hourOptions, minutes: minuteOptions } = generateTimeOptions();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    audioRef.current = new Audio('/sounds/beep.mp3');
    audioRef.current.volume = 0.2;
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  const playTickSound = React.useCallback(() => {
    if (audioRef.current) {
      const newAudio = audioRef.current.cloneNode() as HTMLAudioElement;
      newAudio.play().catch(console.error);
      newAudio.onended = () => newAudio.remove();
    }
  }, []);

  const handleValueChange = React.useCallback((type: 'hours' | 'minutes', value: string) => {
    const newDate = new Date(date);
    if (type === 'hours') {
      newDate.setHours(parseInt(value));
    } else {
      newDate.setMinutes(parseInt(value));
    }
    setDate(newDate);
    playTickSound();
  }, [date, setDate, playTickSound]);

  return (
    <div className="flex items-center gap-4">
      <ScrollArea className="h-[300px] w-[100px] rounded-md">
        <div className="flex flex-col items-center" ref={scrollContainerRef}>
          {hourOptions.map((hour) => (
            <button
              key={hour}
              onClick={() => handleValueChange('hours', hour)}
              className={cn(
                "w-full py-6 text-3xl font-medium transition-all snap-center",
                date.getHours() === parseInt(hour)
                  ? "text-primary scale-110"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
              style={{
                scrollSnapAlign: 'center',
                height: '72px', // Fixed height for perfect alignment
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {hour}
            </button>
          ))}
        </div>
      </ScrollArea>

      <div className="text-4xl font-light text-primary">:</div>

      <ScrollArea className="h-[300px] w-[100px] rounded-md">
        <div className="flex flex-col items-center">
          {minuteOptions.map((minute) => (
            <button
              key={minute}
              onClick={() => handleValueChange('minutes', minute)}
              className={cn(
                "w-full py-6 text-3xl font-medium transition-all snap-center",
                date.getMinutes() === parseInt(minute)
                  ? "text-primary scale-110"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
              style={{
                scrollSnapAlign: 'center',
                height: '72px', // Fixed height for perfect alignment
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {minute}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}