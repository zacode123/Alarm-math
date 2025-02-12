
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Alarm } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Check, Trash2, X } from "lucide-react";

interface AlarmListProps {
  alarms: Alarm[];
  onDelete: (ids: number[]) => void;
}

export function AlarmList({ alarms, onDelete }: AlarmListProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedAlarms, setSelectedAlarms] = useState<Set<number>>(new Set());
  const longPressTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTouchStart = (alarmId: number, e: React.TouchEvent) => {
    e.preventDefault();
    longPressTimeoutRef.current = setTimeout(() => {
      setSelectMode(true);
      setSelectedAlarms(new Set([alarmId]));
    }, 500);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  const toggleAlarmSelection = (alarmId: number) => {
    if (!selectMode) return;

    setSelectedAlarms(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(alarmId)) {
        newSelection.delete(alarmId);
      } else {
        newSelection.add(alarmId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedAlarms.size === alarms.length) {
      setSelectedAlarms(new Set());
    } else {
      setSelectedAlarms(new Set(alarms.map(alarm => alarm.id)));
    }
  };

  const handleDelete = () => {
    onDelete(Array.from(selectedAlarms));
    setSelectMode(false);
    setSelectedAlarms(new Set());
  };

  const handleExitSelectMode = () => {
    setSelectMode(false);
    setSelectedAlarms(new Set());
  };

  if (alarms.length === 0) {
    return <div className="text-muted-foreground">No active alarms</div>;
  }

  return (
    <div className="space-y-4">
      {selectMode && (
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedAlarms.size === alarms.length ? "Deselect All" : "Select All"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExitSelectMode}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={selectedAlarms.size === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {alarms.map((alarm) => (
          <motion.div key={alarm.id}>
            <Card
              data-alarm-id={alarm.id}
              className={cn(
                "transition-colors",
                selectedAlarms.has(alarm.id) ? "bg-primary/20 border-primary" : "bg-card/50"
              )}
              onTouchStart={(e) => handleTouchStart(alarm.id, e)}
              onTouchEnd={handleTouchEnd}
              onClick={() => toggleAlarmSelection(alarm.id)}
            >
              <div className="p-4">
                <div className="text-2xl font-bold">{alarm.time}</div>
                <div className="text-sm text-muted-foreground">
                  {alarm.days.join(", ")} • {alarm.difficulty}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
