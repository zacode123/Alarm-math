import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAlarmSchema, type InsertAlarm } from "@shared/schema";
import { useAlarms } from "@/lib/useAlarms";
import { useMathProblem } from "@/lib/useMathProblem";
import { useSound } from "@/lib/useSound";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2 } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { alarms, isLoading, createAlarm, deleteAlarm } = useAlarms();
  const [activeAlarm, setActiveAlarm] = useState<number | null>(null);
  const { problem, generateProblem, checkAnswer } = useMathProblem("easy");
  const { play, stop } = useSound();

  const form = useForm<InsertAlarm>({
    resolver: zodResolver(insertAlarmSchema),
    defaultValues: {
      time: "",
      days: [],
      difficulty: "easy",
      sound: "default",
      enabled: true,
    },
  });

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const currentDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()];

      alarms.forEach(alarm => {
        if (alarm.enabled && alarm.time === currentTime && alarm.days.includes(currentDay) && !activeAlarm) {
          setActiveAlarm(alarm.id);
          generateProblem();
          play(alarm.sound as any);
        }
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [alarms, activeAlarm, generateProblem, play]);

  const onSubmit = (data: InsertAlarm) => {
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
      stop();
      setActiveAlarm(null);
      toast({
        title: "Alarm dismissed",
        description: "Good job solving the math problem!",
      });
    } else {
      toast({
        title: "Wrong answer",
        description: "Try again!",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Math Alarm Clock
          </h1>
        </header>

        {activeAlarm && problem && (
          <Card className="border-primary">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Solve to dismiss alarm!</h2>
              <form onSubmit={handleAnswerSubmit} className="space-y-4">
                <div className="text-xl">{problem.question}</div>
                <Input type="number" name="answer" placeholder="Enter your answer" />
                <Button type="submit">Check Answer</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createAlarm.isPending}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Alarm
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">Loading alarms...</CardContent>
            </Card>
          ) : (
            alarms.map((alarm) => (
              <Card key={alarm.id}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{alarm.time}</div>
                    <div className="text-sm text-muted-foreground">
                      {alarm.days.join(", ")} - {alarm.difficulty}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteAlarm.mutate(alarm.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
