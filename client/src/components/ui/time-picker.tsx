import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useSpring, MotionValue } from "framer-motion";
import { AndroidTimePicker } from "./android-time-picker";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  // Use our new Android-style time picker
  return <AndroidTimePicker date={date} setDate={setDate} />;
}

// Original TimePicker implementation kept for reference
function OldTimePicker({ date, setDate }: TimePickerProps) {
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
    <div className="bg-background/5 rounded-xl p-6 w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-center mb-4 text-foreground">Set Alarm Time</h2>
      
      <div className="flex flex-row justify-center items-center gap-1">
        {/* Three columns for Hour, Minute, and Period in the Android style */}
        <div className="flex-1">
          <div className="text-sm text-center text-muted-foreground/80 mb-2">
            Hour
          </div>
          <div className="relative h-[200px] border border-primary/20 rounded-lg bg-background/5 overflow-hidden">
            <WheelPicker<number>
              items={Array.from({ length: 12 }, (_, i) => i + 1)}
              selectedItem={hours12}
              onChange={handleHourChange}
              formatter={(val) => val < 10 ? "0" + val : val.toString()}
              loop={true}
              androidStyle={true}
            />
            {/* Selection overlay indicator */}
            <div className="absolute w-full h-[50px] top-1/2 -translate-y-1/2 bg-primary/30 border-y border-primary/40 pointer-events-none" />
          </div>
        </div>
        
        {/* Separator */}
        <div className="text-xl font-bold text-primary self-center mx-1">:</div>
        
        {/* Minutes column */}
        <div className="flex-1">
          <div className="text-sm text-center text-muted-foreground/80 mb-2">
            Min
          </div>
          <div className="relative h-[200px] border border-primary/20 rounded-lg bg-background/5 overflow-hidden">
            <WheelPicker<number>
              items={Array.from({ length: 60 }, (_, i) => i)}
              selectedItem={minutes}
              onChange={handleMinuteChange}
              formatter={(val) => val < 10 ? "0" + val : val.toString()}
              loop={true}
              androidStyle={true}
            />
            {/* Selection overlay indicator */}
            <div className="absolute w-full h-[50px] top-1/2 -translate-y-1/2 bg-primary/30 border-y border-primary/40 pointer-events-none" />
          </div>
        </div>
        
        {/* Period (AM/PM) column */}
        <div className="flex-1 ml-2">
          <div className="text-sm text-center text-muted-foreground/80 mb-2">
            Period
          </div>
          <div className="relative h-[200px] border border-primary/20 rounded-lg bg-background/5 overflow-hidden">
            <WheelPicker<string>
              items={["AM", "PM"]}
              selectedItem={isPm ? "PM" : "AM"}
              onChange={(val) => handlePeriodChange(val === "PM")}
              formatter={(val) => val}
              loop={true}
              androidStyle={true}
            />
            {/* Selection overlay indicator */}
            <div className="absolute w-full h-[50px] top-1/2 -translate-y-1/2 bg-primary/30 border-y border-primary/40 pointer-events-none" />
          </div>
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
  label?: string;
  loop?: boolean;
  androidStyle?: boolean;
}

