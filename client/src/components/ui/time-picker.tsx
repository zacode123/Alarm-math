import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useSpring } from "framer-motion";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
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
    <div className="bg-background rounded-xl p-4 shadow-lg w-full max-w-md mx-auto">
      <div className="flex flex-row justify-center items-center gap-2">
        {/* Hour wheel */}
        <WheelPicker
          items={Array.from({ length: 12 }, (_, i) => i + 1)}
          selectedItem={hours12}
          onChange={handleHourChange}
          formatter={(val) => val.toString().padStart(2, '0')}
          label="Hour"
        />
        
        <div className="text-4xl font-bold text-primary self-center pb-4">:</div>
        
        {/* Minute wheel */}
        <WheelPicker
          items={Array.from({ length: 60 }, (_, i) => i)}
          selectedItem={minutes}
          onChange={handleMinuteChange}
          formatter={(val) => val.toString().padStart(2, '0')}
          label="Minute"
        />
        
        {/* AM/PM selector */}
        <div className="flex flex-col gap-2 ml-4">
          <button
            className={cn(
              "w-16 px-3 py-2 rounded-xl transition-all duration-200",
              !isPm 
                ? "bg-primary text-primary-foreground font-medium shadow-md" 
                : "bg-background text-muted-foreground hover:bg-secondary"
            )}
            onClick={() => handlePeriodChange(false)}
          >
            AM
          </button>
          <button
            className={cn(
              "w-16 px-3 py-2 rounded-xl transition-all duration-200",
              isPm 
                ? "bg-primary text-primary-foreground font-medium shadow-md" 
                : "bg-background text-muted-foreground hover:bg-secondary"
            )}
            onClick={() => handlePeriodChange(true)}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
}

interface WheelPickerProps<T> {
  items: T[];
  selectedItem: T;
  onChange: (item: T) => void;
  formatter: (item: T) => string;
  label: string;
}

function WheelPicker<T>({
  items,
  selectedItem,
  onChange,
  formatter,
  label
}: WheelPickerProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [offsetY, setOffsetY] = React.useState(0);
  const [currentIndex, setCurrentIndex] = React.useState(items.indexOf(selectedItem));
  
  // Constants for the wheel
  const itemHeight = 48;  // Height of each item in pixels
  const visibleItems = 5; // Number of visible items
  const totalHeight = itemHeight * items.length;
  const containerHeight = itemHeight * visibleItems;
  const maxOffset = 0;
  const minOffset = -(totalHeight - containerHeight);
  const halfVisibleItems = Math.floor(visibleItems / 2);
  
  // Spring animation for smooth scrolling
  const springY = useSpring(0, {
    stiffness: 300,
    damping: 30,
    mass: 0.5
  });
  
  // Effect to animate the wheel when currentIndex changes
  React.useEffect(() => {
    const targetOffset = -(currentIndex - halfVisibleItems) * itemHeight;
    springY.set(targetOffset);
  }, [currentIndex, springY, itemHeight]);
  
  // Effect to update offsetY when spring animation changes
  React.useEffect(() => {
    return springY.on("change", latest => {
      setOffsetY(latest);
    });
  }, [springY]);
  
  // Effect to update selectedItem when currentIndex changes
  React.useEffect(() => {
    const index = items.indexOf(selectedItem);
    if (index !== -1 && index !== currentIndex) {
      setCurrentIndex(index);
    }
  }, [selectedItem, items, currentIndex]);
  
  // Calculate the angle for 3D rotation effect
  const getAngle = (index: number) => {
    const centerIndex = currentIndex;
    const diff = index - centerIndex;
    return diff * 18; // Rotate by 18 degrees per item
  };
  
  // Handle touch/mouse interactions
  const handleStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
  };
  
  const handleMove = (clientY: number) => {
    if (!isDragging) return;
    
    const deltaY = clientY - startY;
    let newOffset = offsetY + deltaY;
    
    // Restrict movement beyond boundaries with resistance
    if (newOffset > maxOffset) {
      newOffset = maxOffset + (newOffset - maxOffset) * 0.2;
    } else if (newOffset < minOffset) {
      newOffset = minOffset + (newOffset - minOffset) * 0.2;
    }
    
    springY.set(newOffset);
    setStartY(clientY);
  };
  
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snap to the closest item
    const rawIndex = Math.round(-offsetY / itemHeight) + halfVisibleItems;
    const clampedIndex = Math.max(0, Math.min(items.length - 1, rawIndex));
    
    if (clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex);
      onChange(items[clampedIndex]);
    } else {
      // Still snap to position even if index didn't change
      const targetOffset = -(clampedIndex - halfVisibleItems) * itemHeight;
      springY.set(targetOffset);
    }
  };
  
  // Extend items array to create looping effect
  const extendedItems = [
    ...items.slice(Math.max(0, currentIndex - 10), items.length),
    ...items,
    ...items.slice(0, Math.min(currentIndex + 10, items.length))
  ];
  
  const baseIndex = Math.max(0, currentIndex - 10);
  
  // Event handlers
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      const direction = delta > 0 ? 1 : -1;
      
      const newIndex = Math.max(0, Math.min(items.length - 1, currentIndex + direction));
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        onChange(items[newIndex]);
      }
    };
    
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [currentIndex, items, onChange]);
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-1 font-medium">
        {label}
      </div>
      
      <div 
        ref={containerRef}
        className="w-[70px] h-[240px] relative overflow-hidden rounded-lg bg-secondary/30"
        onTouchStart={(e) => handleStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientY)}
        onMouseMove={(e) => handleMove(e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        {/* Selection indicator */}
        <div className="absolute w-full h-[48px] top-1/2 -translate-y-1/2 bg-primary/10 border-y border-primary/30 pointer-events-none z-10" />
        
        {/* 3D rendering space for the wheel */}
        <div
          className="absolute w-full h-full transform-gpu"
          style={{
            perspective: '400px',
            perspectiveOrigin: 'center',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Wheel items with 3D transformation */}
          <motion.div
            className="absolute top-0 left-0 w-full scrollbar-hide"
            style={{ y: springY }}
          >
            <div className="pt-[96px] pb-[96px]">
              {extendedItems.map((item, index) => {
                const actualIndex = (index + baseIndex) % items.length;
                const isCurrent = items[currentIndex] === item;
                const angle = getAngle(index);
                
                return (
                  <div
                    key={`${index}-${item}`}
                    className={cn(
                      "w-full h-[48px] flex items-center justify-center transition-all duration-200 select-none cursor-pointer",
                      isCurrent ? "text-primary font-semibold" : "text-muted-foreground font-normal"
                    )}
                    style={{
                      transform: `translateZ(${Math.abs(angle) * -1.2}px) rotateX(${angle}deg)`,
                      opacity: 1 - Math.min(1, Math.abs(angle) / 90)
                    }}
                    onClick={() => {
                      setCurrentIndex(actualIndex);
                      onChange(items[actualIndex]);
                    }}
                  >
                    <div className={cn(
                      "text-2xl transition-all",
                      isCurrent ? "scale-110" : "scale-100"
                    )}>
                      {formatter(item)}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
        
        {/* Gradient overlays for fading effect */}
        <div className="absolute top-0 left-0 w-full h-[96px] bg-gradient-to-b from-background via-background/95 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-[96px] bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}