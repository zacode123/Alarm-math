import * as React from "react";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "use-debounce";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

const generateTimeOptions = () => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  return { hours, minutes };
};

export function TimePicker({ date, setDate }: TimePickerProps) {
  const { hours, minutes } = generateTimeOptions();
  const [selectedHour, setSelectedHour] = React.useState(date.getHours() % 12 || 12);
  const [selectedMinute, setSelectedMinute] = React.useState(date.getMinutes());
  const [isAm, setIsAm] = React.useState(date.getHours() < 12);

  const updateTime = React.useCallback((value: number, type: 'hours' | 'minutes' | 'period') => {
    const newDate = new Date(date);
    if (type === 'hours') {
      setSelectedHour(value);
      newDate.setHours(isAm ? (value === 12 ? 0 : value) : (value === 12 ? 12 : value + 12));
    } else if (type === 'minutes') {
      setSelectedMinute(value);
      newDate.setMinutes(value);
    } else if (type === 'period') {
      setIsAm(value === 0);
      const hour = selectedHour === 12 ? 0 : selectedHour;
      newDate.setHours(hour + (value === 0 ? 0 : 12));
    }
    setDate(newDate);
  }, [date, setDate, selectedHour, isAm]);

  return (
    <div className="flex items-center justify-center gap-2">
      <ScrollColumn
        items={hours}
        selectedValue={selectedHour}
        onSelect={(value) => updateTime(value, 'hours')}
        format={(num) => String(num).padStart(2, '0')}
        loop
      />

      <div className="text-4xl font-medium text-primary">:</div>

      <ScrollColumn
        items={minutes}
        selectedValue={selectedMinute}
        onSelect={(value) => updateTime(value, 'minutes')}
        format={(num) => String(num).padStart(2, '0')}
        loop
      />

      <div className="flex flex-col gap-2 ml-4">
        <button
          className={cn(
            "px-4 py-2 rounded-md transition-colors",
            isAm ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
          onClick={() => updateTime(0, 'period')}
        >
          AM
        </button>
        <button
          className={cn(
            "px-4 py-2 rounded-md transition-colors",
            !isAm ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          )}
          onClick={() => updateTime(1, 'period')}
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
  loop?: boolean;
}

function ScrollColumn({ items, selectedValue, onSelect, format, loop = false }: ScrollColumnProps) {
  const columnRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const itemHeight = 72;
  const totalItems = items.length;
  const extendedItems = loop ? [...items, ...items, ...items] : items;
  const [isScrolling, setIsScrolling] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const initialScrollDone = React.useRef(false);
  
  const getSelectedIndex = React.useCallback(() => {
    return items.indexOf(selectedValue);
  }, [items, selectedValue]);

  const scrollToIndex = React.useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    if (!columnRef.current) return;
    
    const element = columnRef.current;
    const centerOffset = (element.clientHeight - itemHeight) / 2;
    let targetScrollTop;
    
    if (loop) {
      // In loop mode, scroll to the middle set of items (second of three sets)
      targetScrollTop = (index + totalItems) * itemHeight - centerOffset;
    } else {
      targetScrollTop = index * itemHeight - centerOffset;
    }
    
    element.scrollTo({ top: targetScrollTop, behavior });
  }, [itemHeight, loop, totalItems]);

  // Initial scroll setup and value change response
  React.useEffect(() => {
    if (!columnRef.current) return;
    
    const index = getSelectedIndex();
    if (index === -1) return;
    
    // On first render or when selectedValue changes
    const behavior = initialScrollDone.current ? "smooth" : "auto";
    scrollToIndex(index, behavior);
    initialScrollDone.current = true;
  }, [selectedValue, getSelectedIndex, scrollToIndex]);

  // Handle continuous scrolling with infinite loop
  const handleScroll = React.useCallback(() => {
    if (!columnRef.current || isScrolling) return;
    
    const element = columnRef.current;
    const centerOffset = (element.clientHeight - itemHeight) / 2;
    const scrollPosition = element.scrollTop + centerOffset;
    let index = Math.round(scrollPosition / itemHeight) % totalItems;
    
    if (index < 0) index += totalItems;
    
    // After scrolling stops, snap to closest item
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const value = items[index];
      if (value !== selectedValue) {
        onSelect(value);
      }
      
      // Snap to position
      const snapTo = (loop ? index + totalItems : index) * itemHeight - centerOffset;
      if (Math.abs(element.scrollTop - snapTo) > 1) {
        setIsScrolling(true);
        element.scrollTo({ top: snapTo, behavior: "smooth" });
        setTimeout(() => setIsScrolling(false), 300);
      }
      
      // Handle loop wrapping
      if (loop) {
        const thirdHeight = totalItems * itemHeight;
        if (element.scrollTop < thirdHeight - element.clientHeight) {
          setIsScrolling(true);
          element.scrollTo({ top: element.scrollTop + thirdHeight, behavior: "auto" });
          setTimeout(() => setIsScrolling(false), 50);
        } else if (element.scrollTop > 2 * thirdHeight) {
          setIsScrolling(true);
          element.scrollTo({ top: element.scrollTop - thirdHeight, behavior: "auto" });
          setTimeout(() => setIsScrolling(false), 50);
        }
      }
    }, 150);
  }, [items, totalItems, loop, selectedValue, onSelect, itemHeight, isScrolling]);

  // Attach scroll listener
  React.useEffect(() => {
    const column = columnRef.current;
    if (!column) return;
    
    const onScroll = () => {
      if (!isScrolling) {
        requestAnimationFrame(handleScroll);
      }
    };
    
    column.addEventListener("scroll", onScroll, { passive: true });
    return () => column.removeEventListener("scroll", onScroll);
  }, [handleScroll, isScrolling]);

  // Component cleanup
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="h-[216px] w-[80px] overflow-hidden relative border rounded-lg"
    >
      {/* Middle indicator */}
      <div className="absolute inset-x-0 h-[72px] top-1/2 -translate-y-1/2 bg-primary/5 pointer-events-none border-y border-primary/20" />
      
      <div
        ref={columnRef}
        className="h-full overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-hide"
        style={{
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="pt-[72px] pb-[72px]"> {/* Padding to center items */}
          {extendedItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                "w-full h-[72px] flex items-center justify-center transition-all duration-200 select-none",
                item === selectedValue
                  ? "text-primary text-4xl font-semibold"
                  : "text-muted-foreground/50 text-3xl"
              )}
              onClick={() => {
                if (item !== selectedValue) {
                  onSelect(item);
                }
              }}
            >
              {format(item)}
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}