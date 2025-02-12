import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { type Alarm } from "@shared/schema";
import { cn } from "@/lib/utils";

interface AlarmListProps {
  alarms: Alarm[];
  onDelete: (ids: number[]) => void;
}

export function AlarmList({ alarms, onDelete }: AlarmListProps) {
  if (alarms.length === 0) {
    return <div className="text-muted-foreground">No active alarms</div>;
  }

  return (
    <div className="space-y-4">      
      <div className="space-y-2">
        {alarms.map((alarm) => (
          <motion.div key={alarm.id}>
            <Card
              data-alarm-id={alarm.id}
              className="bg-card/50"
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