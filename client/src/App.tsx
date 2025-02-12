import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { TabsLayout } from "@/components/layout/TabsLayout";
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
  const [permissionStep, setPermissionStep] = useState<'notifications' | 'vibration' | 'complete' | null>('notifications');

  // Handle back button and exit dialog
  useEffect(() => {
    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      setShowExitDialog(true);
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, []);

  // Handle permissions flow
  useEffect(() => {
    const requestPermissions = async () => {
      if (permissionStep === 'notifications') {
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            toast({
              title: "Notifications enabled",
              description: "You'll receive alarm notifications when they go off.",
            });
          }
        }
        setPermissionStep('vibration');
      } else if (permissionStep === 'vibration') {
        if ("vibrate" in navigator) {
          // Test vibration
          navigator.vibrate(200);
          toast({
            title: "Vibration enabled",
            description: "Your device will vibrate when alarms go off.",
          });
        }
        setPermissionStep('complete');
      }
    };

    if (permissionStep !== 'complete' && permissionStep !== null) {
      requestPermissions();
    }
  }, [permissionStep, toast]);

  // Render permission dialogs if not complete
  if (permissionStep !== 'complete' && permissionStep !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Setting up your alarm app</h2>
          <p className="text-muted-foreground">
            {permissionStep === 'notifications' 
              ? "Please allow notifications to get alarm alerts"
              : "Enabling vibration for alarm alerts"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TabsLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "recent" && <RecentAlarms />}
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