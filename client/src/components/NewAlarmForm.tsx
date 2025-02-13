
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const RINGTONES = [
  { id: 'default', name: 'Morning dew' },
  { id: 'alarm_clock', name: 'Alarm Clock' },
  { id: 'digital_alarm', name: 'Digital Alarm' },
  { id: 'beep', name: 'Beep' },
];

const REPEAT_OPTIONS = [
  { id: 'once', name: 'Once' },
  { id: 'daily', name: 'Daily' },
  { id: 'weekdays', name: 'Weekdays' },
  { id: 'weekends', name: 'Weekends' },
  { id: 'custom', name: 'Custom' },
];

const generateTimeOptions = () => {
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  return { hours, minutes };
};

export function NewAlarmForm({ onSuccess, onCancel, defaultValues }: {
  onSuccess: () => void;
  onCancel: () => void;
  defaultValues?: InsertAlarm;
}) {
  const { toast } = useToast();
  const { createAlarm, updateAlarm } = useAlarms();
  const { preview } = useSound();
  const [vibrationEnabled, setVibrationEnabled] = useState(defaultValues?.vibration ?? ("vibrate" in navigator));
  const [hours, setHours] = useState("08");
  const [minutes, setMinutes] = useState("00");
  const [ampm, setAmpm] = useState("AM");
  const [showRingtones, setShowRingtones] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [selectedRingtone, setSelectedRingtone] = useState(RINGTONES[0]);
  const [selectedRepeat, setSelectedRepeat] = useState(REPEAT_OPTIONS[0]);
  const { hours: hourOptions, minutes: minuteOptions } = generateTimeOptions();

  const form = useForm<InsertAlarm>({
    resolver: zodResolver(insertAlarmSchema),
    defaultValues: defaultValues ?? {
      time: "",
      days: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
      difficulty: "easy",
      sound: "default",
      volume: 100,
      enabled: true,
      autoDelete: false,
      vibration: vibrationEnabled,
      label: ""
    },
  });

  const onSubmit = (data: InsertAlarm) => {
    const formattedTime = format(new Date(`2000-01-01 ${hours}:${minutes} ${ampm}`), "HH:mm");

    const alarmData = {
      ...data,
      time: formattedTime,
      vibration: vibrationEnabled
    };

    if (defaultValues) {
      updateAlarm.mutate({ id: defaultValues.id, ...alarmData }, {
        onSuccess: () => {
          toast({
            title: "Alarm updated",
            description: "Your alarm has been updated successfully.",
          });
          onSuccess();
        },
      });
    } else {
      createAlarm.mutate(alarmData, {
        onSuccess: () => {
          toast({
            title: "Alarm created",
            description: "Your alarm has been set successfully.",
          });
          onSuccess();
        },
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-normal">Add alarm</h1>
        <Button variant="ghost" size="icon" onClick={form.handleSubmit(onSubmit)}>
          <Check className="h-6 w-6" />
        </Button>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground text-center mb-8">
          Alarm in 23 hours 59 minutes
        </p>

        <div className="flex justify-center items-center gap-8 mb-12">
          <div className="flex items-center">
            <ScrollArea className="h-[300px] w-[100px] rounded-md">
              <div className="flex flex-col items-center">
                {hourOptions.map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      setHours(h);
                      const audio = new Audio('/sounds/beep.mp3');
                      audio.volume = 0.5;
                      audio.play().catch(console.error);
                      audio.onended = () => audio.remove();
                    }}
                    className={`w-full py-6 text-3xl font-medium transition-all ${
                      hours === h 
                        ? 'text-primary scale-110' 
                        : 'text-muted-foreground/50'
                    }`}
                  >
                    {h.padStart(2, '0')}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <span className="text-5xl mx-4 font-light text-primary">:</span>
            <ScrollArea className="h-[300px] w-[100px] rounded-md">
              <div className="flex flex-col items-center">
                {minuteOptions.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMinutes(m);
                      const audio = new Audio('/sounds/beep.mp3');
                      audio.volume = 0.5;
                      audio.play().catch(console.error);
                      audio.onended = () => audio.remove();
                    }}
                    className={`w-full py-6 text-3xl font-medium transition-all ${
                      minutes === m 
                        ? 'text-primary scale-110' 
                        : 'text-muted-foreground/50'
                    }`}
                  >
                    {m.padStart(2, '0')}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="h-[300px] w-[80px] rounded-md ml-6">
              <div className="flex flex-col items-center">
                {["AM", "PM"].map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setAmpm(period);
                      new Audio('/sounds/beep.mp3').play().catch(console.error);
                    }}
                    className={`w-full py-4 text-2xl transition-all ${ampm === period ? 'text-primary font-medium scale-110' : 'text-muted-foreground'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-4">
            <div className="flex items-center justify-between py-4 border-t">
              <span>Ringtone</span>
              <Button 
                variant="ghost" 
                className="text-primary flex items-center gap-2"
                onClick={() => setShowRingtones(true)}
              >
                {selectedRingtone.name}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <span>Repeat</span>
              <Button 
                variant="ghost" 
                className="text-primary flex items-center gap-2"
                onClick={() => setShowRepeat(true)}
              >
                {selectedRepeat.name}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <span>Vibrate when alarm sounds</span>
              <Switch
                checked={vibrationEnabled}
                onCheckedChange={setVibrationEnabled}
              />
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <span>Delete after alarm goes off</span>
              <FormField
                control={form.control}
                name="autoDelete"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
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
                        className="bg-secondary/20"
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

      <Dialog open={showRingtones} onOpenChange={setShowRingtones}>
        <DialogContent aria-describedby="ringtone-dialog-description">
          <DialogHeader>
            <DialogTitle>Select Ringtone</DialogTitle>
            <p id="ringtone-dialog-description" className="text-sm text-muted-foreground">
              Choose a ringtone for your alarm
            </p>
          </DialogHeader>
          <div className="space-y-2">
            {RINGTONES.map((ringtone) => (
              <Button
                key={ringtone.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setSelectedRingtone(ringtone);
                  preview(ringtone.id);
                  setShowRingtones(false);
                }}
              >
                {ringtone.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRepeat} onOpenChange={setShowRepeat}>
        <DialogContent aria-describedby="repeat-dialog-description">
          <DialogHeader>
            <DialogTitle>Repeat</DialogTitle>
            <p id="repeat-dialog-description" className="text-sm text-muted-foreground">
              Choose when to repeat this alarm
            </p>
          </DialogHeader>
          <div className="space-y-2">
            {REPEAT_OPTIONS.map((option) => (
              <Button
                key={option.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
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
