import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { type Alarm, type WeekDay } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewAlarmForm } from "./NewAlarmForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil } from "lucide-react";
import { useAlarms } from "@/lib/useAlarms";

interface AlarmListProps {
  alarms: Alarm[];
  onDelete: (ids: number[]) => void;
  onSelectionModeChange?: (isSelectionMode: boolean) => void;
}

export function AlarmList({ alarms, onDelete, onSelectionModeChange }: AlarmListProps) {
  const { updateAlarm } = useAlarms();
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAlarms, setSelectedAlarms] = useState<Set<number>>(new Set());
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSelectionMode && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsSelectionMode(false);
        setSelectedAlarms(new Set());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelectionMode]);

  useEffect(() => {
    return () => {
      if (longPressTimeout) clearTimeout(longPressTimeout);
    };
  }, [longPressTimeout]);

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
    const selectedAlarm = alarms.find(a => a.id === selectedId);
    if (selectedId && selectedAlarm) {
      setNewLabel(selectedAlarm.label || "");
      setIsRenaming(true);
    }
  };

  const handleRenameSubmit = async () => {
    const selectedId = Array.from(selectedAlarms)[0];
    if (selectedId) {
      await updateAlarm.mutateAsync({ id: selectedId, label: newLabel });
      setIsRenaming(false);
      setIsSelectionMode(false);
      setSelectedAlarms(new Set());
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedAlarms(new Set());
  };

  const formatDays = (days: string[]): string => {
    const dayMap: Record<string, string> = {
      'mon': 'Monday',
      'tue': 'Tuesday',
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday',
      'sun': 'Sunday'
    };
    return days.map(day => dayMap[day] || day).join(", ");
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
    <div ref={containerRef}>
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
                    {alarm.label && (
                      <div className="text-xl font-bold mb-1">{alarm.label}</div>
                    )}
                    <div className="text-2xl font-bold">{alarm.time}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDays(alarm.days)} • {alarm.difficulty}
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
          <DialogHeader className="px-6 pt-6 pb-2 flex items-center justify-between border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingAlarm(null)}
              className="hover:bg-transparent"
            >
              <X className="h-6 w-6" />
            </Button>
            <DialogTitle className="text-xl font-semibold">Edit Alarm</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              form="edit-alarm-form"
              type="submit"
              className="hover:bg-transparent"
            >
              <Check className="h-6 w-6" />
            </Button>
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

      <Dialog
        open={isRenaming}
        onOpenChange={(open) => !open && setIsRenaming(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Alarm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Enter alarm name"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRenaming(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameSubmit}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-background border-t p-4"
          >
            <div className="flex justify-center items-center gap-4">
              {selectedAlarms.size === 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRename}
                  className="h-12 w-12"
                >
                  <Pencil className="h-6 w-6" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={selectedAlarms.size === 0}
                className={`h-12 w-12 ${
                  selectedAlarms.size === 0 ? 'text-muted-foreground' : 'text-destructive'
                }`}
              >
                <Trash2 className="h-6 w-6" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}