function WheelPicker<T>({
  items,
  selectedItem,
  onChange,
  formatter,
  label = "",
  loop = false,
  androidStyle = false
}: WheelPickerProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [offsetY, setOffsetY] = React.useState(0);
  const [currentIndex, setCurrentIndex] = React.useState(items.indexOf(selectedItem));
  const [lastDeltaTime, setLastDeltaTime] = React.useState(0);
  const [velocityY, setVelocityY] = React.useState(0);
  const lastY = React.useRef(0);
  const lastTime = React.useRef(0);
  
  // Constants for the wheel
  const itemHeight = 48;  // Height of each item in pixels
  const visibleItems = 5; // Number of visible items
  const totalHeight = itemHeight * items.length;
  const containerHeight = itemHeight * visibleItems;
  const halfVisibleItems = Math.floor(visibleItems / 2);
  
  // Spring animation with optimal values for smooth scrolling
  const springY = useSpring(0, {
    stiffness: 350,
    damping: 35,
    mass: 0.7,
    restSpeed: 0.5
  });
  
  // Handle index wrapping for looping
  const wrapIndex = (index: number): number => {
    if (!loop) return Math.max(0, Math.min(items.length - 1, index));
    
    const len = items.length;
    return ((index % len) + len) % len; // Proper modulo for negative numbers
  };
  
  // Get true scroll bounds based on loop setting
  const getScrollBounds = () => {
    if (loop) {
      // When looping, allow "infinite" scrolling
      return { min: -Number.MAX_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER };
    } else {
      // When not looping, restrict to actual item bounds
      const maxOffset = halfVisibleItems * itemHeight;
      const minOffset = -((items.length - 1) * itemHeight) + (halfVisibleItems * itemHeight);
      return { min: minOffset, max: maxOffset };
    }
  };
  
  // Effect to animate the wheel when currentIndex changes
  React.useEffect(() => {
    const targetOffset = -(currentIndex - halfVisibleItems) * itemHeight;
    springY.set(targetOffset);
  }, [currentIndex, springY, itemHeight, halfVisibleItems]);
  
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
  const getAngle = (visualIndex: number, centerIndex: number) => {
    const diff = visualIndex - centerIndex;
    return diff * 16; // Rotate by 16 degrees per item
  };
  
  // Handle touch/mouse interactions
  const handleStart = (clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    lastY.current = clientY;
    lastTime.current = Date.now();
    setVelocityY(0);
    springY.set(offsetY); // Stop any current animations
  };
  
  const handleMove = (clientY: number) => {
    if (!isDragging) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime.current;
    const deltaY = clientY - lastY.current;
    
    // Calculate velocity for inertia
    if (deltaTime > 0) {
      // Smoother velocity calculation with weight
      const newVelocity = deltaY / deltaTime;
      setVelocityY(prevVelocity => prevVelocity * 0.7 + newVelocity * 0.3);
      setLastDeltaTime(deltaTime);
    }
    
    // Apply scroll movement
    const moveDelta = clientY - startY;
    const newOffset = offsetY + (moveDelta * 1.2); // Increase sensitivity
    
    // Apply scroll bounds with elasticity when not looping
    const { min, max } = getScrollBounds();
    let boundedOffset = newOffset;
    
    if (!loop) {
      if (newOffset > max) {
        boundedOffset = max + (newOffset - max) * 0.2;
      } else if (newOffset < min) {
        boundedOffset = min + (newOffset - min) * 0.2;
      }
    }
    
    springY.set(boundedOffset);
    setStartY(clientY);
    
    // Update for next velocity calculation
    lastY.current = clientY;
    lastTime.current = currentTime;
  };
  
  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Apply inertia
    if (Math.abs(velocityY) > 0.1) {
      // Calculate how far it would go with inertia
      const inertiaDistance = velocityY * lastDeltaTime * 8; // Amplify effect
      const inertiaOffset = offsetY + inertiaDistance;
      
      // Determine the target index after inertia
      const rawInertiaIndex = -Math.round(inertiaOffset / itemHeight) + halfVisibleItems;
      const targetIndex = wrapIndex(rawInertiaIndex);
      
      // Apply spring with inertia feeling
      springY.set(offsetY, false); // Stop any current animation
      
      // Calculate the target position
      const targetPosition = -(targetIndex - halfVisibleItems) * itemHeight;
      
      // Apply spring animation with smooth movement
      springY.set(targetPosition);
      
      // Update current index and notify parent
      if (targetIndex !== currentIndex) {
        const wrappedIndex = wrapIndex(targetIndex);
        setCurrentIndex(wrappedIndex);
        onChange(items[wrappedIndex]);
      }
    } else {
      // No inertia, just snap to closest
      const rawIndex = Math.round(-offsetY / itemHeight) + halfVisibleItems;
      const targetIndex = wrapIndex(rawIndex);
      
      if (targetIndex !== currentIndex) {
        setCurrentIndex(targetIndex);
        onChange(items[targetIndex]);
      }
      
      // Snap animation
      const snapOffset = -(targetIndex - halfVisibleItems) * itemHeight;
      springY.set(snapOffset);
    }
    
    // Reset velocity
    setVelocityY(0);
  };
  
  // Define a type for display items
  interface DisplayItem<T> {
    item: T;
    visualIndex: number;
    realIndex: number;
  }
  
  // Generate display items for the wheel
  const generateDisplayItems = (): Array<T | DisplayItem<T>> => {
    if (!loop) return items;
    
    // For loop mode, we create a circular array with the current selection centered
    const repeats = Math.ceil(visibleItems * 2 / items.length);
    const result: DisplayItem<T>[] = [];
    
    // Create repeats * items.length elements with current index centered
    const centerOffset = Math.floor(repeats / 2) * items.length;
    const startIndex = currentIndex - centerOffset;
    
    for (let i = 0; i < repeats * items.length; i++) {
      const index = wrapIndex(startIndex + i);
      result.push({
        item: items[index],
        visualIndex: i,
        realIndex: index
      });
    }
    
    return result;
  };
  
  const displayItems = generateDisplayItems();
  
  // Event handlers for mouse wheel
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Reduce sensitivity on wheel scroll
      const delta = e.deltaY;
      const direction = delta > 0 ? 1 : -1;
      
      const newIndex = wrapIndex(currentIndex + direction);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        onChange(items[newIndex]);
      }
    };
    
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [currentIndex, items, onChange, loop, wrapIndex]);
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-1 font-medium">
        {label}
      </div>
      
      <div 
        ref={containerRef}
        className="w-[76px] h-[240px] relative overflow-hidden rounded-lg bg-secondary/40 border border-primary/10"
        onTouchStart={(e) => handleStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientY)}
        onMouseMove={(e) => handleMove(e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        {/* Selection indicator */}
        <div className="absolute w-full h-[48px] top-1/2 -translate-y-1/2 bg-primary/20 border-y border-primary/40 pointer-events-none z-10" />
        
        {/* 3D rendering space for the wheel */}
        <div
          className="absolute w-full h-full transform-gpu"
          style={{
            perspective: '500px',
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
              {displayItems.map((displayItem, index) => {
                // Handle different types based on loop mode
                if (loop) {
                  // In loop mode, displayItem is a DisplayItem<T>
                  const dItem = displayItem as DisplayItem<T>;
                  const item = dItem.item;
                  const realIndex = dItem.realIndex;
                  const visualIndex = dItem.visualIndex;
                  const isCurrent = realIndex === currentIndex;
                  
                  // Calculate visual angle based on center position
                  const centerVisualIndex = Math.floor(displayItems.length / 2);
                  const angleDiff = visualIndex - centerVisualIndex;
                  const angle = angleDiff * 18; // More pronounced angle for better 3D effect
                  
                  // Calculate distance for depth effect
                  const depth = Math.abs(angle) * -2.5;
                  
                  return (
                    <div
                      key={`${visualIndex}-${String(item)}`}
                      className={cn(
                        "w-full h-[48px] flex items-center justify-center select-none cursor-pointer",
                        isCurrent 
                          ? "text-primary font-bold" 
                          : Math.abs(angleDiff) <= 1 
                            ? "text-foreground font-medium" 
                            : "text-muted-foreground/70 font-normal"
                      )}
                      style={{
                        transform: `translateZ(${depth}px) rotateX(${angle}deg)`,
                        opacity: 1 - Math.min(0.7, Math.abs(angle) / 90),
                        transition: 'all 0.1s'
                      }}
                      onClick={() => {
                        if (!isCurrent) {
                          setCurrentIndex(realIndex);
                          onChange(items[realIndex]);
                        }
                      }}
                    >
                      <div className={cn(
                        "transition-all transform",
                        isCurrent ? "scale-110 text-3xl" : "text-2xl"
                      )}>
                        {formatter(item)}
                      </div>
                    </div>
                  );
                } else {
                  // In non-loop mode, displayItem is just T
                  const item = displayItem as T;
                  const isCurrent = items[currentIndex] === item;
                  
                  // Calculate visual angle for standard mode
                  const visualIndex = index;
                  const centerVisualIndex = currentIndex + halfVisibleItems;
                  const angleDiff = visualIndex - centerVisualIndex;
                  const angle = angleDiff * 18;
                  
                  // Calculate distance for depth effect
                  const depth = Math.abs(angle) * -2.5;
                  
                  return (
                    <div
                      key={`${index}-${String(item)}`}
                      className={cn(
                        "w-full h-[48px] flex items-center justify-center select-none cursor-pointer",
                        isCurrent 
                          ? "text-primary font-bold" 
                          : Math.abs(angleDiff) <= 1 
                            ? "text-foreground font-medium" 
                            : "text-muted-foreground/70 font-normal"
                      )}
                      style={{
                        transform: `translateZ(${depth}px) rotateX(${angle}deg)`,
                        opacity: 1 - Math.min(0.7, Math.abs(angle) / 90),
                        transition: 'all 0.1s'
                      }}
                      onClick={() => {
                        if (!isCurrent) {
                          setCurrentIndex(index);
                          onChange(item);
                        }
                      }}
                    >
                      <div className={cn(
                        "transition-all transform",
                        isCurrent ? "scale-110 text-3xl" : "text-2xl"
                      )}>
                        {formatter(item)}
                      </div>
                    </div>
                  );
                }
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