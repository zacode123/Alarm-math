import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function CompletedAlarms() {
  // Using the same completed alarms state from the context
  const completedAlarms = []; // This will be replaced with actual data from context

  return (
    <div className="p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Completed Alarms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedAlarms.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No completed alarms yet
              </div>
            ) : (
              completedAlarms.map((alarm: any, index: number) => (
                <div
                  key={`${alarm.id}-${index}`}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{alarm.time}</div>
                    <div className="text-sm text-muted-foreground">
                      {alarm.date}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
