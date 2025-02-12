import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { TabsLayout } from "@/components/layout/TabsLayout";
import { useAlarmWorker } from "@/lib/useAlarmWorker";
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
import RecentAlarms from "@/pages/RecentAlarms";
import CompletedAlarms from "@/pages/CompletedAlarms";
import Settings from "@/pages/Settings";

function MainApp() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("recent");
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Initialize alarm worker
  useAlarmWorker();

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(err => {
          console.error('ServiceWorker registration failed:', err);
        });
    }
  }, []);

  // Handle back button and exit dialog
  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      if (isSelectionMode) {
        setIsSelectionMode(false);
      } else {
        setShowExitDialog(true);
      }
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [isSelectionMode]);

  // Handle alarm triggers from worker
  useEffect(() => {
    const handleAlarmTrigger = (event: CustomEvent) => {
      const alarm = event.detail;
      toast({
        title: "Alarm Triggered",
        description: `Time to wake up! ${alarm.time}`,
      });
    };

    window.addEventListener('alarmTriggered' as any, handleAlarmTrigger);
    return () => window.removeEventListener('alarmTriggered' as any, handleAlarmTrigger);
  }, [toast]);

  return (
    <>
      <TabsLayout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        hideNavigation={isSelectionMode}
      >
        {activeTab === "recent" && (
          <RecentAlarms onSelectionModeChange={setIsSelectionMode} />
        )}
        {activeTab === "completed" && <CompletedAlarms />}
        {activeTab === "settings" && <Settings />}
      </TabsLayout>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Application?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you really want to exit the application?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExitDialog(false)}>No</AlertDialogCancel>
            <AlertDialogAction onClick={() => window.close()}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;