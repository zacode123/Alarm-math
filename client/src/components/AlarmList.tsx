import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2 } from "lucide-react";
import { type Alarm } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AlarmListProps {
  alarms: Alarm[];
  onDelete: (ids: number[]) => void;
  onRename?: (id: number) => void;
}

export function AlarmList({ alarms, onDelete, onRename }: AlarmListProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedAlarms, setSelectedAlarms] = useState<Set<number>>(new Set());
  const longPressTimeoutRef = useRef<NodeJS.Timeout>();
  const [longPressActive, setLongPressActive] = useState(false);
  const touchStartTimeRef = useRef<number>(0);

  const handleTouchStart = (alarmId: number, e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default touch behavior
    touchStartTimeRef.current = Date.now();
    longPressTimeoutRef.current = setTimeout(() => {
      setSelectMode(true);
      setSelectedAlarms(new Set([alarmId]));
      setLongPressActive(true);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    const touchDuration = Date.now() - touchStartTimeRef.current;
    setLongPressActive(false);

    // If it was a short tap and we're in select mode, toggle selection
    if (touchDuration < 500 && selectMode) {
      const alarmId = Number(e.currentTarget.getAttribute('data-alarm-id'));
      toggleAlarmSelection(alarmId);
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

  const handleClick = (alarmId: number) => {
    if (selectMode) {
      toggleAlarmSelection(alarmId);
    }
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

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedAlarms(new Set());
  };

  if (alarms.length === 0) {
    return <div className="text-muted-foreground">No active alarms</div>;
  }

  const isAllSelected = selectedAlarms.size === alarms.length;

  return (
    <div className="space-y-4">
      {selectMode && (
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={handleSelectAll}
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={selectedAlarms.size === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {onRename && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const selectedId = Array.from(selectedAlarms)[0];
                  if (selectedId && selectedAlarms.size === 1) {
                    onRename(selectedId);
                  }
                }}
                disabled={selectedAlarms.size !== 1}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {alarms.map((alarm) => (
          <motion.div
            key={alarm.id}
            initial={false}
            animate={{ scale: longPressActive ? 0.95 : 1 }}
          >
            <Card
              data-alarm-id={alarm.id}
              className={cn(
                "transition-colors cursor-pointer",
                selectedAlarms.has(alarm.id) ? "bg-primary/20 border-primary" : "bg-card/50"
              )}
              onTouchStart={(e) => handleTouchStart(alarm.id, e)}
              onTouchEnd={handleTouchEnd}
              onClick={() => handleClick(alarm.id)}
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

      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-2 max-w-6xl mx-auto">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={selectedAlarms.size === 0}
            >
              Delete ({selectedAlarms.size})
            </Button>
            {onRename && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const selectedId = Array.from(selectedAlarms)[0];
                  if (selectedId && selectedAlarms.size === 1) {
                    onRename(selectedId);
                  }
                }}
                disabled={selectedAlarms.size !== 1}
              >
                Rename
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={exitSelectMode}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}