
import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  onTimeUpdate?: (hours: number, minutes: number) => void;
}

const generateTimeOptions = () => {
  const hours = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const periods = ["AM", "PM"];
  return { hours, minutes, periods };
};

export function TimePicker({ date, setDate, onTimeUpdate }: TimePickerProps) {
  const { hours: hourOptions, minutes: minuteOptions, periods } = generateTimeOptions();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [lastScrollTime, setLastScrollTime] = React.useState(0);
  const scrollRefs = {
    hours: React.useRef<HTMLDivElement>(null),
    minutes: React.useRef<HTMLDivElement>(null),
    period: React.useRef<HTMLDivElement>(null)
  };

  React.useEffect(() => {
    audioRef.current = new Audio('/sounds/beep.mp3');
    audioRef.current.volume = 0.1;
    return () => {
      audioRef.current = null;
    };
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

  const handleScroll = React.useCallback((element: HTMLDivElement, type: 'hours' | 'minutes' | 'period') => {
    const itemHeight = 72;
    const scrollPosition = element.scrollTop;
    let index = Math.round(scrollPosition / itemHeight);

    if (type === 'hours') {
      index = index % 12;
      if (index === 0) index = 12;
    } else if (type === 'minutes') {
      index = index % 60;
    } else if (type === 'period') {
      index = index % 2;
    }

    playTickSound();

    // Update time
    const newDate = new Date(date);
    if (type === 'hours') {
      const isPM = newDate.getHours() >= 12;
      newDate.setHours(isPM ? (index === 12 ? 12 : index + 12) : (index === 12 ? 0 : index));
    } else if (type === 'minutes') {
      newDate.setMinutes(index);
    } else if (type === 'period') {
      const currentHours = newDate.getHours();
      const currentPeriod = currentHours >= 12;
      const newPeriod = index === 1;
      
      if (currentPeriod !== newPeriod) {
        newDate.setHours((currentHours + 12) % 24);
      }
    }

    setDate(newDate);
    onTimeUpdate?.(newDate.getHours(), newDate.getMinutes());

    // Force scroll to nearest snap point
    requestAnimationFrame(() => {
      element.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });
    });
  }, [date, setDate, onTimeUpdate, playTickSound]);

  // Initialize scroll positions
  React.useEffect(() => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 1 : 0;
    const display12Hour = hours % 12 || 12;

    if (scrollRefs.hours.current) {
      scrollRefs.hours.current.scrollTop = (display12Hour - 1) * 72;
    }
    if (scrollRefs.minutes.current) {
      scrollRefs.minutes.current.scrollTop = minutes * 72;
    }
    if (scrollRefs.period.current) {
      scrollRefs.period.current.scrollTop = period * 72;
    }
  }, [date]);

  return (
    <div className="flex items-center justify-center gap-8">
      <div className="w-[80px]">
        <ScrollArea className="h-[216px] w-full rounded-md overflow-hidden">
          <div 
            ref={scrollRefs.hours}
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
            {[...hourOptions, ...hourOptions.slice(0, 3)].map((hour, index) => (
              <div
                key={`${hour}-${index}`}
                className={cn(
                  "w-full h-[72px] flex items-center justify-center transition-colors snap-center select-none",
                  index < hourOptions.length && (date.getHours() % 12 || 12) === parseInt(hour)
                    ? "text-primary text-4xl font-semibold scale-110"
                    : "text-muted-foreground/30 text-3xl"
                )}
                style={{ scrollSnapAlign: 'center' }}
              >
                {hour}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="text-4xl font-medium text-primary">:</div>

      <div className="w-[80px]">
        <ScrollArea className="h-[216px] w-full rounded-md overflow-hidden">
          <div 
            ref={scrollRefs.minutes}
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
            {[...minuteOptions, ...minuteOptions.slice(0, 3)].map((minute, index) => (
              <div
                key={`${minute}-${index}`}
                className={cn(
                  "w-full h-[72px] flex items-center justify-center transition-colors snap-center select-none",
                  index < minuteOptions.length && date.getMinutes() === parseInt(minute)
                    ? "text-primary text-4xl font-semibold scale-110"
                    : "text-muted-foreground/30 text-3xl"
                )}
                style={{ scrollSnapAlign: 'center' }}
              >
                {minute}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="w-[80px]">
        <ScrollArea className="h-[216px] w-full rounded-md overflow-hidden">
          <div 
            ref={scrollRefs.period}
            className="flex flex-col items-center snap-y snap-mandatory"
            onScroll={(e) => handleScroll(e.currentTarget, 'period')}
            style={{ 
              overflowY: 'auto', 
              scrollSnapType: 'y mandatory',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}
          >
            {[...periods, ...periods.slice(0, 1)].map((period, index) => (
              <div
                key={`${period}-${index}`}
                className={cn(
                  "w-full h-[72px] flex items-center justify-center transition-colors snap-center select-none",
                  index < periods.length && 
                  ((date.getHours() >= 12 && period === "PM") || 
                  (date.getHours() < 12 && period === "AM"))
                    ? "text-primary text-3xl font-semibold scale-110"
                    : "text-muted-foreground/30 text-2xl"
                )}
                style={{ scrollSnapAlign: 'center' }}
              >
                {period}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
