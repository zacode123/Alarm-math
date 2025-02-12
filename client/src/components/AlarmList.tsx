import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { type Alarm } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewAlarmForm } from "./NewAlarmForm";

interface AlarmListProps {
  alarms: Alarm[];
  onDelete: (ids: number[]) => void;
}

export function AlarmList({ alarms, onDelete }: AlarmListProps) {
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);

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
                className="bg-card/50 cursor-pointer hover:bg-card/70 transition-colors duration-200"
                onClick={() => setEditingAlarm(alarm)}
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
        </AnimatePresence>
      </div>

      <Dialog 
        open={!!editingAlarm} 
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