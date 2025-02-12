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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlarmList } from "@/components/AlarmList";
import { TabsLayout } from "@/components/layout/TabsLayout";

export default function RecentAlarms() {
  const { toast } = useToast();
  const { alarms, isLoading, deleteAlarm } = useAlarms();
  const [showNewAlarmForm, setShowNewAlarmForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAlarms, setSelectedAlarms] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleDelete = () => {
    selectedAlarms.forEach(id => deleteAlarm.mutate(id));
    setShowDeleteDialog(false);
    setSelectedAlarms([]);
    toast({
      title: selectedAlarms.length > 1 ? "Alarms deleted" : "Alarm deleted",
      description: `Successfully deleted ${selectedAlarms.length} alarm${selectedAlarms.length > 1 ? 's' : ''}.`
    });
  };

  return (
    <>
      <div className="p-4 pb-20">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading alarms...</div>
          ) : (
            <AlarmList
              alarms={alarms}
              onDelete={(ids) => {
                setSelectedAlarms(ids);
                setShowDeleteDialog(true);
              }}
              onSelectionModeChange={setIsSelectionMode}
            />
          )}
        </div>
      </div>

      {/* Floating Action Button for new alarm */}
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
      <Dialog open={showNewAlarmForm} onOpenChange={setShowNewAlarmForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-semibold">Set New Alarm</DialogTitle>
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