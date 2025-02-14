import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_SOUNDS } from '@/lib/useSound';
import { useQueryClient } from '@tanstack/react-query';
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Upload, Volume2, Trash2 } from "lucide-react";
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
import { motion } from "framer-motion";
import { useSound } from "@/lib/useSound";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const { preview, customRingtones, addCustomRingtone } = useSound();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
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
            signal: AbortSignal.timeout(30000) // 30 second timeout
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


  const handleDeleteRingtone = async (index: number, url: string) => {
    URL.revokeObjectURL(url);
    const ringtoneId = customRingtones[index].id;
    const dbId = ringtoneId.replace('db-', '');

    try {
      const response = await fetch(`/api/audio-files/${dbId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete ringtone');
      }

      // Invalidate and refetch audio files query
      await queryClient.invalidateQueries({ queryKey: ['/api/audio-files'] });

      toast({
        title: "Ringtone deleted",
        description: "Custom ringtone has been removed successfully.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete ringtone",
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
            <CardTitle>Appearance</CardTitle>
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
            <CardTitle>Ringtones</CardTitle>
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
              {customRingtones.map((ringtone, index) => (
                <div key={ringtone.id} className="flex items-center justify-between py-2">
                  <span>{ringtone.name}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => preview(ringtone.url)}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ringtone</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this custom ringtone? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRingtone(index, ringtone.url)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
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
            </div>
          </CardContent>
        </Card>

        {/* About Us */}
        <Card>
          <CardHeader>
            <CardTitle>About Us</CardTitle>
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
    </div>
  );
}