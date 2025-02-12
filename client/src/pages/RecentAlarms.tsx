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
  const [selectedAlarms, setSelectedAlarms] = useState<number[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNewAlarmForm, setShowNewAlarmForm] = useState(false);

  const handleDelete = () => {
    selectedAlarms.forEach((id) => {
      deleteAlarm.mutate(id, {
        onSuccess: () => {
          toast({
            title: "Alarm deleted",
            description: "The selected alarm has been removed.",
          });
        },
      });
    });
    setSelectedAlarms([]);
    setShowDeleteDialog(false);
  };

  const toggleAlarmSelection = (id: number) => {
    setSelectedAlarms((current) =>
      current.includes(id)
        ? current.filter((alarmId) => alarmId !== id)
        : [...current, id]
    );
  };

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
                  className={`relative ${
                    selectedAlarms.includes(alarm.id) ? "border-primary" : ""
                  }`}
                  onClick={() => toggleAlarmSelection(alarm.id)}
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

      {/* Delete button (shows when alarms are selected) */}
      {selectedAlarms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2"
        >
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="shadow-lg"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedAlarms.length})
          </Button>
        </motion.div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alarm{selectedAlarms.length > 1 ? 's' : ''}?</AlertDialogTitle>
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
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Set New Alarm</AlertDialogTitle>
          </AlertDialogHeader>
          <NewAlarmForm onSuccess={() => setShowNewAlarmForm(false)} />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
