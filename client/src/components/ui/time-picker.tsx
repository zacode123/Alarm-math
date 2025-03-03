import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebouncedCallback } from "use-debounce";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  onTimeUpdate?: () => void;
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
  const [selectedPeriod, setSelectedPeriod] = React.useState(date.getHours() >= 12 ? 'PM' : 'AM');

  const updateTime = React.useCallback(() => {
    const newDate = new Date(date);
    let hours24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour !== 12) hours24 += 12;
    if (selectedPeriod === 'AM' && selectedHour === 12) hours24 = 0;
    newDate.setHours(hours24);
    newDate.setMinutes(selectedMinute);
    setDate(newDate);
    onTimeUpdate?.();
  }, [date, setDate, selectedHour, selectedMinute, selectedPeriod, onTimeUpdate]);

  React.useEffect(() => {
    updateTime();
  }, [selectedHour, selectedMinute, selectedPeriod, updateTime]);

  return (
    <div className="inline-flex items-center gap-2 bg-muted/20 p-4 rounded-xl">
      <ScrollColumn
        items={hours}
        selectedValue={selectedHour}
        onSelect={setSelectedHour}
        format={(num) => String(num).padStart(2, '0')}
        loop={true}
      />
      <div className="text-4xl font-semibold">:</div>
      <ScrollColumn
        items={minutes}
        selectedValue={selectedMinute}
        onSelect={setSelectedMinute}
        format={(num) => String(num).padStart(2, '0')}
        loop={true}
      />
      <ScrollColumn
        items={['AM', 'PM']}
        selectedValue={selectedPeriod}
        onSelect={setSelectedPeriod}
        format={(str) => str}
      />
    </div>
  );
}

interface ScrollColumnProps<T> {
  items: T[];
  selectedValue: T;
  onSelect: (value: T) => void;
  format: (value: T) => string;
  loop?: boolean;
}

function ScrollColumn<T>({ items, selectedValue, onSelect, format, loop = false }: ScrollColumnProps<T>) {
  const columnRef = React.useRef<HTMLDivElement>(null);
  const itemHeight = 72;
  const totalItems = items.length;
  const extendedItems = loop ? [...items, ...items, ...items] : items;
  const isAdjusting = React.useRef(false);

  // Debounce selection updates for smoother scrolling
  const debouncedOnSelect = useDebouncedCallback((value: T) => {
    if (value !== selectedValue) onSelect(value);
  }, 50);

  const handleScroll = React.useCallback(() => {
    if (isAdjusting.current || !columnRef.current) return;
    const element = columnRef.current;
    const centerOffset = (element.clientHeight - itemHeight) / 2;
    const scrollPosition = element.scrollTop + centerOffset;
    const index = Math.round(scrollPosition / itemHeight) % totalItems;

    // Infinite scroll adjustment
    if (loop) {
      const thirdHeight = totalItems * itemHeight;
      const currentScroll = element.scrollTop;

      if (currentScroll < thirdHeight - element.clientHeight) {
        isAdjusting.current = true;
        element.scrollTop += thirdHeight;
        isAdjusting.current = false;
      } else if (currentScroll > 2 * thirdHeight) {
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
              "w-full h-[72px] flex items-center justify-center",
              "transition-all duration-300 ease-in-out select-none",
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