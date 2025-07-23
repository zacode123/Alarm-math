import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useSpring, MotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  onTimeUpdate?: () => void;
  showSoundPreview?: boolean;
  onSoundPreview?: () => void;
}

export function AndroidTimePicker({ date, setDate, onTimeUpdate, showSoundPreview, onSoundPreview }: TimePickerProps) {
  // Extract time components
  const hours12 = date.getHours() % 12 || 12;
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const isPm = hours24 >= 12;

  // Update the date when time components change
  const updateDate = (
    newHours: number,
    newMinutes: number,
    newIsPm: boolean
  ) => {
    const newDate = new Date(date);
    let hours24 = newHours;

    // Convert from 12-hour to 24-hour
    if (newHours === 12) {
      hours24 = newIsPm ? 12 : 0;
    } else {
      hours24 = newIsPm ? newHours + 12 : newHours;
    }

    newDate.setHours(hours24);
    newDate.setMinutes(newMinutes);
    setDate(newDate);
    onTimeUpdate?.();
  };

  // Handle time component changes
  const handleHourChange = (newHour: number) => {
    updateDate(newHour, minutes, isPm);
  };

  const handleMinuteChange = (newMinute: number) => {
    updateDate(hours12, newMinute, isPm);
  };

  const handlePeriodChange = (newIsPm: boolean) => {
    updateDate(hours12, minutes, newIsPm);
  };

  return (
    <div className="bg-background border border-border rounded-xl p-4 shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-center mb-4 text-foreground">Set Alarm Time</h2>

      <div className="flex flex-row justify-center items-center gap-2">
        {/* Hour column */}
        <div className="flex-1">
          <div className="text-sm text-center text-muted-foreground mb-2">
            Hour
          </div>
          <div className="relative h-[180px] overflow-hidden rounded-lg border border-border bg-background">
            <PickerWheel
              items={Array.from({ length: 12 }, (_, i) => i + 1)}
              currentValue={hours12}
              onChange={handleHourChange}
              formatValue={(val) => val < 10 ? "0" + val : val.toString()}
            />
            {/* Selection highlight */}
            <div className="absolute w-full h-[48px] top-1/2 -translate-y-1/2 bg-primary/20 border-y border-primary/40 pointer-events-none z-10" />
          </div>
        </div>

        {/* Separator */}
        <div className="text-2xl font-bold text-primary self-center px-1">:</div>

        {/* Minutes column */}
        <div className="flex-1">
          <div className="text-sm text-center text-muted-foreground mb-2">
            Min
          </div>
          <div className="relative h-[180px] overflow-hidden rounded-lg border border-border bg-background">
            <PickerWheel
              items={Array.from({ length: 60 }, (_, i) => i)}
              currentValue={minutes}
              onChange={handleMinuteChange}
              formatValue={(val) => val < 10 ? "0" + val : val.toString()}
            />
            {/* Selection highlight */}
            <div className="absolute w-full h-[48px] top-1/2 -translate-y-1/2 bg-primary/20 border-y border-primary/40 pointer-events-none z-10" />
          </div>
        </div>

        {/* Period column */}
        <div className="flex-1">
          <div className="text-sm text-center text-muted-foreground mb-2">
            Period
          </div>
          <div className="relative h-[180px] overflow-hidden rounded-lg border border-border bg-background">
            <PickerWheel
              items={["AM", "PM"]}
              currentValue={isPm ? "PM" : "AM"}
              onChange={(val) => handlePeriodChange(val === "PM")}
              formatValue={(val) => val}
            />
            {/* Selection highlight */}
            <div className="absolute w-full h-[48px] top-1/2 -translate-y-1/2 bg-primary/20 border-y border-primary/40 pointer-events-none z-10" />
          </div>
        </div>
      </div>
      
      {/* Sound Preview Button */}
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
  formatValue
}: PickerWheelProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [offsetY, setOffsetY] = React.useState(0);
  const [currentIndex, setCurrentIndex] = React.useState(
    items.findIndex(item => item === currentValue) || 0
  );
  const [lastTime, setLastTime] = React.useState(0);
  const [velocityY, setVelocityY] = React.useState(0);
  const lastY = React.useRef(0);

  // Constants for the wheel
  const itemHeight = 48; // Height of each item in pixels
  const totalItems = items.length;
  const visibleItems = 5; // Number of visible items (including half-visible)
  const listHeight = totalItems * itemHeight;

  // Spring animation for smooth scrolling
  const springY = useSpring(0, {
    stiffness: 400,
    damping: 35,
    restSpeed: 0.01,
    restDelta: 0.01
  });

  // Wrapping index for circular scrolling
  const getWrappedIndex = (index: number): number => {
    return ((index % totalItems) + totalItems) % totalItems;
  };

  // Update the current value when index changes
  React.useEffect(() => {
    const wrappedIndex = getWrappedIndex(currentIndex);
    onChange(items[wrappedIndex]);
  }, [currentIndex]);

  // Update spring position when index changes
  React.useEffect(() => {
    const index = items.findIndex(item => item === currentValue);
    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index);
    }

    // Calculate the center position
    const centerOffset = Math.floor(visibleItems / 2);
    const targetY = -(currentIndex - centerOffset) * itemHeight;
    springY.set(targetY);
  }, [currentValue, currentIndex, items]);

  // Update offsetY from spring
  React.useEffect(() => {
    return springY.on("change", latest => {
      setOffsetY(latest);
    });
  }, [springY]);

  // Drag handlers
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

    // Calculate inertia
    const centerOffset = Math.floor(visibleItems / 2);

    // Add inertia effect with better control
    const inertia = Math.min(Math.max(velocityY * 150, -200), 200); // Limited inertia
    const predictedOffset = offsetY + inertia;

    // Find the closest item to snap to after inertia
    const rawIndex = -Math.round(predictedOffset / itemHeight) + centerOffset;
    const targetIndex = getWrappedIndex(rawIndex);

    // Calculate the target position
    const targetY = -(targetIndex - centerOffset) * itemHeight;

    // Animate to the target position
    springY.set(targetY);

    // Update the current index
    setCurrentIndex(targetIndex);

    // Reset velocity
    setVelocityY(0);
  };

  // Generate the list items with proper positioning
  const generateItems = () => {
    const result = [];
    const centerOffset = Math.floor(visibleItems / 2);

    for (let i = -centerOffset - 3; i <= centerOffset + 3; i++) {
      const index = getWrappedIndex(currentIndex + i);
      const value = items[index];
      const isSelected = i === 0;

      // Calculate the visible position (for 3D effect)
      const position = i * itemHeight;

      // Calculate opacity based on distance from center
      const distance = Math.abs(i);
      const opacity = distance === 0 ? 1 : distance === 1 ? 0.9 : distance === 2 ? 0.5 : 0.3;

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
            transform: `translateY(${position + offsetY + centerOffset * itemHeight}px)`,
            opacity
          }}
        >
          {formatValue(value)}
        </div>
      );
    }

    return result;
  };

  // Wheel event handler
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Get scroll direction
      const direction = e.deltaY > 0 ? 1 : -1;

      // Update index
      const newIndex = getWrappedIndex(currentIndex + direction);
      setCurrentIndex(newIndex);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [currentIndex]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      onTouchStart={(e) => handleStart(e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientY)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => handleStart(e.clientY)}
      onMouseMove={(e) => isDragging && handleMove(e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {generateItems()}
      </div>
    </div>
  );
}