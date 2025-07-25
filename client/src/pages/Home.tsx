import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAlarmSchema, type InsertAlarm } from "@shared/schema";
import { useAlarms } from "@/lib/useAlarms";
import { useMathProblem } from "@/lib/useMathProblem";
import { useSound } from "@/lib/useSound";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2, Check, History, Bell, Moon, BellRing, Vibrate } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { AlarmList } from "@/components/AlarmList";

type WeekDay = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

const DAYS: Array<{ value: WeekDay; label: string }> = [
  { value: "sun", label: "Sunday" },
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
];

const SOUNDS = {
  default: "default",
  digital: "digital",
  beep: "beep",
};

export default function Home() {
  const { toast } = useToast();
  const { alarms, createAlarm, deleteAlarm, updateAlarm } = useAlarms();
  const [activeAlarm, setActiveAlarm] = useState<number | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const { problem, generateProblem, checkAnswer } = useMathProblem("easy");
  const { play, stop, preview } = useSound();
  const [completedAlarms, setCompletedAlarms] = useState<Array<{ id: number, time: string, date: string }>>([]);
  const [previewVolume, setPreviewVolume] = useState(100);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [vibrationEnabled, setVibrationEnabled] = useState("vibrate" in navigator);
  const [isLoading, setIsLoading] = useState(true);


  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === "granted") {
          toast({
            title: "Notifications enabled",
            description: "You'll receive notifications when alarms go off.",
          });
        }
      });
    }
  }, [toast]);

  const form = useForm<InsertAlarm>({
    resolver: zodResolver(insertAlarmSchema),
    defaultValues: {
      time: "",
      days: DAYS.map(day => day.value),
      difficulty: "easy",
      sound: "default",
      volume: 100,
      enabled: true,
      autoDelete: false,
      vibration: vibrationEnabled,
      label: "",
    },
  });

  const watchDays = form.watch("days");

  const handleSelectAllDays = () => {
    form.setValue("days", DAYS.map(day => day.value));
  };

  const handleDeselectAllDays = () => {
    form.setValue("days", []);
  };

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentTime = format(now, "HH:mm");
      const currentDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()];

      alarms.forEach(alarm => {
        if (alarm.enabled && alarm.time === currentTime && alarm.days.includes(currentDay) && !activeAlarm) {
          setActiveAlarm(alarm.id);
          setSolvedCount(0);
          generateProblem();

          // Play sound
          try {
            play(alarm.sound as any, alarm.volume / 100);
          } catch (error) {
            console.warn('Sound playback not supported:', error);
          }

          // Vibrate if supported and enabled
          if ("vibrate" in navigator && alarm.vibration) {
            // Start continuous vibration pattern
            const startVibratePattern = () => {
              navigator.vibrate([200, 100, 200]);
              return setInterval(() => {
                navigator.vibrate([200, 100, 200]);
              }, 1000);
            };

            const vibrateInterval = startVibratePattern();

            // Store the interval ID to clear it when alarm is dismissed
            (window as any).vibrateInterval = vibrateInterval;
          }

          // Show notification only once and handle click
          if (notificationPermission === "granted" && !activeAlarm) {
            const now = new Date();
            const alarmTime = new Date();
            const [hours, minutes] = alarm.time.split(':').map(Number);
            alarmTime.setHours(hours, minutes, 0);

            // Only show notification if we're within 1 minute of alarm time
            if (Math.abs(now.getTime() - alarmTime.getTime()) <= 60000) {
              const notification = new Notification("Math Alarm", {
                body: "Click here to solve math problems and dismiss the alarm",
                icon: "/alarm-icon.png",
                requireInteraction: true,
                tag: 'math-alarm' // Ensures only one notification is shown
              });

              notification.onclick = () => {
                window.focus();
                setActiveAlarm(alarm.id);
                generateProblem();
              };

              // Auto-close notification after 1 minute
              setTimeout(() => {
                notification.close();
                if (alarm.autoDelete) {
                  deleteAlarm.mutate(alarm.id);
                } else {
                  updateAlarm.mutate({ id: alarm.id, enabled: false });
                }
                stop();
              }, 60000);
            }
          }

          if (alarm.autoDelete) {
            deleteAlarm.mutate(alarm.id);
          } else {
            // Disable the alarm after triggering if not set to auto-delete
            updateAlarm.mutate({ id: alarm.id, enabled: false });
          }
        }
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => {
      clearInterval(interval);
      // Clear vibration interval if it exists
      if ((window as any).vibrateInterval) {
        clearInterval((window as any).vibrateInterval);
        navigator.vibrate(0); // Stop vibration
      }
    };
  }, [alarms, activeAlarm, generateProblem, play, updateAlarm, deleteAlarm, notificationPermission]);

  // Add notification click handler
  useEffect(() => {
    const handleNotificationClick = () => {
      if (activeAlarm) {
        // Focus or open the window
        window.focus();
        // The math problems are already visible when activeAlarm is set
      }
    };

    if ("Notification" in window) {
      navigator.serviceWorker?.addEventListener('message', (event) => {
        if (event.data.type === 'NOTIFICATION_CLICK') {
          handleNotificationClick();
        }
      });
    }

    return () => {
      if ("Notification" in window) {
        navigator.serviceWorker?.removeEventListener('message', handleNotificationClick);
      }
    };
  }, [activeAlarm]);

  // Add loading effect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Reduced from 1500ms to 800ms for better UX
    return () => clearTimeout(timer);
  }, []);


  const onSubmit = (data: InsertAlarm) => {
    if (data.days.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day",
        variant: "destructive",
      });
      return;
    }

    createAlarm.mutate(data, {
      onSuccess: () => {
        form.reset();
        toast({
          title: "Alarm created",
          description: "Your alarm has been set successfully.",
        });
      },
    });
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = parseFloat((e.target as any).answer.value);
    if (checkAnswer(answer)) {
      const newSolvedCount = solvedCount + 1;
      setSolvedCount(newSolvedCount);

      if (newSolvedCount >= 3) {
        try {
          stop();
        } catch (error) {
          console.warn('Could not stop sound:', error);
        }
        const completedAlarm = alarms.find(a => a.id === activeAlarm);
        if (completedAlarm) {
          setCompletedAlarms(prev => [{
            id: completedAlarm.id,
            time: completedAlarm.time,
            date: format(new Date(), "MMM dd, yyyy")
          }, ...prev.slice(0, 9)]);
        }
        setActiveAlarm(null);
        setSolvedCount(0);
        toast({
          title: "Alarm completed",
          description: "Great job solving all math problems!",
        });
      } else {
        generateProblem();
        const remainingProblems = 3 - newSolvedCount;
        toast({
          title: `${newSolvedCount}/3 completed`,
          description: `Keep going! ${remainingProblems === 1 ? 'One more problem' : `${remainingProblems} more problems`} to solve.`,
        });
      }
      (e.target as HTMLFormElement).reset();
    } else {
      toast({
        title: "Wrong answer",
        description: "Try again!",
        variant: "destructive",
      });
    }
  };

  // Add preview sound handler
  const handlePreviewSound = (sound: string, volume?: number) => {
    preview(sound as keyof typeof SOUNDS, volume ?? previewVolume / 100);
  };

  const handleRenameAlarm = (id: number) => {
    // TODO: Implement rename functionality when requested
    toast({
      title: "Coming soon",
      description: "Rename functionality will be added in a future update.",
    });
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          <header className="flex items-center justify-between mb-8">
            <motion.div
              className="flex items-center gap-3"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
            >
              <Clock className="h-10 w-10 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Math Alarm</h1>
                <p className="text-muted-foreground">Stay sharp, wake up smart</p>
              </div>
            </motion.div>
          </header>

          <AnimatePresence>
            {activeAlarm && problem && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <Card className="border-primary animate-pulse">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold mb-6">Wake Up Challenge ({solvedCount + 1}/3)</h2>
                    <form onSubmit={handleAnswerSubmit} className="space-y-6">
                      <div className="text-2xl font-mono bg-secondary/10 p-4 rounded-lg text-center">
                        {problem.question}
                      </div>
                      <Input
                        type="number"
                        name="answer"
                        placeholder="Enter your answer"
                        className="text-center text-xl"
                        autoFocus
                      />
                      <Button type="submit" size="lg" className="w-full">
                        Check Answer
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Set New Alarm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                  handlePreviewSound(value);
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
                                          setPreviewVolume(value);
                                          // Preview the sound whenever volume changes
                                          handlePreviewSound(form.getValues("sound"), value / 100);
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

                        {notificationPermission !== "granted" && (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              if ("Notification" in window) {
                                Notification.requestPermission().then(setNotificationPermission);
                              }
                            }}
                          >
                            <BellRing className="h-4 w-4 mr-2" />
                            Enable notifications
                          </Button>
                        )}
                      </div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button type="submit" className="w-full" disabled={createAlarm.isPending}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Alarm
                        </Button>
                      </motion.div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5" />
                    Active Alarms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-muted-foreground">Loading alarms...</div>
                  ) : (
                    <AlarmList
                      alarms={alarms}
                      onDelete={(ids) => {
                        ids.forEach(id => deleteAlarm.mutate(id));
                        toast({
                          title: ids.length > 1 ? "Alarms deleted" : "Alarm deleted",
                          description: `Successfully deleted ${ids.length} alarm${ids.length > 1 ? 's' : ''}.`
                        });
                      }}
                      onRename={handleRenameAlarm}
                    />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Completions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {completedAlarms.length === 0 ? (
                    <div className="text-muted-foreground">No completed alarms yet</div>
                  ) : (
                    completedAlarms.map((alarm, index) => (
                      <div key={`${alarm.id}-${index}`} className="flex items-center gap-3 py-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{alarm.time}</div>
                          <div className="text-sm text-muted-foreground">{alarm.date}</div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}