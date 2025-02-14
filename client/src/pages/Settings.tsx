import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleRingtoneUpload = async (event: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = (e.target?.result as string).split(',')[1];
          try {
            const response = await fetch('/api/audio-files', {
              body: JSON.stringify({
                name: `Custom Ringtone ${slot}`,
                data: base64Data,
                type: file.type,
                slot: slot
              }),
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: file.name,
                data: base64Data,
                type: file.type
              }),
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
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file",
          description: "Please upload an audio file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteRingtone = (index: number, url: string) => {
    URL.revokeObjectURL(url);
    // Since we can't modify the customRingtones array directly,
    // we'll create a new array without the deleted ringtone
    const updatedRingtones = customRingtones.filter((_, i) => i !== index);
    // Re-add all ringtones except the deleted one
    updatedRingtones.forEach(ringtone => {
      addCustomRingtone(ringtone);
    });
    toast({
      title: "Ringtone deleted",
      description: "Custom ringtone has been removed successfully.",
    });
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
              {Object.entries({
                default: "Default Alarm",
                digital: "Digital",
                beep: "Beep",
              }).map(([id, name]) => (
                <div key={id} className="flex items-center justify-between py-2">
                  <span>{name}</span>
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
              <div className="space-y-4">
                {[1, 2, 3].map((slot) => (
                  <div key={slot} className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      id={`ringtone-upload-${slot}`}
                      onChange={(e) => handleRingtoneUpload(e, slot)}
                    />
                    <Button
                      variant="outline"
                      asChild
                      className="w-full"
                    >
                      <label htmlFor={`ringtone-upload-${slot}`} className="flex items-center justify-center gap-2 cursor-pointer">
                        <Upload className="h-4 w-4" />
                        Custom Ringtone {slot}
                      </label>
                    </Button>
                  </div>
                ))}
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