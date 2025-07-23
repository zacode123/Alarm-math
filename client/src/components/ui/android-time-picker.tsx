import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  onTimeUpdate?: () => void;
  showSoundPreview?: boolean;
  onSoundPreview?: () => void;
}

export function AndroidTimePicker({
  date,
  setDate,
  onTimeUpdate,
  showSoundPreview,
  onSoundPreview,
}: TimePickerProps) {
  const hours12 = date.getHours() % 12 || 12;
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const isPm = hours24 >= 12;

  const updateDate = (newHours: number, newMinutes: number, newIsPm: boolean) => {
    const newDate = new Date(date);
    let h24 = newHours;
    if (newHours === 12) h24 = newIsPm ? 12 : 0;
    else h24 = newIsPm ? newHours + 12 : newHours;

    newDate.setHours(h24);
    newDate.setMinutes(newMinutes);
    setDate(newDate);
    onTimeUpdate?.();
  };

  return (
    <div className="bg-background border border-border rounded-xl p-4 shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-center mb-4 text-foreground">
        Set Alarm Time
      </h2>

      <div className="flex flex-row justify-center items-center gap-2">
        {/* Hour */}
        <TimeColumn
          label="Hour"
          items={Array.from({ length: 12 }, (_, i) => i + 1)}
          value={hours12}
          onChange={(h) => updateDate(h, minutes, isPm)}
        />

        <div className="text-2xl font-bold text-primary self-center px-1">:</div>

        {/* Minute */}
        <TimeColumn
          label="Min"
          items={Array.from({ length: 60 }, (_, i) => i)}
          value={minutes}
          onChange={(m) => updateDate(hours12, m, isPm)}
        />

        {/* AM/PM */}
        <TimeColumn
          label="Period"
          items={["AM", "PM"]}
          value={isPm ? "PM" : "AM"}
          onChange={(val) => updateDate(hours12, minutes, val === "PM")}
        />
      </div>

      {showSoundPreview && onSoundPreview && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onSoundPreview}
            className="text-primary border-primary hover:bg-primary/10"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Preview Sound
          </Button>
        </div>
      )}
    </div>
  );
}

function TimeColumn<T>({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: T[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex-1">
      <div className="text-sm text-center text-muted-foreground mb-2">
        {label}
      </div>
      <div className="relative h-[180px] overflow-hidden rounded-lg border border-border bg-background">
        <PickerWheel
          items={items}
          currentValue={value}
          onChange={onChange}
          formatValue={(val) =>
            typeof val === "number" && val < 10
              ? "0" + val
              : val.toString()
          }
        />
        <div className="absolute w-full h-[48px] top-1/2 -translate-y-1/2 bg-primary/20 border-y border-primary/40 pointer-events-none z-10" />
      </div>
    </div>
  );
}

interface PickerWheelProps<T> {
  items: T[];
  currentValue: T;
  onChange: (value: T) => void;
  formatValue: (value: T) => string;
}

function PickerWheel<T>({
  items,
  currentValue,
  onChange,
  formatValue,
}: PickerWheelProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [offsetY, setOffsetY] = React.useState(0);
  const [velocityY, setVelocityY] = React.useState(0);
  const lastY = React.useRef(0);
  const [lastTime, setLastTime] = React.useState(0);

  const itemHeight = 48;
  const totalItems = items.length;
  const visibleItems = 5;

  const initialIndex = items.findIndex((item) => item === currentValue);
  const [currentIndex, setCurrentIndex] = React.useState(
    initialIndex >= 0 ? initialIndex : 0
  );

  const springY = useSpring(0, {
    stiffness: 400,
    damping: 35,
    restSpeed: 0.01,
    restDelta: 0.01,
  });

  const getWrappedIndex = (index: number) =>
    ((index % totalItems) + totalItems) % totalItems;

  React.useEffect(() => {
    const wrappedIndex = getWrappedIndex(currentIndex);
    const newValue = items[wrappedIndex];
    if (newValue !== currentValue) {
      onChange(newValue);
    }
  }, [currentIndex]);

  React.useEffect(() => {
    const index = items.findIndex((item) => item === currentValue);
    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index);
    }

    const centerOffset = Math.floor(visibleItems / 2);
    const targetY = -(index - centerOffset) * itemHeight;
    springY.set(targetY);
  }, [currentValue]);

  React.useEffect(() => {
    return springY.on("change", (latest) => setOffsetY(latest));
  }, [springY]);

  const handleStart = (y: number) => {
    setIsDragging(true);
    setStartY(y);
    lastY.current = y;
    setLastTime(Date.now());
    springY.set(offsetY, false);
  };

  const handleMove = (y: number) => {
    if (!isDragging) return;
    const now = Date.now();
    const deltaTime = now - lastTime;
    const deltaY = y - lastY.current;
    if (deltaTime > 0) {
      setVelocityY(deltaY / deltaTime);
    }
    const newOffset = offsetY + (y - startY);
    springY.set(newOffset, false);
    setStartY(y);
    lastY.current = y;
    setLastTime(now);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const centerOffset = Math.floor(visibleItems / 2);
    const inertia = Math.min(Math.max(velocityY * 150, -200), 200);
    const predictedOffset = offsetY + inertia;
    const rawIndex = -Math.round(predictedOffset / itemHeight) + centerOffset;
    const targetIndex = getWrappedIndex(rawIndex);
    const targetY = -(targetIndex - centerOffset) * itemHeight;
    springY.set(targetY);
    setCurrentIndex(targetIndex);
    setVelocityY(0);
  };

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      setCurrentIndex((prev) => getWrappedIndex(prev + direction));
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [currentIndex]);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientY);
    };
    const handleMouseUp = () => {
      if (isDragging) handleEnd();
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const centerOffset = Math.floor(visibleItems / 2);
  const renderItems = () => {
    const result = [];
    for (let i = -centerOffset - 3; i <= centerOffset + 3; i++) {
      const index = getWrappedIndex(currentIndex + i);
      const value = items[index];
      const position = i * itemHeight;
      const distance = Math.abs(i);
      const opacity = distance === 0 ? 1 : distance === 1 ? 0.9 : distance === 2 ? 0.5 : 0.3;
      const isSelected = i === 0;

      result.push(
        <div
          key={`${currentIndex}-${i}-${String(value)}`}
          className={cn(
            "absolute w-full flex items-center justify-center h-[48px] select-none transition-colors",
            isSelected
              ? "text-foreground text-xl font-semibold"
              : "text-muted-foreground text-lg font-normal"
          )}
          style={{
            transform: `translateY(${position + offsetY}px)`,
            opacity,
          }}
        >
          {formatValue(value)}
        </div>
      );
    }
    return result;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden touch-none"
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
      onTouchMove={(e) => {
        e.preventDefault();
        handleMove(e.touches[0].clientY);
      }}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientY)}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {renderItems()}
      </div>
    </div>
  );
}