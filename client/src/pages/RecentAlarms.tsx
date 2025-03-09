import { useState, useEffect } from "react";
import { useAlarms } from "@/lib/useAlarms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { NewAlarmForm } from "@/components/NewAlarmForm";
import { AlarmList } from "@/components/AlarmList";
import { TabsLayout } from "@/components/layout/TabsLayout";
import { useToast } from "@/hooks/use-toast";
import { AlarmLoadingAnimation } from "@/components/AlarmLoadingAnimation";

interface RecentAlarmsProps {
  onSelectionModeChange?: (mode: boolean) => void;
}

export default function RecentAlarms({ onSelectionModeChange }: RecentAlarmsProps) {
  const { toast } = useToast();
  const { alarms, isLoading, deleteAlarm } = useAlarms();
  const [showNewAlarmForm, setShowNewAlarmForm] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleSelectionModeChange = (mode: boolean) => {
    setIsSelectionMode(mode);
    onSelectionModeChange?.(mode);
  };

  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    if (!localStorage.getItem('alarmAnimationShown')) {
      const timer = setTimeout(() => {
        setShowLoading(false);    localStorage.setItem('alarmAnimationShown', 'true');
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, []);
  
  const handleDelete = (ids: number[]) => {
    ids.forEach(id => deleteAlarm.mutate(id));
    toast({
      title: ids.length > 1 ? "Alarms deleted" : "Alarm deleted",
      description: `Successfully deleted ${ids.length} alarm${ids.length > 1 ? 's' : ''}.`
    });
  };

            return (  
                <>  
                  <div className="p-4 pb-20">  
                    <div className="space-y-4">  
                      {showLoading ? (  
                        <AlarmLoadingAnimation />  
                      ) : (  
                        isLoading ? <AlarmLoadingAnimation /> : (
            <AlarmList
              alarms={alarms}
              onDelete={handleDelete}
              onSelectionModeChange={handleSelectionModeChange}
            />
            )
          )}
        </div>
      </div>   
      {!isSelectionMode && (
        <motion.div
          className="fixed bottom-20 right-4"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg"
            onClick={() => setShowNewAlarmForm(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
      <Dialog open={showNewAlarmForm} onOpenChange={setShowNewAlarmForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex items-center justify-between border-b relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewAlarmForm(false)}
              className="hover:bg-transparent absolute left-4"
              aria-label="Close dialog"
            >
              <X className="h-10 w-10" />
            </Button>
            <DialogTitle className="text-2xl font-semibold flex-1 text-center">Set New Alarm</DialogTitle>
            <DialogDescription className="sr-only">
              Create a new alarm with custom settings including time, ringtone, and repeat options
            </DialogDescription>
            <Button
              variant="ghost"
              size="icon"
              form="new-alarm-form"
              type="submit"
              className="hover:bg-transparent absolute right-4"
              aria-label="Save alarm"
            >
              <Check className="h-10 w-10" />
            </Button>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <NewAlarmForm
              onSuccess={() => setShowNewAlarmForm(false)}
              onCancel={() => setShowNewAlarmForm(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}