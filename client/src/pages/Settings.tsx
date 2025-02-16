import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, stripFileExtension } from "@/lib/utils";
import { DEFAULT_SOUNDS } from '@/lib/useSound';
import { useQueryClient } from '@tanstack/react-query';
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Upload, Volume2, Trash2, Check, History, Bell } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useSound } from "@/lib/useSound";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const { preview, customRingtones, addCustomRingtone } = useSound();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRingtones, setSelectedRingtones] = useState<Set<string>>(new Set());
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [renamingRingtone, setRenamingRingtone] = useState<string | null>(null);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleRingtoneTouchStart = (id: string) => {
    const timer = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedRingtones(new Set([id]));
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handleRingtoneTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleRingtoneClick = (id: string) => {
    if (isSelectionMode) {
      const newSelection = new Set(selectedRingtones);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      setSelectedRingtones(newSelection);

      // Exit selection mode if no items are selected
      if (newSelection.size === 0) {
        setIsSelectionMode(false);
      }
    }
  };

  const handleRingtoneUpload = async (event: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        try {
          const formData = new FormData();
          formData.append('name', file.name);
          formData.append('data', file);
          formData.append('type', file.type);
          formData.append('slot', slot.toString());

          const response = await fetch('/api/audio-files', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(30000)
          });

          if (!response.ok) throw new Error('Upload failed');

          const result = await response.json();
          addCustomRingtone({ 
            id: `db-${result.id}`, 
            url: result.url,
            name: result.name 
          });
          toast({
            title: "Ringtone added",
            description: `${file.name} has been added to your custom ringtones.`,
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload ringtone",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invalid file",
          description: "Please upload an audio file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteRingtones = async () => {
    const promises = Array.from(selectedRingtones).map(async (id) => {
      const dbId = id.replace('db-', '');
      try {
        const response = await fetch(`/api/audio-files/${dbId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete ringtone');
        }
      } catch (error) {
        console.error('Delete error:', error);
        throw error;
      }
    });

    try {
      await Promise.all(promises);
      await queryClient.invalidateQueries({ queryKey: ['/api/audio-files'] });
      setSelectedRingtones(new Set());
      setIsSelectionMode(false);
      toast({
        title: "Success",
        description: `${selectedRingtones.size} ringtone(s) deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some ringtones",
        variant: "destructive",
      });
    }
  };

  const handleRename = async (id: string, newName: string) => {
    const dbId = id.replace('db-', '');
    try {
      const response = await fetch(`/api/audio-files/${dbId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error('Failed to rename ringtone');

      await queryClient.invalidateQueries({ queryKey: ['/api/audio-files'] });
      setRenamingRingtone(null);
      toast({
        title: "Success",
        description: "Ringtone renamed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename ringtone",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Theme Settings */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <Label>Dark Mode</Label>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ringtones */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Ringtones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Ringtones */}
            <div className="space-y-4">
              <h3 className="font-medium">Default Ringtones</h3>
              {Object.entries(DEFAULT_SOUNDS).map(([id, path]) => (
                <div key={id} className="flex items-center justify-between py-2">
                  <span>{id.charAt(0).toUpperCase() + id.slice(1)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => preview(id)}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Custom Ringtones */}
            <div className="space-y-4">
              <h3 className="font-medium">Custom Ringtones</h3>
              {customRingtones.map((ringtone) => (
                <motion.div
                  key={ringtone.id}
                  className={`flex items-center justify-between py-2 cursor-pointer ${
                    isSelectionMode ? 'bg-primary/5 rounded-lg p-2' : ''
                  }`}
                  onTouchStart={() => handleRingtoneTouchStart(ringtone.id)}
                  onTouchEnd={handleRingtoneTouchEnd}
                  onClick={() => handleRingtoneClick(ringtone.id)}
                  whileTap={{ scale: 0.98 }}
                >
                  {renamingRingtone === ringtone.id ? (
                    <Input
                      defaultValue={stripFileExtension(ringtone.name)}
                      className="flex-1 mr-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newName = (e.target as HTMLInputElement).value;
                          handleRename(ringtone.id, newName);
                        } else if (e.key === 'Escape') {
                          setRenamingRingtone(null);
                        }
                      }}
                      onBlur={(e) => {
                        const newName = e.target.value;
                        if (newName !== stripFileExtension(ringtone.name)) {
                          handleRename(ringtone.id, newName + '.wav');
                        }
                        setRenamingRingtone(null);
                      }}
                    />
                  ) : (
                    <span className="flex-1">{stripFileExtension(ringtone.name)}</span>
                  )}
                  <div className="flex gap-2">
                    {isSelectionMode ? (
                      <div className={`w-6 h-6 rounded-full border-2 ${
                        selectedRingtones.has(ringtone.id)
                          ? 'bg-primary border-primary'
                          : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {selectedRingtones.has(ringtone.id) && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          preview(ringtone.url);
                        }}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Upload Button */}
              {!isSelectionMode && (
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    id="ringtone-upload"
                    onChange={(e) => handleRingtoneUpload(e, customRingtones.length + 1)}
                  />
                  <Button
                    variant="outline"
                    asChild
                    className="w-full"
                  >
                    <label htmlFor="ringtone-upload" className="flex items-center justify-center gap-2 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Upload Custom Ringtone
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* About Us */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              About Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Math Alarm is designed to help you wake up and stay mentally sharp.
              By solving math problems to turn off the alarm, you'll start your day
              with an active mind.
            </p>
            <p className="text-muted-foreground mt-2">
              Version 1.0.0
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Selection Mode Actions */}
      <AnimatePresence>
        {isSelectionMode && selectedRingtones.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t"
          >
            <div className="flex justify-center gap-4 max-w-lg mx-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const [selectedId] = selectedRingtones;
                  if (selectedRingtones.size === 1) {
                    setRenamingRingtone(selectedId);
                    setIsSelectionMode(false);
                  } else {
                    toast({
                      title: "Select one ringtone",
                      description: "Please select only one ringtone to rename.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <History className="h-4 w-4" />
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Ringtones</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedRingtones.size} ringtone(s)? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRingtones}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}