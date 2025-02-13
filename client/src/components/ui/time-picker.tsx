import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  onTimeUpdate?: (hours: number, minutes: number) => void;
}

export function TimePicker({ date, setDate, onTimeUpdate }: TimePickerProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [lastScrollTime, setLastScrollTime] = React.useState(0);
  const [selectedHour, setSelectedHour] = React.useState(date.getHours() % 12 || 12);
  const [selectedMinute, setSelectedMinute] = React.useState(date.getMinutes());
  const [isAm, setIsAm] = React.useState(date.getHours() < 12);

  const generateNumbers = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const hours = generateNumbers(1, 12);
  const minutes = generateNumbers(0, 59);

  React.useEffect(() => {
    audioRef.current = new Audio('/sounds/beep.mp3');
    audioRef.current.volume = 0.1;
  }, []);

  const playTickSound = React.useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTime > 25) {
      if (audioRef.current) {
        const newAudio = audioRef.current.cloneNode() as HTMLAudioElement;
        newAudio.play().catch(console.error);
        newAudio.onended = () => newAudio.remove();
      }
      setLastScrollTime(now);
    }
  }, [lastScrollTime]);

  const handleTimeUpdate = React.useCallback((hour: number, minute: number, am: boolean) => {
    const newDate = new Date(date);
    const adjustedHour = am ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    newDate.setHours(adjustedHour);
    newDate.setMinutes(minute);
    setDate(newDate);
    onTimeUpdate?.(adjustedHour, minute);
    playTickSound();
  }, [date, setDate, onTimeUpdate, playTickSound]);

  const handleScroll = (element: HTMLDivElement, type: 'hours' | 'minutes') => {
    const itemHeight = 72;
    const scrollPosition = element.scrollTop;
    let index = Math.round(scrollPosition / itemHeight);

    if (type === 'hours') {
      index = (index % 12) + 1;
      setSelectedHour(index);
      handleTimeUpdate(index, selectedMinute, isAm);
    } else {
      index = index % 60;
      setSelectedMinute(index);
      handleTimeUpdate(selectedHour, index, isAm);
    }

    requestAnimationFrame(() => {
      element.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });
    });
  };

  const toggleAmPm = () => {
    setIsAm(!isAm);
    handleTimeUpdate(selectedHour, selectedMinute, !isAm);
  };

  return (
    <div className="flex items-center justify-center gap-8">
      <div className="w-[80px]">
        <ScrollArea className="h-[216px] w-full rounded-md overflow-hidden">
          <div 
            className="flex flex-col items-center snap-y snap-mandatory"
            onScroll={(e) => handleScroll(e.currentTarget, 'hours')}
            style={{ 
              overflowY: 'auto', 
              scrollSnapType: 'y mandatory',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}
          >
            {[...hours, ...hours.slice(0, 3)].map((hour, index) => (
              <div
                key={`${hour}-${index}`}
                className={cn(
                  "w-full h-[72px] flex items-center justify-center transition-colors snap-center select-none",
                  index < hours.length && hour === selectedHour
                    ? "text-primary text-4xl font-semibold scale-110"
                    : "text-muted-foreground/30 text-3xl"
                )}
                style={{ scrollSnapAlign: 'center' }}
              >
                {String(hour).padStart(2, '0')}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="text-4xl font-medium text-primary">:</div>

      <div className="w-[80px]">
        <ScrollArea className="h-[216px] w-full rounded-md overflow-hidden">
          <div 
            className="flex flex-col items-center snap-y snap-mandatory"
            onScroll={(e) => handleScroll(e.currentTarget, 'minutes')}
            style={{ 
              overflowY: 'auto', 
              scrollSnapType: 'y mandatory',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}
          >
            {[...minutes, ...minutes.slice(0, 3)].map((minute, index) => (
              <div
                key={`${minute}-${index}`}
                className={cn(
                  "w-full h-[72px] flex items-center justify-center transition-colors snap-center select-none",
                  index < minutes.length && minute === selectedMinute
                    ? "text-primary text-4xl font-semibold scale-110"
                    : "text-muted-foreground/30 text-3xl"
                )}
                style={{ scrollSnapAlign: 'center' }}
              >
                {String(minute).padStart(2, '0')}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex flex-col gap-2">
        <button
          className={cn(
            "px-4 py-2 rounded-md transition-colors",
            isAm ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          )}
          onClick={toggleAmPm}
        >
          AM
        </button>
        <button
          className={cn(
            "px-4 py-2 rounded-md transition-colors",
            !isAm ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          )}
          onClick={toggleAmPm}
        >
          PM
        </button>
      </div>
    </div>
  );
}