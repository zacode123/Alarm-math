import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
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
  const longPressTimer = useRef<NodeJS.Timeout>();
  const [longPressActive, setLongPressActive] = useState(false);

  const handleTouchStart = (alarmId: number) => {
    longPressTimer.current = setTimeout(() => {
      setSelectMode(true);
      setSelectedAlarms(new Set([alarmId]));
      setLongPressActive(true);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setLongPressActive(false);
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

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedAlarms(new Set());
  };

  const isAllSelected = selectedAlarms.size === alarms.length;

  if (alarms.length === 0) {
    return <div className="text-muted-foreground">No active alarms</div>;
  }

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
                  const [selectedId] = selectedAlarms;
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

      {alarms.map((alarm) => (
        <motion.div
          key={alarm.id}
          initial={false}
          animate={{ scale: longPressActive ? 0.95 : 1 }}
        >
          <Card
            className={cn(
              "bg-card/50 transition-colors",
              selectedAlarms.has(alarm.id) && "bg-primary/20 border-primary"
            )}
            onTouchStart={() => handleTouchStart(alarm.id)}
            onTouchEnd={handleTouchEnd}
            onClick={() => toggleAlarmSelection(alarm.id)}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{alarm.time}</div>
              <div className="text-sm text-muted-foreground">
                {alarm.days.join(", ")} • {alarm.difficulty}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {selectMode && (
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={exitSelectMode}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
