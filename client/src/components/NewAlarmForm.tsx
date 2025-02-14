import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAlarmSchema, type InsertAlarm, type Alarm, type WeekDay, type Difficulty } from "@shared/schema";
import { useAlarms } from "@/lib/useAlarms";
import { useSound, DEFAULT_SOUNDS } from "@/lib/useSound";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { X, Check, ChevronRight, Calendar, RepeatIcon, Repeat1, CalendarDays, Settings2, Volume2, Music2 } from "lucide-react";
import { format } from "date-fns";
import { TimePicker } from "@/components/ui/time-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RingtoneCard } from "@/components/ui/ringtone-card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useCallback, useMemo } from 'react';

function useRingtones() {
  const { customRingtones } = useSound();
  const defaultRingtones = Object.entries(DEFAULT_SOUNDS).map(([id, path]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    path
  }));

  return [...defaultRingtones, ...customRingtones.map(rt => ({
    id: rt.id || `custom-${rt.name}`,
    name: rt.name,
    path: rt.url
  }))];
}

const REPEAT_OPTIONS = [
  { id: 'once', name: 'Once', icon: Calendar },
  { id: 'daily', name: 'Daily', icon: RepeatIcon },
  { id: 'weekdays', name: 'Weekdays', icon: Repeat1 },
  { id: 'weekends', name: 'Weekends', icon: CalendarDays },
  { id: 'custom', name: 'Custom', icon: Settings2 },
];

