import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAlarmSchema, type InsertAlarm } from "@shared/schema";
import { useAlarms } from "@/lib/useAlarms";
import { useSound } from "@/lib/useSound";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { X, Check, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { TimePicker } from "@/components/ui/time-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const RINGTONES = [
  { id: 'default', name: 'Morning dew' },
  { id: 'digital', name: 'Digital Alarm' },
  { id: 'beep', name: 'Beep' },
];

const REPEAT_OPTIONS = [
  { id: 'once', name: 'Once' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekdays', name: 'Weekdays' },
  { id: 'weekends', name: 'Weekends' },
  { id: 'custom', name: 'Custom' },
];

export function NewAlarmForm({ onSuccess, onCancel, defaultValues }: {
  onSuccess: () => void;
  onCancel: () => void;
  defaultValues?: InsertAlarm;
}) {
  const { toast } = useToast();
  const { createAlarm, updateAlarm } = useAlarms();
  const { preview } = useSound();
  const [vibrationEnabled, setVibrationEnabled] = useState(defaultValues?.vibration ?? ("vibrate" in navigator));
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (defaultValues?.time) {
      const [hours, minutes] = defaultValues.time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      return date;
    }
    return new Date();
  });
  const [showRingtones, setShowRingtones] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [selectedRingtone, setSelectedRingtone] = useState(RINGTONES[0]);
  const [selectedRepeat, setSelectedRepeat] = useState(REPEAT_OPTIONS[0]);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const now = new Date();
    const targetTime = new Date(now);
    targetTime.setHours(selectedDate.getHours());
    targetTime.setMinutes(selectedDate.getMinutes());

    if (targetTime < now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const diffHours = Math.floor((targetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    const diffMinutes = Math.floor(((targetTime.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));

    setTimeRemaining(`Alarm in ${diffHours} hours ${diffMinutes} minutes`);
  }, [selectedDate]);

  const form = useForm<InsertAlarm>({
    resolver: zodResolver(insertAlarmSchema),
    defaultValues: defaultValues ?? {
      time: format(new Date(), "HH:mm"),
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      difficulty: "easy",
      sound: "default",
      volume: 100,
      enabled: true,
      autoDelete: false,
      vibration: vibrationEnabled,
      label: ""
    },
  });

  const onSubmit = async (data: InsertAlarm) => {
    const formattedTime = format(selectedDate, "HH:mm");

    const alarmData = {
      ...data,
      time: formattedTime,
      vibration: vibrationEnabled,
      sound: selectedRingtone.id as "default" | "digital" | "beep"
    };

    try {
      if (defaultValues?.id) {
        await updateAlarm.mutateAsync({ id: defaultValues.id, ...alarmData });
        toast({
          title: "Alarm updated",
          description: "Your alarm has been updated successfully.",
        });
      } else {
        await createAlarm.mutateAsync(alarmData);
        toast({
          title: "Alarm created",
          description: "Your alarm has been set successfully.",
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save alarm. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRingtoneSelect = (ringtone: typeof RINGTONES[0]) => {
    setSelectedRingtone(ringtone);
    preview(ringtone.id as "default" | "digital" | "beep");
    setShowRingtones(false);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          type="button"
          className="hover:bg-transparent"
        >
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-base font-normal">Add alarm</h1>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={form.handleSubmit(onSubmit)}
          type="submit"
          className="hover:bg-transparent"
        >
          <Check className="h-6 w-6" />
        </Button>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground text-center mb-8">
          {timeRemaining}
        </p>

        <div className="flex justify-center items-center mb-12">
          <TimePicker 
            date={selectedDate} 
            setDate={setSelectedDate}
            onTimeUpdate={() => {
              const now = new Date();
              const targetTime = new Date(now);
              targetTime.setHours(selectedDate.getHours());
              targetTime.setMinutes(selectedDate.getMinutes());

              if (targetTime < now) {
                targetTime.setDate(targetTime.getDate() + 1);
              }

              const diffHours = Math.floor((targetTime.getTime() - now.getTime()) / (1000 * 60 * 60));
              const diffMinutes = Math.floor(((targetTime.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));

              setTimeRemaining(`Alarm in ${diffHours} hours ${diffMinutes} minutes`);
            }}
          />
        </div>

        <Form {...form}>
          <form className="space-y-0">
            <div className="flex items-center justify-between py-4 border-t">
              <span className="text-sm">Ringtone</span>
              <Button 
                type="button"
                variant="ghost" 
                className="text-primary text-sm flex items-center gap-2 hover:bg-transparent p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowRingtones(true);
                }}
              >
                {selectedRingtone.name}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <span className="text-sm">Repeat</span>
              <Button 
                type="button"
                variant="ghost" 
                className="text-primary text-sm flex items-center gap-2 hover:bg-transparent p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowRepeat(true);
                }}
              >
                {selectedRepeat.name}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <span className="text-sm">Vibrate when alarm sounds</span>
              <Switch
                checked={vibrationEnabled}
                onCheckedChange={setVibrationEnabled}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <span className="text-sm">Delete after goes off</span>
              <FormField
                control={form.control}
                name="autoDelete"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="py-4 border-t">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter label"
                        className="bg-muted/20 border-0"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </div>

      <Dialog 
        open={showRingtones} 
        onOpenChange={(open) => {
          if (!open) setShowRingtones(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Ringtone</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {RINGTONES.map((ringtone) => (
              <Button
                key={ringtone.id}
                type="button"
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRingtoneSelect(ringtone);
                }}
              >
                {ringtone.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={showRepeat} 
        onOpenChange={(open) => {
          if (!open) setShowRepeat(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Repeat</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {REPEAT_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedRepeat(option);
                  setShowRepeat(false);
                }}
              >
                {option.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}