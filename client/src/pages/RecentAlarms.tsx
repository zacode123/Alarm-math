import { useState } from "react";
import { useAlarms } from "@/lib/useAlarms";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { NewAlarmForm } from "@/components/NewAlarmForm";

export default function RecentAlarms() {
  const { toast } = useToast();
  const { alarms, isLoading, deleteAlarm } = useAlarms();
  const [showNewAlarmForm, setShowNewAlarmForm] = useState(false);

  return (
    <>
      <div className="p-4 pb-20">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading alarms...</div>
          ) : alarms.length === 0 ? (
            <div className="text-center text-muted-foreground">No alarms set</div>
          ) : (
            alarms.map((alarm) => (
              <motion.div
                key={alarm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card
                  className="relative"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-bold">{alarm.time}</h3>
                        <p className="text-sm text-muted-foreground">
                          {alarm.days.join(", ")} • {alarm.difficulty}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button for new alarm */}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alarm{selectedAlarms.length > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to delete the selected alarm{selectedAlarms.length > 1 ? 's' : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Alarm Dialog */}
      <AlertDialog open={showNewAlarmForm} onOpenChange={setShowNewAlarmForm}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">Set New Alarm</AlertDialogTitle>
            <AlertDialogDescription>
              Configure your new alarm with the settings below
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex-1 overflow-y-auto">
            <NewAlarmForm
              onSuccess={() => setShowNewAlarmForm(false)}
              onCancel={() => setShowNewAlarmForm(false)}
            />
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}