export function NewAlarmForm({ onSuccess, onCancel, defaultValues }: {
  onSuccess: () => void;
  onCancel: () => void;
  defaultValues?: Alarm;
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

  const allRingtones = useRingtones();
  const [showRingtones, setShowRingtones] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [selectedRingtone, setSelectedRingtone] = useState(() => {
    const ringtones = allRingtones;
    return ringtones.find(r => r.id === defaultValues?.sound) || ringtones[0] || { id: 'default', name: 'Default', path: '/sounds/default.mp3' };
  });
  const [originalRingtone, setOriginalRingtone] = useState(selectedRingtone);
  const [selectedRepeat, setSelectedRepeat] = useState(REPEAT_OPTIONS[0]);
  const [originalRepeat, setOriginalRepeat] = useState(REPEAT_OPTIONS[0]);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: true
  });
  const [previewVolume, setPreviewVolume] = useState(100); // Added state for preview volume

  useEffect(() => {
    const updateTimeRemaining = () => {
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
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [selectedDate]);

  const form = useForm<InsertAlarm>({
    resolver: zodResolver(insertAlarmSchema),
    defaultValues: defaultValues ? {
      time: defaultValues.time,
      days: defaultValues.days as WeekDay[],
      difficulty: defaultValues.difficulty as Difficulty,
      sound: defaultValues.sound,
      volume: defaultValues.volume,
      enabled: defaultValues.enabled,
      autoDelete: defaultValues.autoDelete,
      vibration: defaultValues.vibration,
      label: defaultValues.label
    } : {
      time: format(new Date(), "HH:mm"),
      days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as WeekDay[],
      difficulty: "easy" as Difficulty,
      sound: selectedRingtone.id,
      volume: 100,
      enabled: true,
      autoDelete: false,
      vibration: vibrationEnabled,
      label: ""
    },
  });

  const onSubmit = async (data: InsertAlarm) => {
    try {
      const formattedTime = format(selectedDate, "HH:mm");
      const alarmData = {
        ...data,
        time: formattedTime,
        vibration: vibrationEnabled,
        sound: selectedRingtone.id,
        created: Math.floor(Date.now() / 1000)
      };

      if (defaultValues?.id) {
        await updateAlarm.mutateAsync({
          id: defaultValues.id,
          ...alarmData
        });
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
      console.error('Error saving alarm:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save alarm. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRingtoneSelect = (ringtone: typeof allRingtones[0]) => {
    setSelectedRingtone(ringtone);
    form.setValue('sound', ringtone.id);
    preview(ringtone.path, previewVolume / 100).catch(error => {
      console.error('Error previewing ringtone:', error);
      toast({
        title: "Preview Error",
        description: "Could not preview the selected ringtone",
        variant: "destructive",
      });
    });
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const confirmRingtoneSelection = () => {
    setShowRingtones(false);
  };

  const confirmRepeatSelection = () => {
    setShowRepeat(false);
  };

  return (
    <div className="flex flex-col h-full bg-background">
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
            <div className="flex items-center justify-between py-4 border-t">
              <span className="text-[15px] font-medium tracking-wide">Ringtone</span>
              <Button
                type="button"
                variant="ghost"
                className="text-primary text-[15px] flex items-center gap-2 hover:bg-transparent p-0 font-medium"
                onClick={() => {
                  setOriginalRingtone(selectedRingtone);
                  setShowRingtones(true);
                }}
              >
                {selectedRingtone.name}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <span className="text-[15px] font-medium tracking-wide">Repeat</span>
              <Button
                type="button"
                variant="ghost"
                className="text-primary text-[15px] flex items-center gap-2 hover:bg-transparent p-0 font-medium"
                onClick={() => {
                  setOriginalRepeat(selectedRepeat);
                  setShowRepeat(true);
                }}
              >
                {selectedRepeat.name}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <span className="text-[15px] font-medium tracking-wide">Vibrate when alarm sounds</span>
              <Switch
                checked={vibrationEnabled}
                onCheckedChange={setVibrationEnabled}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex items-center justify-between py-4 border-t">
              <span className="text-[15px] font-medium tracking-wide">Delete after goes off</span>
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

            <FormField
              control={form.control}
              name="volume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    Volume
                    <span className="text-sm text-muted-foreground">{field.value}%</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={([value]) => {
                          field.onChange(value);
                          setPreviewVolume(value);
                          // Debounce the preview to prevent rapid audio playback
                          const timeoutId = setTimeout(() => {
                            preview(originalRingtone.path, value / 100);
                          }, 200);
                          return () => clearTimeout(timeoutId);
                        }}
                        className="[&_.relative]:before:content-[''] [&_.relative]:before:absolute [&_.relative]:before:left-0 [&_.relative]:before:right-0 [&_.relative]:before:h-2 [&_.relative]:before:bg-gradient-to-r [&_.relative]:before:from-primary/20 [&_.relative]:before:to-primary [&_.relative]:before:rounded-full"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Difficulty</FormLabel>
                  <div className="grid grid-cols-3 gap-4">
                    {['easy', 'medium', 'hard'].map((difficulty) => (
                      <motion.div
                        key={difficulty}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => field.onChange(difficulty)}
                        className={cn(
                          "cursor-pointer rounded-lg p-4 text-center transition-colors duration-200",
                          field.value === difficulty
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        <motion.div
                          initial={{ scale: 1 }}
                          animate={field.value === difficulty ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <div className="py-4 border-t relative group">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder=" "
                          className="bg-muted/20 border border-input/50 focus:border-primary px-3 py-2"
                          {...field}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-all duration-200 group-focus-within:text-xs group-focus-within:-top-2 group-focus-within:translate-y-0 group-focus-within:text-primary peer-placeholder-shown:text-base">
                          <span className="px-1 bg-background">Enter label</span>
                        </span>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>

        <Dialog open={showRingtones} onOpenChange={setShowRingtones}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="px-6 pt-6 pb-2 flex items-center justify-between border-b relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedRingtone(originalRingtone);
                  setShowRingtones(false);
                }}
                className="hover:bg-transparent absolute left-4"
                aria-label="Close ringtones dialog"
              >
                <X className="h-6 w-6" />
              </Button>
              <DialogTitle className="text-xl font-semibold flex-1 text-center">Select Ringtone</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={confirmRingtoneSelection}
                className="hover:bg-transparent absolute right-4"
                aria-label="Confirm ringtone selection"
              >
                <Check className="h-6 w-6" />
              </Button>
            </DialogHeader>
            <DialogDescription className="text-center pt-2">
              Choose a ringtone for your alarm. Click to preview the sound.
            </DialogDescription>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <AnimatePresence>
                {allRingtones.map((ringtone) => (
                  <motion.div
                    key={ringtone.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Card
                      className={cn(
                        "p-4 cursor-pointer border-2 transition-colors duration-200",
                        selectedRingtone.id === ringtone.id
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => handleRingtoneSelect(ringtone)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              selectedRingtone.id === ringtone.id
                                ? "bg-primary"
                                : "bg-muted"
                            )}
                            animate={{
                              rotate: selectedRingtone.id === ringtone.id ? [0, 360] : 0,
                              scale: selectedRingtone.id === ringtone.id ? [1, 1.1, 1] : 1
                            }}
                            transition={{
                              duration: 0.5,
                              ease: "easeInOut"
                            }}
                          >
                            <Music2
                              className={cn(
                                "h-5 w-5 transition-colors duration-200",
                                selectedRingtone.id === ringtone.id
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground"
                              )}
                            />
                          </motion.div>
                          <span>{ringtone.name}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showRepeat} onOpenChange={setShowRepeat}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="px-6 pt-6 pb-2 flex items-center justify-between border-b relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowRepeat(false)}
                className="hover:bg-transparent absolute left-4"
                aria-label="Close repeat dialog"
              >
                <X className="h-6 w-6" />
              </Button>
              <DialogTitle className="text-xl font-semibold flex-1 text-center">Repeat</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={confirmRepeatSelection}
                className="hover:bg-transparent absolute right-4"
                aria-label="Confirm repeat selection"
              >
                <Check className="h-6 w-6" />
              </Button>
            </DialogHeader>
            <DialogDescription className="text-center pt-2">
              Choose when you want this alarm to repeat.
            </DialogDescription>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <AnimatePresence>
                {REPEAT_OPTIONS.map((option) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Card
                      className={cn(
                        "p-4 cursor-pointer border-2 transition-colors duration-200",
                        (expandedOption === option.id || selectedRepeat.id === option.id)
                          ? "border-primary bg-primary/10"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => {
                        if (option.id === 'custom') {
                          if (expandedOption === 'custom') {
                            setExpandedOption(null);
                          } else {
                            setExpandedOption('custom');
                            setSelectedRepeat(option);
                          }
                        } else {
                          setSelectedRepeat(option);
                          setExpandedOption(null);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200",
                              (expandedOption === option.id || selectedRepeat.id === option.id)
                                ? "bg-primary"
                                : "bg-muted"
                            )}
                            animate={{
                              rotate: (expandedOption === option.id || selectedRepeat.id === option.id) ? [0, 360] : 0,
                              scale: (expandedOption === option.id || selectedRepeat.id === option.id) ? [1, 1.1, 1] : 1
                            }}
                            transition={{
                              duration: 0.5,
                              ease: "easeInOut"
                            }}
                          >
                            {option.icon && (
                              <option.icon
                                className={cn(
                                  "h-5 w-5 transition-colors duration-200",
                                  (expandedOption === option.id || selectedRepeat.id === option.id)
                                    ? "text-primary-foreground"
                                    : "text-muted-foreground"
                                )}
                              />
                            )}
                          </motion.div>
                          <span className={cn(
                            "text-base transition-colors duration-200",
                            (expandedOption === option.id || selectedRepeat.id === option.id)
                              ? "text-primary font-medium"
                              : "text-foreground"
                          )}>
                            {option.name}
                          </span>
                        </div>
                        {option.id === 'custom' && (
                          <motion.div
                            animate={{
                              rotate: expandedOption === 'custom' ? 90 : 0
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </motion.div>
                        )}
                      </div>
                    </Card>
                    {option.id === 'custom' && (
                      <AnimatePresence>
                        {expandedOption === 'custom' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, y: -20 }}
                            animate={{
                              height: 'auto',
                              opacity: 1,
                              y: 0,
                              transition: {
                                height: {
                                  duration: 0.3,
                                  ease: "easeOut"
                                },
                                opacity: {
                                  duration: 0.2,
                                  delay: 0.1
                                },
                                y: {
                                  duration: 0.3,
                                  ease: "easeOut"
                                }
                              }
                            }}
                            exit={{
                              height: 0,
                              opacity: 0,
                              y: -20,
                              transition: {
                                height: {
                                  duration: 0.3,
                                  ease: "easeIn"
                                },
                                opacity: {
                                  duration: 0.2
                                },
                                y: {
                                  duration: 0.2
                                }
                              }
                            }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 py-2 space-y-3 bg-muted/50 rounded-lg mt-2">
                              {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                                <motion.div
                                  key={day}
                                  initial={{ x: -20, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                  className="flex items-center justify-between bg-background p-3 rounded-md"
                                >
                                  <span className="capitalize font-medium">{day}</span>
                                  <Switch
                                    checked={selectedDays[day]}
                                    onCheckedChange={() => handleDayToggle(day)}
                                    className="data-[state=checked]:bg-primary"
                                  />
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}