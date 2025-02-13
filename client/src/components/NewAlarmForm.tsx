
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
    const time = `${hours}:${minutes}`;
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
          Alarm in {hours} hours {minutes} minutes
        </p>

        <div className="flex justify-center items-center gap-8 mb-12">
          <button 
            className="text-4xl font-light text-muted-foreground focus:outline-none"
            onClick={() => setAmpm(ampm === "AM" ? "PM" : "AM")}
          >
            {ampm}
          </button>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={hours}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d{0,2}$/.test(val)) {
                  const num = parseInt(val || "0");
                  if (num >= 0 && num <= 12) {
                    setHours(val.padStart(2, '0'));
                  }
                }
              }}
              className="text-4xl font-light w-24 text-center bg-transparent border-none focus:outline-none"
            />
            <span className="text-4xl">:</span>
            <input
              type="text"
              value={minutes}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d{0,2}$/.test(val)) {
                  const num = parseInt(val || "0");
                  if (num >= 0 && num <= 59) {
                    setMinutes(val.padStart(2, '0'));
                  }
                }
              }}
              className="text-4xl font-light w-24 text-center bg-transparent border-none focus:outline-none"
            />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Ringtone</DialogTitle>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repeat</DialogTitle>
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
