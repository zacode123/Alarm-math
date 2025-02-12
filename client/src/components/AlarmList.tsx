import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { type Alarm } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewAlarmForm } from "./NewAlarmForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check, X } from "lucide-react";

interface AlarmListProps {
  alarms: Alarm[];
  onDelete: (ids: number[]) => void;
  onSelectionModeChange?: (isSelectionMode: boolean) => void;
}

export function AlarmList({ alarms, onDelete, onSelectionModeChange }: AlarmListProps) {
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAlarms, setSelectedAlarms] = useState<Set<number>>(new Set());
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);

  // Clear selection mode when component unmounts
  useEffect(() => {
    return () => {
      if (longPressTimeout) clearTimeout(longPressTimeout);
    };
  }, [longPressTimeout]);

  // Notify parent of selection mode changes
  useEffect(() => {
    onSelectionModeChange?.(isSelectionMode);
  }, [isSelectionMode, onSelectionModeChange]);

  const handleTouchStart = (alarmId: number) => {
    if (isSelectionMode) return;

    const timeout = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedAlarms(new Set([alarmId]));
    }, 500); // 500ms for long press

    setLongPressTimeout(timeout);
  };

  const handleTouchEnd = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  const handleClick = (alarm: Alarm) => {
    if (isSelectionMode) {
      const newSelected = new Set(selectedAlarms);
      if (newSelected.has(alarm.id)) {
        newSelected.delete(alarm.id);
      } else {
        newSelected.add(alarm.id);
      }
      setSelectedAlarms(newSelected);
    } else {
      setEditingAlarm(alarm);
    }
  };

  const handleSelectAll = () => {
    setSelectedAlarms(new Set(alarms.map(alarm => alarm.id)));
  };

  const handleDeselectAll = () => {
    setSelectedAlarms(new Set());
  };

  const handleDelete = () => {
    onDelete(Array.from(selectedAlarms));
    setIsSelectionMode(false);
    setSelectedAlarms(new Set());
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedAlarms(new Set());
  };

  if (alarms.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-muted-foreground"
      >
        No active alarms
      </motion.div>
    );
  }

  return (
    <>
      {isSelectionMode && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {selectedAlarms.size} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSelectionMode}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">      
        <AnimatePresence mode="popLayout">
          {alarms.map((alarm) => (
            <motion.div
              key={alarm.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
            >
              <Card
                data-alarm-id={alarm.id}
                className={`bg-card/50 cursor-pointer hover:bg-card/70 transition-colors duration-200 
                  ${isSelectionMode ? 'ring-primary' : ''} 
                  ${selectedAlarms.has(alarm.id) ? 'ring-2' : ''}`}
                onClick={() => handleClick(alarm)}
                onTouchStart={() => handleTouchStart(alarm.id)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchStart(alarm.id)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                <div className="p-4 flex items-center gap-4">
                  {isSelectionMode && (
                    <Checkbox
                      checked={selectedAlarms.has(alarm.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedAlarms);
                        if (checked) {
                          newSelected.add(alarm.id);
                        } else {
                          newSelected.delete(alarm.id);
                        }
                        setSelectedAlarms(newSelected);
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{alarm.time}</div>
                    <div className="text-sm text-muted-foreground">
                      {alarm.days.join(", ")} • {alarm.difficulty}
                    </div>
                  </div>
                  {isSelectionMode && selectedAlarms.has(alarm.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog 
        open={!!editingAlarm && !isSelectionMode} 
        onOpenChange={(open) => !open && setEditingAlarm(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-semibold">Edit Alarm</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {editingAlarm && (
              <NewAlarmForm
                defaultValues={editingAlarm}
                onSuccess={() => setEditingAlarm(null)}
                onCancel={() => setEditingAlarm(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}