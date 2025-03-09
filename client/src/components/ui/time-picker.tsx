import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      newDate.setHours(isAm ? value : (value === 12 ? 12 : value + 12));
    } else if (type === 'minutes') {
      setSelectedMinute(value);
      newDate.setMinutes(value);
    } else if (type === 'period') {
      setIsAm(value === 0);
      newDate.setHours((selectedHour % 12) + (value === 0 ? 0 : 12));
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
  const itemHeight = 72;
  const totalItems = items.length;
  const extendedItems = loop ? [...items, ...items, ...items] : items;
  const isAdjusting = React.useRef(false);

  const debouncedOnSelect = useDebouncedCallback((value: number) => {
    if (value !== selectedValue) onSelect(value);
  }, 100);

  const handleScroll = React.useCallback(() => {
    if (!columnRef.current || isAdjusting.current) return;
    const element = columnRef.current;
    const centerOffset = (element.clientHeight - itemHeight) / 2;
    const scrollPosition = element.scrollTop + centerOffset;
    let index = Math.round(scrollPosition / itemHeight) % totalItems;

    if (index < 0) index += totalItems;

    clearTimeout((element as any).scrollTimeout);
    (element as any).scrollTimeout = setTimeout(() => {
      const snapTo = index * itemHeight - centerOffset;
      element.scrollTo({ top: snapTo, behavior: "smooth" });
    }, 150);

    if (loop) {
      const thirdHeight = totalItems * itemHeight;
      if (element.scrollTop < thirdHeight - element.clientHeight) {
        isAdjusting.current = true;
        element.scrollTop += thirdHeight;
        isAdjusting.current = false;
      } else if (element.scrollTop > 2 * thirdHeight) {
        isAdjusting.current = true;
        element.scrollTop -= thirdHeight;
        isAdjusting.current = false;
      }
    }

    debouncedOnSelect(items[index]);
  }, [items, totalItems, loop, debouncedOnSelect, itemHeight]);

  React.useEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    const onScroll = () => requestAnimationFrame(handleScroll);
    column.addEventListener("scroll", onScroll);

    return () => column.removeEventListener("scroll", onScroll);
  }, [handleScroll]);

  React.useEffect(() => {
    if (!columnRef.current) return;
    const element = columnRef.current;
    const index = items.indexOf(selectedValue);
    if (index === -1) return;

    const centerOffset = (element.clientHeight - itemHeight) / 2;
    let targetScrollTop = index * itemHeight - centerOffset;

    if (loop) {
      targetScrollTop = (index + totalItems) * itemHeight - centerOffset;
    }

    if (Math.abs(element.scrollTop - targetScrollTop) > 1) {
      element.scrollTo({ top: targetScrollTop, behavior: "smooth" });
    }
  }, [selectedValue, items, totalItems, itemHeight, loop]);

  return (
    <ScrollArea className="h-[216px] w-[80px] overflow-hidden">
      <div
        ref={columnRef}
        className="flex flex-col items-center"
        style={{
          overflowY: "auto",
          height: "216px",
        }}
      >
        {extendedItems.map((item, index) => (
          <div
            key={index}
            className={cn(
              "w-full h-[72px] flex items-center justify-center transition-all duration-300 ease-in-out select-none",
              item === selectedValue
                ? "text-primary text-4xl font-semibold scale-110"
                : "text-muted-foreground/30 text-3xl scale-100"
            )}
            style={{ minHeight: "72px" }}
          >
            {format(item)}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}