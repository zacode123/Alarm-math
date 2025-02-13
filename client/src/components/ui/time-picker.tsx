
import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  onTimeUpdate?: (hours: number, minutes: number) => void;
}

const generateTimeOptions = () => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  return { hours, minutes };
};

export function TimePicker({ date, setDate, onTimeUpdate }: TimePickerProps) {
  const { hours, minutes } = generateTimeOptions();
  const [selectedHour, setSelectedHour] = React.useState(date.getHours() % 12 || 12);
  const [selectedMinute, setSelectedMinute] = React.useState(date.getMinutes());
  const [isAm, setIsAm] = React.useState(date.getHours() < 12);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    audioRef.current = new Audio('/sounds/beep.mp3');
    audioRef.current.volume = 0.1;
    return () => {
      audioRef.current = null;
    };
  }, []);

  const playTickSound = React.useCallback(() => {
    if (audioRef.current) {
      const newAudio = audioRef.current.cloneNode() as HTMLAudioElement;
      newAudio.play().catch(console.error);
      newAudio.onended = () => newAudio.remove();
    }
  }, []);

  const handleTimeChange = React.useCallback((value: number, type: 'hours' | 'minutes' | 'period') => {
    playTickSound();
    
    const newDate = new Date(date);
    if (type === 'hours') {
      setSelectedHour(value);
      const hours = isAm ? value : (value === 12 ? 12 : value + 12);
      newDate.setHours(hours);
    } else if (type === 'minutes') {
      setSelectedMinute(value);
      newDate.setMinutes(value);
    } else if (type === 'period') {
      const newIsAm = value === 0;
      setIsAm(newIsAm);
      const hours = selectedHour + (newIsAm ? 0 : 12);
      newDate.setHours(hours);
      if (selectedHour === 12) {
        newDate.setHours(newIsAm ? 0 : 12);
      }
    }
    
    setDate(newDate);
    onTimeUpdate?.(newDate.getHours(), newDate.getMinutes());
  }, [date, setDate, onTimeUpdate, playTickSound, selectedHour, isAm]);

  return (
    <div className="flex items-center justify-center gap-2">
      <ScrollColumn
        items={hours}
        selectedValue={selectedHour}
        onSelect={(value) => handleTimeChange(value, 'hours')}
        format={(num) => String(num).padStart(2, '0')}
      />
      
      <div className="text-4xl font-medium text-primary">:</div>
      
      <ScrollColumn
        items={minutes}
        selectedValue={selectedMinute}
        onSelect={(value) => handleTimeChange(value, 'minutes')}
        format={(num) => String(num).padStart(2, '0')}
      />
      
      <div className="flex flex-col gap-2 ml-4">
        <button
          className={cn(
            "px-4 py-2 rounded-md transition-colors",
            isAm ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
          onClick={() => handleTimeChange(0, 'period')}
        >
          AM
        </button>
        <button
          className={cn(
            "px-4 py-2 rounded-md transition-colors",
            !isAm ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
          onClick={() => handleTimeChange(1, 'period')}
        >
          PM
        </button>
      </div>
    </div>
  );
}

interface ScrollColumnProps {
  items: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  format: (num: number) => string;
}

function ScrollColumn({ items, selectedValue, onSelect, format }: ScrollColumnProps) {
  const columnRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const itemHeight = 72;
    const scrollPosition = element.scrollTop + element.clientHeight / 2 - itemHeight / 2;
    const index = Math.round(scrollPosition / itemHeight);
    
    if (index >= 0 && index < items.length) {
      onSelect(items[index]);
    }
    
    requestAnimationFrame(() => {
      element.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });
    });
  }, [items, onSelect]);

  React.useEffect(() => {
    if (columnRef.current) {
      const index = items.indexOf(selectedValue);
      if (index !== -1) {
        columnRef.current.scrollTop = index * 72;
      }
    }
  }, [selectedValue, items]);

  return (
    <ScrollArea className="h-[216px] w-[80px]">
      <div
        ref={columnRef}
        className="flex flex-col items-center snap-y snap-mandatory"
        onScroll={handleScroll}
        style={{
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
        {items.map((item) => (
          <div
            key={item}
            className={cn(
              "w-full h-[72px] flex items-center justify-center transition-colors snap-center select-none",
              item === selectedValue
                ? "text-primary text-4xl font-semibold scale-110"
                : "text-muted-foreground/30 text-3xl"
            )}
            style={{ scrollSnapAlign: 'center' }}
          >
            {format(item)}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
