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
  const scrollTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});
  const scrollRefs = {
    hours: React.useRef<HTMLDivElement>(null),
    minutes: React.useRef<HTMLDivElement>(null),
    period: React.useRef<HTMLDivElement>(null)
  };

  // Initialize audio with lower volume
  React.useEffect(() => {
    audioRef.current = new Audio('/sounds/beep.mp3');
    audioRef.current.volume = 0.1;
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  const playTickSound = React.useCallback(() => {
    const now = Date.now();
    if (now - lastScrollTime > 30) { // Increased frequency for smoother sound
      if (audioRef.current) {
        const newAudio = audioRef.current.cloneNode() as HTMLAudioElement;
        newAudio.play().catch(console.error);
        newAudio.onended = () => newAudio.remove();
      }
      setLastScrollTime(now);
    }
  }, [lastScrollTime]);

  const handleScroll = React.useCallback((element: HTMLDivElement, type: 'hours' | 'minutes' | 'period') => {
    if (scrollTimeouts.current[type]) {
      clearTimeout(scrollTimeouts.current[type]);
    }

    playTickSound();

    scrollTimeouts.current[type] = setTimeout(() => {
      const itemHeight = 72;
      const scrollPosition = element.scrollTop;
      let index = Math.round(scrollPosition / itemHeight);

      // Handle infinite scroll wrapping
      if (type === 'hours') {
        if (index >= 12) index = 0;
        if (index < 0) index = 11;
      } else if (type === 'minutes') {
        if (index >= 60) index = 0;
        if (index < 0) index = 59;
      } else if (type === 'period') {
        index = Math.min(1, Math.max(0, index));
      }

      // Smooth scroll to nearest snap point
      element.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });

      // Update time
      const newDate = new Date(date);
      if (type === 'hours') {
        const currentHour = index === 0 ? 12 : index;
        const isPM = newDate.getHours() >= 12;
        newDate.setHours(isPM ? (currentHour === 12 ? 12 : currentHour + 12) : (currentHour === 12 ? 0 : currentHour));
      } else if (type === 'minutes') {
        newDate.setMinutes(index);
      } else if (type === 'period') {
        const currentHour = newDate.getHours();
        const isPM = index === 1;
        if (isPM && currentHour < 12) {
          newDate.setHours(currentHour + 12);
        } else if (!isPM && currentHour >= 12) {
          newDate.setHours(currentHour - 12);
        }
      }
      setDate(newDate);
      onTimeUpdate?.(newDate.getHours(), newDate.getMinutes());
    }, 100);
  }, [date, setDate, onTimeUpdate, playTickSound]);

  // Initialize scroll positions
  React.useEffect(() => {
    const initializeScroll = (type: 'hours' | 'minutes' | 'period') => {
      const ref = scrollRefs[type];
      if (!ref.current) return;

      let scrollIndex = 0;
      if (type === 'hours') {
        scrollIndex = date.getHours() % 12;
        if (scrollIndex === 0) scrollIndex = 12;
      } else if (type === 'minutes') {
        scrollIndex = date.getMinutes();
      } else if (type === 'period') {
        scrollIndex = date.getHours() >= 12 ? 1 : 0;
      }

      ref.current.scrollTop = scrollIndex * 72;
    };

    Object.keys(scrollRefs).forEach((type) => {
      initializeScroll(type as 'hours' | 'minutes' | 'period');
    });
  }, [date]);

  return (
    <div className="flex items-center gap-8">
      <div className="w-[80px]">
        <ScrollArea className="h-[216px] w-full rounded-md overflow-hidden">
          <div 
            ref={scrollRefs.hours}
            className="flex flex-col items-center snap-y snap-mandatory"
            onScroll={(e) => handleScroll(e.currentTarget, 'hours')}
            style={{ overflowY: 'auto', scrollSnapType: 'y mandatory' }}
          >
            {[...hourOptions, ...hourOptions.slice(0, 3)].map((hour, index) => (
              <div
                key={`${hour}-${index}`}
                className={cn(
                  "w-full h-[72px] flex items-center justify-center transition-colors snap-center",
                  index < hourOptions.length && date.getHours() % 12 === (parseInt(hour) % 12)
                    ? "text-primary text-4xl font-normal"
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

      <div className="text-4xl text-primary">:</div>

      <div className="w-[80px]">
        <ScrollArea className="h-[216px] w-full rounded-md overflow-hidden">
          <div 
            ref={scrollRefs.minutes}
            className="flex flex-col items-center snap-y snap-mandatory"
            onScroll={(e) => handleScroll(e.currentTarget, 'minutes')}
            style={{ overflowY: 'auto', scrollSnapType: 'y mandatory' }}
          >
            {[...minuteOptions, ...minuteOptions.slice(0, 3)].map((minute, index) => (
              <div
                key={`${minute}-${index}`}
                className={cn(
                  "w-full h-[72px] flex items-center justify-center transition-colors snap-center",
                  index < minuteOptions.length && date.getMinutes() === parseInt(minute)
                    ? "text-primary text-4xl font-normal"
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
            style={{ overflowY: 'auto', scrollSnapType: 'y mandatory' }}
          >
            {[...periods, ...periods.slice(0, 1)].map((period, index) => (
              <div
                key={`${period}-${index}`}
                className={cn(
                  "w-full h-[72px] flex items-center justify-center transition-colors snap-center",
                  index < periods.length && 
                  ((date.getHours() >= 12 && period === "PM") || 
                  (date.getHours() < 12 && period === "AM"))
                    ? "text-primary text-3xl font-normal"
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