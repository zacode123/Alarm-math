import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { type Alarm } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewAlarmForm } from "./NewAlarmForm";
import { Button } from "@/components/ui/button";
import { Trash2, Check, X, Pencil } from "lucide-react";

interface AlarmListProps {
  alarms: Alarm[];
  onDelete: (ids: number[]) => void;
  onRename?: (id: number) => void;
  onSelectionModeChange?: (isSelectionMode: boolean) => void;
}

export function AlarmList({ alarms, onDelete, onRename, onSelectionModeChange }: AlarmListProps) {
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

  const handleRename = () => {
    const selectedId = Array.from(selectedAlarms)[0];
    if (selectedId && onRename) {
      onRename(selectedId);
    }
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
      <div className="space-y-4 pb-16">      
        {isSelectionMode && (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
            <span className="text-sm text-muted-foreground">
              {selectedAlarms.size} selected
            </span>
            <div className="flex gap-2">
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
            </div>
          </div>
        )}
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
                  ${selectedAlarms.has(alarm.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                onClick={() => handleClick(alarm)}
                onTouchStart={() => handleTouchStart(alarm.id)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={() => handleTouchStart(alarm.id)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{alarm.time}</div>
                    <div className="text-sm text-muted-foreground">
                      {alarm.days.join(", ")} • {alarm.difficulty}
                    </div>
                  </div>
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

      {/* Bottom Selection Mode Actions */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-background border-t"
          >
            <div className="grid grid-cols-3 divide-x">
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 py-4 rounded-none h-auto"
                onClick={exitSelectionMode}
              >
                <X className="h-5 w-5" />
                <span className="text-xs">Cancel</span>
              </Button>
              {selectedAlarms.size === 1 && onRename && (
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-1 py-4 rounded-none h-auto"
                  onClick={handleRename}
                >
                  <Pencil className="h-5 w-5" />
                  <span className="text-xs">Rename</span>
                </Button>
              )}
              <Button
                variant={selectedAlarms.size > 0 ? "ghost" : "ghost"}
                className={`flex flex-col items-center gap-1 py-4 rounded-none h-auto ${
                  selectedAlarms.size === 0 ? 'text-muted-foreground' : 'text-destructive'
                }`}
                onClick={handleDelete}
                disabled={selectedAlarms.size === 0}
              >
                <Trash2 className="h-5 w-5" />
                <span className="text-xs">Delete ({selectedAlarms.size})</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}