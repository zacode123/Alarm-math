import { useState, useEffect, useContext, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { insertAlarmSchema } from "@shared/schema";
import { useAlarms } from "@/lib/useAlarms";

export function NewAlarmForm() {
  const [selectedRepeat, setSelectedRepeat] = useState({ id: 'once', label: 'Once' });
  const [expandedOption, setExpandedOption] = useState(null);
  const { toast } = useToast();
  const { createAlarm } = useAlarms();

  const form = useForm({
    resolver: zodResolver(insertAlarmSchema),
    defaultValues: {
      label: "",
      time: new Date(),
      repeat: "once",
      isEnabled: true
    }
  });

  const onSubmit = useCallback(async (data) => {
    try {
      await createAlarm(data);
      toast({ title: "Alarm created successfully!" });
      form.reset();
    } catch (error) {
      toast({ 
        title: "Failed to create alarm",
        variant: "destructive"
      });
    }
  }, [createAlarm, toast, form]);

  useEffect(() => {
    form.setValue("repeat", selectedRepeat.id);
  }, [selectedRepeat, form]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <div className="relative group">
          <Input
            placeholder=" "
            className="bg-muted/20 border border-input/50 focus:border-primary px-3 py-2"
            {...form.register("label")}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-all duration-200 group-focus-within:text-xs group-focus-within:-top-2 group-focus-within:translate-y-0 group-focus-within:text-primary peer-placeholder-shown:text-base">
            <span className="px-1 bg-background">Enter label</span>
          </span>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Create Alarm
      </Button>
    </form>
  );
}