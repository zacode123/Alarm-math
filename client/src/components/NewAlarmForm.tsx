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
import { X, Check } from "lucide-react";
import { format } from "date-fns";

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
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-6 w-6" />
        </Button>
        <h1 className="font-medium">Add alarm</h1>
        <Button variant="ghost" size="icon" onClick={form.handleSubmit(onSubmit)}>
          <Check className="h-6 w-6" />
        </Button>
      </div>

      <div className="p-4">
        <p className="text-sm text-muted-foreground text-center mb-8">
          Alarm in {format(new Date(`2000-01-01 ${hours}:${minutes} ${ampm}`), "HH")} hours {minutes} minutes
        </p>

        <div className="flex justify-center items-center gap-4 mb-12">
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="text-4xl font-light text-muted-foreground"
              onClick={() => setAmpm(ampm === "AM" ? "PM" : "AM")}
            >
              {ampm}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value.padStart(2, '0'))}
              className="text-4xl font-light w-24 text-center"
              min="1"
              max="12"
            />
            <span className="text-4xl">:</span>
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.padStart(2, '0'))}
              className="text-4xl font-light w-24 text-center"
              min="0"
              max="59"
            />
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-4">
            <div className="flex items-center justify-between py-4 border-t">
              <span>Ringtone</span>
              <Button variant="ghost" className="text-primary">
                Default ringtone (Morning dew)
              </Button>
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <span>Repeat</span>
              <Button variant="ghost" className="text-primary">
                Once
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
    </div>
  );
}