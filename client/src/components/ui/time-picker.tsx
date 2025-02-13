import * as React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

const generateTimeOptions = () => {
  const hours = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const periods = ["AM", "PM"];
  return { hours, minutes, periods };
};

export function TimePicker({ date, setDate }: TimePickerProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const { hours: hourOptions, minutes: minuteOptions, periods } = generateTimeOptions();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [lastScrollTime, setLastScrollTime] = React.useState(0);
  const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Initialize audio
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
    const now = Date.now();
    if (now - lastScrollTime > 50) { // Debounce sound to prevent rapid firing
      if (audioRef.current) {
        const newAudio = audioRef.current.cloneNode() as HTMLAudioElement;
        newAudio.play().catch(console.error);
        newAudio.onended = () => newAudio.remove();
      }
      setLastScrollTime(now);
    }
  }, [lastScrollTime]);

  const handleScroll = React.useCallback((element: HTMLDivElement, type: 'hours' | 'minutes' | 'period') => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    playTickSound();

    scrollTimeout.current = setTimeout(() => {
      const containerHeight = element.clientHeight;
      const scrollPosition = element.scrollTop;
      const itemHeight = 72; // Fixed height for each item

      let index = Math.round(scrollPosition / itemHeight);

      // Handle infinite scroll wrapping
      if (type === 'hours') {
        if (index >= 12) index = 0;
        if (index < 0) index = 11;
      } else if (type === 'minutes') {
        if (index >= 60) index = 0;
        if (index < 0) index = 59;
      } else if (type === 'period') {
        if (index >= 2) index = 0;
        if (index < 0) index = 1;
      }

      // Smooth scroll to the nearest snap point
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
    }, 150); // Delay to allow smooth scrolling
  }, [date, setDate, playTickSound]);

  return (
    <div className="flex items-center gap-4">
      <ScrollArea className="h-[216px] w-[100px] rounded-md">
        <div 
          className="flex flex-col items-center" 
          onScroll={(e) => handleScroll(e.currentTarget, 'hours')}
        >
          {[...hourOptions, ...hourOptions.slice(0, 3)].map((hour, index) => (
            <div
              key={`${hour}-${index}`}
              className={cn(
                "w-full h-[72px] flex items-center justify-center transition-all snap-center",
                index < hourOptions.length && date.getHours() % 12 === (parseInt(hour) % 12)
                  ? "text-primary scale-110 font-medium"
                  : "text-muted-foreground/50"
              )}
              style={{
                scrollSnapAlign: 'center',
              }}
            >
              <span className="text-3xl">{hour}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="text-4xl font-light text-primary">:</div>

      <ScrollArea className="h-[216px] w-[100px] rounded-md">
        <div 
          className="flex flex-col items-center"
          onScroll={(e) => handleScroll(e.currentTarget, 'minutes')}
        >
          {[...minuteOptions, ...minuteOptions.slice(0, 3)].map((minute, index) => (
            <div
              key={`${minute}-${index}`}
              className={cn(
                "w-full h-[72px] flex items-center justify-center transition-all snap-center",
                index < minuteOptions.length && date.getMinutes() === parseInt(minute)
                  ? "text-primary scale-110 font-medium"
                  : "text-muted-foreground/50"
              )}
              style={{
                scrollSnapAlign: 'center',
              }}
            >
              <span className="text-3xl">{minute}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <ScrollArea className="h-[216px] w-[80px] rounded-md">
        <div 
          className="flex flex-col items-center"
          onScroll={(e) => handleScroll(e.currentTarget, 'period')}
        >
          {[...periods, ...periods.slice(0, 1)].map((period, index) => (
            <div
              key={`${period}-${index}`}
              className={cn(
                "w-full h-[72px] flex items-center justify-center transition-all snap-center",
                index < periods.length && 
                ((date.getHours() >= 12 && period === "PM") || 
                (date.getHours() < 12 && period === "AM"))
                  ? "text-primary scale-110 font-medium"
                  : "text-muted-foreground/50"
              )}
              style={{
                scrollSnapAlign: 'center',
              }}
            >
              <span className="text-2xl">{period}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}