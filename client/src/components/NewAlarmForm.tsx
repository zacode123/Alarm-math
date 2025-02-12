import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAlarmSchema, type InsertAlarm } from "@shared/schema";
import { useAlarms } from "@/lib/useAlarms";
import { useSound } from "@/lib/useSound";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

const DAYS = [
  { value: "sun", label: "Sunday" },
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
] as const;

type Day = typeof DAYS[number]['value'];

interface Alarm {
  time: string;
  days: Day[];
  difficulty: "easy" | "medium" | "hard";
  sound: "default" | "digital" | "beep";
  volume: number;
  enabled: boolean;
  autoDelete: boolean;
  vibration: boolean;
}


interface NewAlarmFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  defaultValues?: Alarm;
}

export function NewAlarmForm({ onSuccess, onCancel, defaultValues }: NewAlarmFormProps) {
  const { toast } = useToast();
  const { createAlarm } = useAlarms();
  const { preview } = useSound();
  const [vibrationEnabled, setVibrationEnabled] = useState(defaultValues?.vibration ?? ("vibrate" in navigator));

  const form = useForm<InsertAlarm>({
    resolver: zodResolver(insertAlarmSchema),
    defaultValues: defaultValues ?? {
      time: "",
      days: DAYS.map(day => day.value),
      difficulty: "easy",
      sound: "default",
      volume: 100,
      enabled: true,
      autoDelete: false
    },
  });

  const handleSelectAllDays = () => {
    form.setValue("days", DAYS.map(day => day.value));
  };

  const handleDeselectAllDays = () => {
    form.setValue("days", []);
  };

  const onSubmit = (data: InsertAlarm) => {
    if (data.days.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day",
        variant: "destructive",
      });
      return;
    }

    const alarmData = {
      ...data,
      vibration: vibrationEnabled
    };

    createAlarm.mutate(alarmData, {
      onSuccess: () => {
        form.reset();
        toast({
          title: "Alarm created",
          description: "Your alarm has been set successfully.",
        });
        onSuccess?.();
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="container mx-auto max-w-md px-4 py-8 flex-1 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Set up alarm</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      placeholder="HH:MM"
                      className="text-xl font-mono tracking-wider"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="days"
              render={() => (
                <FormItem>
                  <FormLabel>Repeat Days</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllDays}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAllDays}
                      >
                        Deselect All
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {DAYS.map((day) => (
                        <FormField
                          key={day.value}
                          control={form.control}
                          name="days"
                          render={({ field }) => (
                            <FormItem
                              key={day.value}
                              className="flex flex-row items-center space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Switch
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, day.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== day.value
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {day.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sound"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sound</FormLabel>
                  <div className="space-y-4">
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        preview(value as "default" | "digital" | "beep");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sound" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="beep">Beep</SelectItem>
                      </SelectContent>
                    </Select>

                    <FormField
                      control={form.control}
                      name="volume"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Volume</FormLabel>
                          <div className="flex items-center gap-4">
                            <Slider
                              className="flex-1"
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value ?? 100]}
                              onValueChange={([value]) => {
                                field.onChange(value);
                                preview(form.getValues("sound") as "default" | "digital" | "beep", value / 100);
                              }}
                            />
                            <span className="w-12 text-right">{field.value ?? 100}%</span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="autoDelete"
                render={({ field }) => (
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto Delete</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Delete alarm after it goes off
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </div>
                )}
              />

              {"vibrate" in navigator && (
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Vibration</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Vibrate when alarm goes off
                    </p>
                  </div>
                  <Switch
                    checked={vibrationEnabled}
                    onCheckedChange={setVibrationEnabled}
                  />
                </div>
              )}
            </div>

          </form>
        </Form>
      </div>
      <div className="sticky bottom-0 pt-4 bg-white space-y-2">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          onClick={form.handleSubmit(onSubmit)}
          disabled={createAlarm.isPending}
        >
          {defaultValues ? 'Edit Alarm' : 'Set Alarm'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onCancel} 
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );
}